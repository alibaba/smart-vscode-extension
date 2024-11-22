import { v4 as uuid } from 'uuid';
import Api from "./Apis/Api";
import ApiExecuteData from "./Apis/ApiExecuteData";
import ApiScheduler from "./Apis/ApiScheduler";
import Config from "./Common/Config";
import Constants from "./Common/Constants";
import { TaskResponseEnum } from "./Common/enum";
import { Context } from "./Context";
import TaskStopError, { ApiKeyMissingError, ArgumentMissingError, NetworkError } from "./Error/SmartVscodeError";
import HttpProtocol from "./Protocol/HttpProtocol";
import { Chat } from "./ViewProvider";




export default class ChatPipeline {
    public config: Config;

    protected backendService: HttpProtocol;

    protected apiScheduler: ApiScheduler;

    private apiConfirmed: ((value: unknown) => void) | null = null;

    private userId: string;

    private has_quota: boolean = true;

    public maxFreeCallCount: number;

    public remainFreeCallCount = 0;

    public starUrl: string = "";

    private sessionId: string;

    private userInput = "";

    private isSendTaskCancelledMsg = false;

    private chat: Chat | null = null;

    private context!: Context;

    constructor(config: Config, apiScheduler: ApiScheduler, userId: string) {
        this.config = config;
        this.backendService = new HttpProtocol(this.config);
        this.apiScheduler = apiScheduler;
        this.userId = userId;
        this.sessionId = uuid();
        this.maxFreeCallCount = this.config.maxFreeCallCount;
        this.starUrl = this.backendService.starUrl;
    }

    public async refreshCallCount() {
        let res = await this.backendService.queryCallCount(this.userId);
        this.has_quota = res.has_quota;
        let freeCallCount = res.call_count;
        this.maxFreeCallCount = this.has_quota ? this.config.maxFreeCallCount : 0;
        this.remainFreeCallCount = this.maxFreeCallCount - freeCallCount;
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
        this.chat = chat;
        this.isSendTaskCancelledMsg = false;
        this.userInput = userQuestion;
        this.sessionId = uuid();
        let enable_free_tongyi_token = this.has_quota && this.remainFreeCallCount > 0 && Context.isUsedTongYiModel();
        this.context = new Context(this.userId, this.sessionId, userQuestion, isTest, testAnswer, this.config.version, enable_free_tongyi_token);
        try {
            let actionResponse = await this.backendService.sendUserQuestion(this.context);
            await this.interactionLoop(actionResponse, chat);
        } catch (error) {
            if (error instanceof NetworkError || error instanceof ApiKeyMissingError) {
                chat.sendMsgToUser(error.message, false);
            }
            else {
                chat.sendMsgToUser(error + "", false);
                await this.backendService.finish(this.context);
                throw error;
            }
        }
        if (enable_free_tongyi_token) {
            await this.refreshCallCount();
            chat.sendMsgToUser(`You have ${this.remainFreeCallCount} remaining free uses of the Tongyi model.`);
        }
    }

    public async interactionLoop(actionResponse, chat: Chat) {
        let interactionCount = 0;
        while (interactionCount < this.config.maxIterationCount) {
            try {
                const status = actionResponse['status'];
                if (status === TaskResponseEnum.taskFinished) {
                    chat.sendMsgToUser("Task has been finished.");
                    await this.backendService.finish(this.context);
                    break;
                } else if (status === TaskResponseEnum.apiCall) {
                    const apiJson = actionResponse["data"]["apis"][0];
                    const api: Api = this.apiScheduler.getApi(apiJson["name"]);

                    const doConfirm = api.needConfirm && !this.config.testMode;

                    let toUserMsg = api.toUserMsg;

                    // if the api user msg need to be imputated, replace the placeholder with the arguments
                    if (api.hasPlaceholder()) {
                        let values = api.parseValues(apiJson["arguments"], chat);
                        let placeHolder = "";
                        if (api.name == "setProperties") {
                            values[0] = JSON.stringify(values[0], null, 2).replace(/"/g, '');
                            values[1] = values[1] ? "globally" : "locally";
                        }
                        placeHolder = values.join(', ');
                        if (api.name == "insertContentToFile") {
                            placeHolder = values[0] as string || '';
                        }
                        toUserMsg = api.toUserMsg.replace('[placeholder]', placeHolder);
                    }

                    // require user to confirm the api execution
                    const confirmResult = await chat.sendMsgToUser(toUserMsg, doConfirm);

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
                        await this.backendService.finish(this.context);
                        break;
                    } else {
                        apiJson["result"] = apiExecuteData.toModelMsg;
                        this.context.content = actionResponse["data"]["apis"];
                        actionResponse = await this.backendService.sendApisResult(this.context);
                    }
                } else if (status === TaskResponseEnum.taskFailed) {
                    chat.sendMsgToUser(actionResponse["data"]["msg"]);
                    break;
                } else if (status === TaskResponseEnum.taskCanceled) {
                    this.sendTaskCancelledMsg();
                    break;
                } else if (status === TaskResponseEnum.taskQuestion) {
                    // chat.responseQuestion(this.userInput);
                    chat.sendMsgToUser(Constants.INPUT_QUESTION_MSG);
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
                    await this.backendService.finish(this.context);
                    return;
                } else if (error instanceof ArgumentMissingError) {
                    chat.sendMsgToUser(error.message, false);
                    actionResponse["data"]["apis"][0]["result"] = "" + error;
                    this.context.content = actionResponse["data"]["apis"];
                    actionResponse = await this.backendService.sendApisResult(this.context);
                }
                else {
                    throw error;
                }
            }
        }
    }

    private sendTaskCancelledMsg() {
        if (!this.isSendTaskCancelledMsg) {
            this.chat?.sendMsgToUser(Constants.TASK_FAILED_MSG);
        }
        this.isSendTaskCancelledMsg = true;
    }

    public stopTask() {
        this.backendService.cancel(this.context);
        this.sendTaskCancelledMsg();
    }

    public isTerminalApi(actionResponse: Object) {
        return actionResponse["data"]["isTerminal"];
    }

}