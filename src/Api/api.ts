export default class Api {
    public name: string;
    public arguments: string[];
    public call_func: Function;

    constructor(name: string, parameters: string[], call_func: Function) {
        this.name = name;
        this.arguments = parameters;
        this.call_func = call_func;
    }

    public run(args: Object) {
        const arg_values = this.arguments.map(argument => args[argument]);
        return this.call_func(...arg_values);
    }

}