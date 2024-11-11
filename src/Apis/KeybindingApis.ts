import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class KeybindingApis {

    @registerApi([], ApiMessage.getActionMsg("open keyboard shortcuts settings"))
    public async openKeybindingSettings(): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
            apiExecuteData.executeSuccess("Successfully opened keyboard shortcuts settings.");
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to open keyboard shortcuts settings. ${e}`);
        }
        return apiExecuteData;
    }

    @registerApi(["commandName"], ApiMessage.getActionMsg("open and set keybinding"))
    public async openAndSetKeybinding(commandName: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', commandName);
            await new Promise(f => setTimeout(f, 300)); // To wait vscode display the searching result. Even previous command finished, the searching continutes. 300ms is OK.
            await vscode.commands.executeCommand('keybindings.editor.defineKeybinding');
            apiExecuteData.executeSuccess("Successfully set shortcuts settings.");
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to open and set keybinding. ${e}`);
        }
        return apiExecuteData;
    }
}