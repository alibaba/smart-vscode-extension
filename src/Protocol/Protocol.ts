import Config from "../Common/Config";
import { Context } from "../Context";

export default abstract class Protocol {
    protected config: Config;
    constructor(config: Config) {
        this.config = config;
    }
    // public abstract getApiCall(): ApiCall;
    public abstract addMetaData(context: Context);

    public abstract sendUserQuestion(context: Context);

    public abstract sendApisResult(context: Context);

    public abstract finish(context: Context);

    public abstract cancel(context: Context);

}