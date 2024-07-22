import * as os from 'os';
import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class ExecuteApis {

    @registerApi(ApiMessage.getActionMsg("execute program"), true)
    public async executeProgram(debugConfigurationName: string | undefined = undefined): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            // Ensure there is an open workspace
            const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
            if (!workspaceFolder) {
                apiExecuteData.executeFailed("No open workspace");
                return apiExecuteData;
            }

            const debugConfiguration = vscode.workspace.getConfiguration('launch', workspaceFolder.uri)
                .configurations.find(config => config.name === debugConfigurationName);

            // If the desired debug configuration doesn't exist
            if (!debugConfiguration) {
                vscode.window.showWarningMessage(`Debug configuration '${debugConfigurationName}' not found.`);
                apiExecuteData.executeFailed(`Debug configuration '${debugConfigurationName}' not found.`);
            }

            // Start debugging with the found configuration
            const started = await vscode.debug.startDebugging(workspaceFolder, debugConfiguration);

            if (started) {
                apiExecuteData.executeSuccess(`Debugging started`);
            } else {
                // The debug.startDebugging call can return false indicating a problem starting the debug session
                apiExecuteData.executeFailed('Failed to start debugging session, you should open the file you want to debug before starting debugging.');
            }
        } catch (e) {
            apiExecuteData.executeFailed(`Error starting debugging: ${e}`);
        }
        return apiExecuteData;
    }



    @registerApi(ApiMessage.getActionMsg("stop debugging"))
    public async stopDebugging() {
        await vscode.debug.stopDebugging();
        vscode.window.showInformationMessage('Debugging stopped');
    }

    @registerApi(ApiMessage.getActionMsg("execute html in browser"))
    public async executeHtmlInBrowser(filePath: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            let command: string;
            switch (os.platform()) {
                case 'win32': // Windows
                    command = `start ${filePath}`;
                    break;
                case 'darwin' || 'linux': // macOS
                    command = `open '${filePath}'`;
                    break;
                default:
                    apiExecuteData.executeFailed(`Unsupported platform: ${os.platform()}`);
                    apiExecuteData.stopTask = true;
                    return apiExecuteData;
            }

            const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
            // 在 terminal 中执行命令
            terminal.sendText(command);
            // 展示 terminal
            terminal.show();
            apiExecuteData.executeSuccess(`Execute successfully in browser: ${filePath}`);
            return apiExecuteData;
        } catch (e) {
            apiExecuteData.executeFailed(`Error opening file in browser: ${e}`);
        }
        return apiExecuteData;

    }
}