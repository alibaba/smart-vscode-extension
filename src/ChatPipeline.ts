import ApiScheduler from "./Api/ApiScheduler";
import Config from "./config";
import HttpProtocol from "./Protocol/HttpProtocol";
import Protocol from "./Protocol/Protocol";
import TaskStopError from "./Error/TaskStopError";



export default class ChatPipeline {
    public config: Config;

    protected interact_protocol: Protocol;

    protected apiScheduler: ApiScheduler;

    constructor(config: Config, apiScheduler: ApiScheduler) {
        this.config = config;
        this.interact_protocol = new HttpProtocol(this.config);
        this.apiScheduler = apiScheduler;
    }

    public async run(user_question: string) {
        let interaction_count = 0;
        let action_response = await this.interact_protocol.sendUserQuestion(user_question);

        while (interaction_count < this.config.maxIterationCount) {
            try {
                const status = action_response['status'];
                if (status === 'Task Finished') {
                    console.log("Task has been finished.");
                    break;
                } else if (status === 'api_call') {
                    const apiJsons = await this.apiScheduler.runApis(action_response["data"]["apis"]);
                    action_response = await this.interact_protocol.sendApisResult(apiJsons);
                    console.log("API call finished.");
                } else if (status === "Task Failed") {
                    console.log("Task failed.");
                    break;
                } else {
                    throw new Error("Unknown status: " + status);
                }
                interaction_count += 1;
                console.log("Interaction count: " + interaction_count);
            } catch (error) {
                if (error instanceof TaskStopError) {
                    await this.interact_protocol.stopTask();
                    console.log("Task has been cancelled.");
                    return;
                } else {
                    throw error;
                }
            }
        }
        console.log("Interaction count: " + interaction_count);
    }
}