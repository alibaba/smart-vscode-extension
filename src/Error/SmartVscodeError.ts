export default class TaskStopError extends Error {
    constructor(message: string = "Task has been stopped.") {
        super(message);
        this.name = "TaskStopError";
    }
}


export class NetworkError extends Error {
    constructor(message: string = "A network error occurred: the backend service may not be running. Please reach out to us on GitHub for help.") {
        super(message);
        this.name = "NetworkError";
    }
}

export class ArgumentMissingError extends Error {
    constructor(message: string = "Argument is missing.") {
        super(message);
        this.name = "ArgumentMissingError";
    }
}