import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import TaskStopError from "../Error/SmartVscodeError";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class WindowApis {
    @registerApi(ApiMessage.getActionMsg("create new window"))
    public async createNewWindow() {
        const apiExecuteData = new ApiExecuteData();
        try {
            await vscode.commands.executeCommand('workbench.action.newWindow');
            apiExecuteData.executeSuccess("A new window is created successfully.");
        } catch (error) {
            return `Failed to create a new window: ${error}`;
        }
        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg("close window"))
    public async openWorkspaceFolder(folderPath: string | undefined = undefined): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();

        // Check if a folder path is provided
        if (folderPath) {
            // Open the provided folder as a workspace (in a new window by default)
            await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath), false);
            apiExecuteData.executeSuccess("The workspace folder is opened successfully.");
            return apiExecuteData;
        }

        return new Promise<ApiExecuteData>(async (resolve, reject) => {
            const uri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Open as Workspace'
            });
            if (uri && uri.length > 0) {
                // Open the selected folder as a workspace (in a new window by default)
                await vscode.commands.executeCommand('vscode.openFolder', uri[0], false);
                apiExecuteData.executeSuccess("The workspace folder is opened successfully.");
                resolve(apiExecuteData);
            }
            else {
                reject(new TaskStopError());
            }
        });
    }

    @registerApi(ApiMessage.getActionMsg("close workspace folder"))
    public async closeWorkspaceFolder(): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            await vscode.commands.executeCommand('workbench.action.closeFolder');
            apiExecuteData.executeSuccess("The workspace folder is closed successfully.");
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to close workspace folder: ${e}`);
        }
        return apiExecuteData;
    }
}