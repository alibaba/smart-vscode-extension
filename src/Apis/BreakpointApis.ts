import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class BreakpointApis {

    @registerApi(ApiMessage.getActionMsg("toggle breakpoint"))
    public async toggleBreakpointAtLine(line: number | undefined = undefined): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const editor = vscode.window.activeTextEditor;
            if (editor && line !== undefined) {
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                await vscode.commands.executeCommand('revealLine', { lineNumber: line - 1, at: 'center' });
            }
            await vscode.commands.executeCommand('editor.debug.action.toggleBreakpoint');
            apiExecuteData.executeSuccess("Successfully toggled breakpoint.");
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to toggle breakpoint. ${e}`);
        }
        return apiExecuteData;
    }
}
