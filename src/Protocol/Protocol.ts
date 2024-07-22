import ApiCall from "../Api/ApiCall";

export default abstract class Protocol {
    // public abstract getApiCall(): ApiCall;

    public abstract sendUserQuestion(content: string);

    public abstract sendApisResult(content: string);

    public abstract stopTask();
}