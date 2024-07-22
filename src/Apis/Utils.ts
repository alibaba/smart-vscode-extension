import * as path from 'path';
import * as vscode from 'vscode';
import TaskStopError from '../Error/TaskStopError';


export function getWorkspaceFolder() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    // Check if there is an open workspace folder
    if (!workspaceFolders) {
        return undefined;
    }
    return workspaceFolders[0].uri.fsPath;
}

export function getFullFilePath(filePath: string) {
    const folder = getWorkspaceFolder();
    if (!folder) {
        return undefined;
    }

    let fullFilePath = filePath;
    if (!filePath.startsWith(folder)) {
        fullFilePath = vscode.Uri.joinPath(vscode.Uri.file(folder), filePath).fsPath;
    }
    return fullFilePath;
}

export function isOpenWorkspaceFolder() {
    return getWorkspaceFolder() !== undefined;
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



export function getVSCodeArgvPath() {
    const os = require('os');
    const path = require('path');
    const platform = os.platform();
    let argvPath;

    switch (platform) {
        case 'win32':
            argvPath = path.join(process.env.USERPROFILE);
            break;
        case 'darwin':
            argvPath = path.join(os.homedir());
            break;
        case 'linux':
            argvPath = path.join(os.homedir());
            break;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    argvPath = path.join(argvPath, '.vscode', 'argv.json');
    return argvPath;
}

export function sendMessageToUser(msg: string | undefined, responseForConfirm: string, confirmBtnText: string = "I finished the ", cancelBtnText: string = "Cancel Task",): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!msg) {
            msg = "Please confirm the action.";
        }
        vscode.window.showInformationMessage(msg, confirmBtnText, cancelBtnText).then((selectedOption) => {
            if (selectedOption === confirmBtnText) {
                resolve(responseForConfirm);
            } else if (selectedOption === cancelBtnText) {
                reject(new TaskStopError());
            } else {
                reject("Unknown option selected");
            }
        });
    });
}

export function sendRequireToUser(msg: string | undefined, responseForConfirm: string, confirmBtnText: string = "I have finished the requirement"): Promise<string> {
    return sendMessageToUser(msg, responseForConfirm, confirmBtnText);
}

export function sendWarnToUser(msg: string | undefined, responseForConfirm: string, confirmBtnText: string = "I agree the action."): Promise<string> {
    return sendMessageToUser(msg, responseForConfirm, confirmBtnText);
}

