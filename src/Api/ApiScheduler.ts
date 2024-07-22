import Api from "./api";

export default class ApiScheduler {
    public name2Apis: Object;

    constructor() {
        this.name2Apis = {};
    }

    public registerApi(api: Api) {
        this.name2Apis[api.name] = api;
    }

    public async runApis(apiJsons: string) {
        apiJsons = JSON.parse(apiJsons);
        const name2ApiResult: Object = {};
        for (let apiJson of apiJsons) {
            const api = this.selectApi(apiJson);
            apiJson["result"] = await api.run(apiJson["arguments"]);
        }
        return JSON.stringify(apiJsons);
    }

    protected selectApi(apiJson: Object) {
        return this.name2Apis[apiJson['name']];
    }

}