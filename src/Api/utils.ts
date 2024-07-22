import * as vscode from 'vscode';
import * as path from 'path';
import Constants from '../Constants';
import TaskStopError from '../Error/TaskStopError';


export function getWorkspaceFolder() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    // Check if there is an open workspace folder
    if (!workspaceFolders) {
        return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
}

export function getVscodeFilePath() {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return undefined;
    }
    return path.join(workspaceFolder, '.vscode');
}

export function getLaunchFilePath() {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return undefined;
    }
    const vscodeDirPath = path.join(workspaceFolder, '.vscode');
    return path.join(vscodeDirPath, 'launch.json');
}

export function getSettingsFilePath() {
    const workspaceFolder = getWorkspaceFolder();
    if (!workspaceFolder) {
        return undefined;
    }
    const vscodeDirPath = path.join(workspaceFolder, '.vscode');
    return path.join(vscodeDirPath, 'settings.json');
}

export function getCurFocusFilePath() {
    const activeTextEditor = vscode.window.activeTextEditor;
    let currentFocusFilePath = "";
    if (activeTextEditor) {
        currentFocusFilePath = activeTextEditor.document.uri.fsPath;
    }
    return currentFocusFilePath;
}

export function sendMessageToUser(msg: string | undefined, response_for_confirm: string, confirmBtnText: string = "I finished the ", cancelBtnText: string = "Cancel Task",): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!msg) {
            msg = "Please confirm the action.";
        }
        vscode.window.showInformationMessage(msg, confirmBtnText, cancelBtnText).then((selectedOption) => {
            if (selectedOption === confirmBtnText) {
                resolve(response_for_confirm);
            } else if (selectedOption === cancelBtnText) {
                reject(new TaskStopError());
            } else {
                reject("Unknown option selected");
            }
        });
    });
}

export function sendRequireToUser(msg: string | undefined, response_for_confirm: string, confirmBtnText: string = "I have finished the requirement"): Promise<string> {
    return sendMessageToUser(msg, response_for_confirm, confirmBtnText);
}

export function sendWarnToUser(msg: string | undefined, response_for_confirm: string, confirmBtnText: string = "I agree the action."): Promise<string> {
    return sendMessageToUser(msg, response_for_confirm, confirmBtnText);
}

