import { ArgumentMissingError } from "../Error/SmartVscodeError";
import { Chat } from "../ViewProvider";

export default class Api {
    public name: string;
    // "key" or "key=defaultValue"
    public arguments: string[];
    public executer: Function;
    public needConfirm: boolean;
    public toUserMsg: string;


    constructor(name: string, parameters: string[], executer: Function, toUserMsg: string, needConfirm: boolean = false) {
        this.name = name;
        this.arguments = parameters;
        this.executer = executer;
        this.needConfirm = needConfirm;
        this.toUserMsg = toUserMsg;
    }

    public hasPlaceholder(): boolean {
        return this.toUserMsg.includes("[placeholder]");
    }

    public parseValues(args: Object, chat?: Chat):
        Array<string | number | boolean | Chat | undefined> {
        return this.arguments.map(argument => {
            if (argument === "chat") {
                return chat;
            }
            else if (argument.includes("=")) {
                const key = argument.split("=")[0];
                const defaultValue = argument.split("=")[1];
                const value = key in args ? args[key] : defaultValue;
                return value === "void0" ? undefined : value;
            } else if (args[argument] !== undefined) {
                return args[argument];
            } else {
                throw new ArgumentMissingError(`Argument ${argument} is required for API ${this.name}`);
            }
        });
    }

    public run(args: Object, chat?: Chat) {
        const argValues = this.parseValues(args, chat);
        return this.executer(...argValues);
    }

}