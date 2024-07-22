import { getCurFocusFilePath, getWorkspaceFolder } from "./Api/utils";

export class Environment {
    public workspaceFolder = "";
    public currentFocusFilePath = "";

    public update() {
        this.workspaceFolder = getWorkspaceFolder() || "";
        this.currentFocusFilePath = getCurFocusFilePath() || "";
    }
}