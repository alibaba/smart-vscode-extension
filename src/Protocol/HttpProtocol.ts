import axios from 'axios';
import Config from "../Common/Config";
import { Context } from "../Context";
import { NetworkError } from "../Error/SmartVscodeError";
import Protocol from "./Protocol";

export default class HttpProtocol extends Protocol {
    public url: string;
    public starUrl: string;

    constructor(config: Config) {
        super(config);
        this.url = this.getUrl(config.llm4apiServiceBaseIPChina, config.llm4apiServicePort);
        this.starUrl = this.getUrl(config.llm4apiServiceBaseIPChina, config.llm4apiStarServicePort);
        this.routeByIp();
    }

    private getUrl(ip: string, port: string) {
        return `http://${ip}:${port}`;
    }

    private async routeByIp() {
        const isDomestic = await this.isDomesticIp();
        let ip = isDomestic ? this.config.llm4apiServiceBaseIPChina : this.config.llm4apiServiceBaseIPGlobal;
        this.url = this.getUrl(ip, this.config.llm4apiServicePort);
        this.starUrl = this.getUrl(ip, this.config.llm4apiStarServicePort);
    }

    private async isDomesticIp() {
        try {
            const response = await axios.get(`http://ip-api.com/json/`);
            return response.data.countryCode === 'CN'; // 只判断国家
        } catch (error) {
            console.error('Error checking IP:', error);
            return true; // 如果查询失败，默认返回国内
        }
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

    public queryCallCount(userId: string) {
        return this.post("/queryCallCount", { userId: userId });
    }

    // 函数：发送一个HTTP Post请求
    private async post(url: string, data: object) {

        let fullUrl = this.url + url;

        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
            });
            return await response.json();
        } catch (error) {
            throw new NetworkError();
        }
    }
}