import 'reflect-metadata';
import Api from "./Api";


export default class ApiScheduler {
    private static instance: ApiScheduler;
    public name2Api: { [key: string]: Api; };

    // 私有构造函数，防止外部直接通过new来创建实例
    private constructor() {
        this.name2Api = {};
    }

    // 提供一个静态方法用于获取这个唯一实例
    public static getInstance(): ApiScheduler {
        if (!ApiScheduler.instance) {
            ApiScheduler.instance = new ApiScheduler();
        }
        return ApiScheduler.instance;
    }

    public registerApi(name: string, parameters: string[], executer: (...args: any[]) => any, toUserMsg: string, needConfirm: boolean) {
        const api = new Api(name, parameters, executer, toUserMsg, needConfirm);
        this.name2Api[name] = api;
    }

    public getApi(name: string) {
        return this.name2Api[name];
    }

    public async runApis(apiJsons: string) {
        apiJsons = JSON.parse(apiJsons);
        for (let apiJson of apiJsons) {
            const api = this.selectApi(apiJson);
            apiJson["result"] = await api.run(apiJson["arguments"], undefined);
        }
        return JSON.stringify(apiJsons);
    }

    protected selectApi(apiJson: Object) {
        return this.name2Api[apiJson['name']];
    }

}

export function registerApi(toUserMsg: string, needToConfirm: boolean = false) {
    // 返回实际的装饰器函数
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const apiScheduler = ApiScheduler.getInstance(); // 获取单例实例
        const name = String(propertyKey);
        const method = descriptor.value.bind(target);
        const parameters = getParameterNames(descriptor.value);
        apiScheduler.registerApi(name, parameters, method, toUserMsg, needToConfirm);
    };
}


function getParameterNames(func: Function): string[] {
    // 转换函数为字符串
    const functionAsString = func.toString();

    // 正则匹配以获取参数部分
    const parametersString = functionAsString.slice(
        functionAsString.indexOf('(') + 1,
        functionAsString.indexOf(')')
    );

    // 清除参数字符串中的注释和空白符，并分割成数组
    const parameters = parametersString.replace(/\/\*.*?\*\//g, '').replace(/\s/g, '').split(',');

    // 过滤掉空字符串
    return parameters.filter(parameter => parameter !== '');
}