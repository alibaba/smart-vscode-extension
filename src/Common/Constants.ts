
export default class Constants {
    public static systemName = "Chatbot";
    public static TASK_FAILED_MSG = "The task has been canceled, which may have been due to a timeout or manual cancellation.";
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


