import { v4 as uuid } from 'uuid';
import Api from "./Apis/Api";
import ApiExecuteData from "./Apis/ApiExecuteData";
import ApiScheduler from "./Apis/ApiScheduler";
import Config from "./Common/Config";
import { TaskResponseEnum } from "./Common/enum";
import { Context } from "./Context";
import ArgumentMissingError from "./Error/ArgumentMissingError";
import TaskStopError from "./Error/TaskStopError";
import HttpProtocol from "./Protocol/HttpProtocol";
import Protocol from "./Protocol/Protocol";
import { Chat } from "./ViewProvider";




export default class ChatPipeline {
    public config: Config;

    protected backendService: Protocol;

    protected apiScheduler: ApiScheduler;

    private apiConfirmed: ((value: unknown) => void) | null = null;

    private userId: string;

    private sessionId: string;

    private userInput = "";

    constructor(config: Config, apiScheduler: ApiScheduler, userId: string) {
        this.config = config;
        this.backendService = new HttpProtocol(this.config);
        this.apiScheduler = apiScheduler;
        this.userId = userId;
        this.sessionId = uuid();
    }

    public async init() {
    }

    public async acceptApi() {
        if (this.apiConfirmed) {
            this.apiConfirmed(true);
            this.apiConfirmed = null;
        }
    }

    public async refuseApi() {
        if (this.apiConfirmed) {
            this.apiConfirmed(false);
            this.apiConfirmed = null;
        }
    }

    public async run(userQuestion: string, chat: Chat, isTest: boolean = false, testAnswer: string = "") {
        this.userInput = userQuestion;
        this.sessionId = uuid();
        let actionResponse = await this.backendService.sendUserQuestion(new Context(this.userId, this.sessionId, userQuestion, isTest, testAnswer));
        await this.interactionLoop(actionResponse, chat);
    }

    public async interactionLoop(actionResponse, chat: Chat) {
        let interactionCount = 0;
        while (interactionCount < this.config.maxIterationCount) {
            try {
                const status = actionResponse['status'];
                if (status === TaskResponseEnum.taskFinished) {
                    chat.sendMsgToUser("Task has been finished.");
                    await this.backendService.finish(new Context(this.userId, this.sessionId));
                    break;
                } else if (status === TaskResponseEnum.apiCall) {
                    const apiJson = actionResponse["data"]["apis"][0];
                    const api: Api = this.apiScheduler.getApi(apiJson["name"]);

                    const doConfirm = api.needConfirm && !this.config.testMode;

                    // require user to confirm the api execution
                    const confirmResult = await chat.sendMsgToUser(api.toUserMsg, doConfirm);

                    // if user refuse to execute the api, stop the task
                    if (!confirmResult) {
                        throw new TaskStopError();
                    }

                    // execute the api
                    const apiExecuteData: ApiExecuteData = await api.run(apiJson["arguments"], chat);

                    // send the api message to user
                    if (apiExecuteData.toUserMsg !== undefined) {
                        chat.sendMsgToUser(apiExecuteData.toUserMsg, false);
                    }

                    // if the error is not corrected when the api is executed
                    if (apiExecuteData.stopTask) {
                        throw new TaskStopError();
                    }

                    // if the api is terminal and it is success. The task has been finished.
                    if (apiExecuteData.success && this.isTerminalApi(actionResponse)) {
                        chat.sendMsgToUser("Task has been finished.");
                        await this.backendService.finish(new Context(this.userId, this.sessionId));
                        break;
                    } else {
                        apiJson["result"] = apiExecuteData.toModelMsg;
                        actionResponse = await this.backendService.sendApisResult(new Context(this.userId, this.sessionId, actionResponse["data"]["apis"]));
                    }
                } else if (status === TaskResponseEnum.taskFailed) {
                    chat.sendMsgToUser("Task failure may be due to insufficient APIs or task complexity.");
                    await this.backendService.finish(new Context(this.userId, this.sessionId));
                    break;
                } else if (status === TaskResponseEnum.taskCanceled) {
                    break;
                } else if (status === TaskResponseEnum.taskQuestion) {
                    chat.responseQuestion(this.userInput);
                    break;
                } else if (status === TaskResponseEnum.taskException) {
                    const msg = actionResponse["data"]["msg"];
                    chat.sendMsgToUser("Task exception: " + msg);
                    break;
                } else {
                    throw new Error("Unknown status: " + status);
                }
                interactionCount += 1;
            } catch (error) {
                if (error instanceof TaskStopError) {
                    chat.sendMsgToUser("Task has been cancelled.");
                    await this.backendService.finish(new Context(this.userId, this.sessionId));
                    return;
                } else if (error instanceof ArgumentMissingError) {
                    chat.sendMsgToUser("" + error, false);
                    actionResponse["data"]["apis"][0]["result"] = "" + error;
                    actionResponse = await this.backendService.sendApisResult(new Context(this.userId, this.sessionId, actionResponse["data"]["apis"]));
                }
                else {
                    chat.sendMsgToUser("" + error, false);
                    await this.backendService.finish(new Context(this.userId, this.sessionId));
                    throw error;
                }
            }
        }
    }

    public stopTask() {
        this.backendService.cancel(new Context(this.userId, this.sessionId));
    }

    public isTerminalApi(actionResponse: Object) {
        return actionResponse["data"]["isTerminal"];
    }

}