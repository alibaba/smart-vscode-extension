export default class ArgumentMissingError extends Error {
    constructor(message: string = "Argument is missing.") {
        super(message);
        this.name = "ArgumentMissingError";
        Object.setPrototypeOf(this, ArgumentMissingError.prototype);
    }
}