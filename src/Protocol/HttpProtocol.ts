import Config from "../config";

export default class HttpProtocol {
    public config: Config;

    public url: string;

    constructor(config: Config) {
        this.config = config;
        this.url = config.llm4apis_service_base_url;
    }

    public sendUserQuestion(user_question: string) {
        return this.post("/start", { user_question: user_question });
    }

    public sendApisResult(apiJsons: string) {
        return this.post("/handle_api_results", { apis: apiJsons });
    }

    public stopTask() {
        return this.post("/stopTask", {});
    }

    // 函数：发送一个HTTP Post请求
    private async post(url: string, data: object) {
        const full_url = this.config.llm4apis_service_base_url + url;
        const response = await fetch(full_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
}