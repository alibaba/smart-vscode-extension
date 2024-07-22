import path from 'path';
import * as vscode from 'vscode';
export function getVscodeFilePath(): string {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        // Take the path of the first workspace folder
        const workspaceFolderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        return path.join(workspaceFolderPath, '.vscode');
    }
    throw new Error("No workspace folder found");
}