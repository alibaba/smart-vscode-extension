export default class TaskStopError extends Error {
    constructor(message: string = "Task has been stopped.") {
        super(message);
        this.name = "TaskStopError";
        Object.setPrototypeOf(this, TaskStopError.prototype);
    }
}