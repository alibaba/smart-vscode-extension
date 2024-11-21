
export default class Constants {
    public static systemName = "Chatbot";
    public static TASK_FAILED_MSG = "The task has been canceled, which may have been due to a timeout or manual cancellation.";
    public static INPUT_QUESTION_MSG = "Sorry, SmartVscode is designed to complete specific tasks in VS Code. Please enter your task instead of a question or a chat message.";
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

    public static getActionWithParamsMsg(target: string) {
        return `${Constants.systemName} will ${target}: [placeholder] for you.`;
    }
}


