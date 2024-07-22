
export default class Constants {
    public static systemName = "Chatbot";
    // public static TASK_CANCEL_MSG = "TASK CANCELLED";
}


export class ApiMessage {
    public static listThemeMsg = `${Constants.systemName} is querying for your installed themes.`;
    public static applyThemeMsg = `${Constants.systemName} hope to apply a theme for you.`;

    public static getQueryMsg(target: string) {
        return `${Constants.systemName} is querying for your installed ${target}.`;
    }

    public static getActionMsg(target: string) {
        return `${Constants.systemName} will ${target} for you.`;
    }
}
