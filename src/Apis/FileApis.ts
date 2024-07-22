import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import TaskStopError from "../Error/TaskStopError";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";
import { getFullFilePath, getLaunchFilePath } from './Utils';


export default class FileApis {
    @registerApi(ApiMessage.getActionMsg("insert content to file"), true)
    public async insertContentToFile(filePath: string, content: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const fullFilePath = getFullFilePath(filePath);
            if (!fullFilePath) {
                apiExecuteData.executeFailed("No open folder found, cannot create file.");
                return apiExecuteData;
            }

            const fileUri = vscode.Uri.file(fullFilePath);
            // replace \\n in content with new line 
            content = content.replace(/\\n/g, '\n');
            const encodedContent = new TextEncoder().encode(content);
            try {
                await vscode.workspace.fs.stat(fileUri);
                const result = await vscode.window.showWarningMessage(
                    'File already exists. Do you want to overwrite it?',
                    { modal: true },
                    'Yes',
                    'No'
                );

                if (result !== 'Yes') {
                    throw new TaskStopError();
                }
            } catch {
            }
            await vscode.workspace.fs.writeFile(fileUri, encodedContent);
            apiExecuteData.executeSuccess("Content inserted to file successfully.");
            return apiExecuteData;
        } catch (error) {
            apiExecuteData.executeFailed(`Failed to insert content to file: ${error}`);
        }
        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg("open file in editor"))
    public async openFileInEditor(filePath: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const fullFilePath = getFullFilePath(filePath);
            if (!fullFilePath) {
                apiExecuteData.executeFailed("No open folder found, cannot create file.");
                return apiExecuteData;
            }

            const fileUri = vscode.Uri.file(fullFilePath);
            await vscode.window.showTextDocument(fileUri);
            apiExecuteData.executeSuccess("File opened successfully.");
        } catch (error) {
            apiExecuteData.executeFailed(`Failed to open file: ${error}`);
        }
        return apiExecuteData;
    };

    @registerApi(ApiMessage.getQueryMsg("launch file content"))
    public async getLaunchFileContent(): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const launchJsonPath = getLaunchFilePath();
            if (!launchJsonPath) {
                apiExecuteData.executeFailed("No launch.json file found.");
                return apiExecuteData;
            }
            const content = fs.readFileSync(launchJsonPath, 'utf-8');
            apiExecuteData.executeSuccess(content);
        } catch (error) {
            apiExecuteData.executeFailed(`Failed to read launch.json: ${error}`);
        }
        return apiExecuteData;
    };

    @registerApi(ApiMessage.getActionMsg("add configuration to launch"), true)
    public async addConfigurationToLaunch(newLaunchItem): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders) {
                apiExecuteData.executeFailed("No open workspace.");
                return apiExecuteData;
            }

            // Assuming we're working with the first workspace folder.
            const workspaceFolder = workspaceFolders[0];
            const vscodeDirPath = path.join(workspaceFolder.uri.fsPath, '.vscode');
            const launchJsonPath = path.join(vscodeDirPath, 'launch.json');

            // Ensure .vscode directory exists
            if (!fs.existsSync(vscodeDirPath)) {
                fs.mkdirSync(vscodeDirPath);
            }

            let launchConfigurations = {
                version: "0.2.0",
            };

            let configurations: any[] = [];
            // If launch.json already exists, read its content, otherwise create it with default structure
            if (fs.existsSync(launchJsonPath)) {
                const content = fs.readFileSync(launchJsonPath, 'utf-8');
                launchConfigurations = JSON.parse(content);
                configurations = launchConfigurations["configurations"];
            }

            if (typeof newLaunchItem === 'string') {
                newLaunchItem = JSON.parse(newLaunchItem);
            }
            if ("version" in newLaunchItem) {
                launchConfigurations = newLaunchItem;
            } else {
                configurations.push(newLaunchItem);
                launchConfigurations["configurations"] = configurations;
            }
            // Write/update launch.json
            fs.writeFileSync(launchJsonPath, JSON.stringify(launchConfigurations));

            apiExecuteData.executeSuccess("New item added to launch.json successfully.");
        } catch (error) {
            apiExecuteData.executeFailed(`Failed to update launch.json: ${error}`);
        }
        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg('format current file'))
    public async formatCurrentFile(onlySelectedText: boolean = false): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                apiExecuteData.executeFailed(undefined, "No active editor found.");
                apiExecuteData.stopTask = true;
                return apiExecuteData;
            }

            // Get the settings for the current language
            const languageId = editor.document.languageId;
            const configuration = vscode.workspace.getConfiguration(`[${languageId}]`);

            // Check if there is a default formatter configured
            const defaultFormatter = configuration['editor.defaultFormatter'];
            if (!defaultFormatter) {
                apiExecuteData.executeFailed(`No default formatter is set for ${languageId}. Please install a formatter extension.`);
                return apiExecuteData;
            }

            if (onlySelectedText) {
                await vscode.commands.executeCommand('editor.action.formatSelection');
            } else {
                await vscode.commands.executeCommand('editor.action.formatDocument');
            }
            apiExecuteData.executeSuccess("Document formatted successfully.");
        } catch (error) {
            apiExecuteData.executeFailed(`Failed to format the document: ${error}`);
        }
        return apiExecuteData;
    }
}

