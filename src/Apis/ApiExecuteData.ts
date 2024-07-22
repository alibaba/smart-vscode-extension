export default class ApiExecuteData {
    public success: boolean;

    public toModelMsg: string;

    public toUserMsg: string | undefined;

    public stopTask = false;


    constructor() {
        this.success = false;
        this.toModelMsg = '';
        this.toUserMsg = undefined;
    }

    public executeFailed(toModelMsg?: string, toUserMsg?: string) {
        this.success = false;
        this.toModelMsg = toModelMsg || this.toModelMsg;
        this.toUserMsg = toUserMsg || this.toUserMsg;
    }

    public executeSuccess(toModelMsg?: string, toUserMsg?: string) {
        this.success = true;
        this.toModelMsg = toModelMsg || this.toModelMsg;
        this.toUserMsg = toUserMsg || this.toUserMsg;
    }
}
