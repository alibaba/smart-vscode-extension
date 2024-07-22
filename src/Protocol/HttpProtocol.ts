import Config from "../Common/Config";
import { Context } from "../Context";
import Protocol from "./Protocol";

export default class HttpProtocol extends Protocol {
    public url: string;

    constructor(config: Config) {
        super(config);
        this.url = config.llm4apisServiceBaseUrl;
    }

    public addMetaData(context: Context) {
        return this.post("/addMetaData", context.toObject());
    }

    public sendUserQuestion(context: Context) {
        return this.post("/start", context.toObject());
    }

    public sendApisResult(context: Context) {
        return this.post("/handleApiResponse", context.toObject());
    }

    public finish(context: Context) {
        return this.post("/finish", context.toObject());
    }

    public cancel(context: Context) {
        return this.post("/cancel", context.toObject());
    }

    // 函数：发送一个HTTP Post请求
    private async post(url: string, data: object) {
        const fullUrl = this.config.llm4apisServiceBaseUrl + url;
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}