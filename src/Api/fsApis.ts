import * as vscode from 'vscode';
import { Uri } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getLaunchFilePath } from './utils';

export default class FsApis {
    public async createFile(path: string, content: string) {
        try {
            // Use the workspace's rootPath as the base directory;
            // Adjust as necessary for your use case.
            const folderUri = vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri
                : null;

            if (!folderUri) {
                vscode.window.showErrorMessage("No open folder found, cannot create file.");
                return "no workspace found, cannot create file.";
            }
            // Create a complete file Uri
            const fileUri = vscode.Uri.joinPath(folderUri, path);


            // Convert the content string to a Uint8Array (VS Code's fs API works with binary data)
            const encodedContent = new TextEncoder().encode(content);

            // Check if the file already exists. If yes, confirm overwriting
            try {
                await vscode.workspace.fs.stat(fileUri);

                // File exists, show confirmation dialog
                const result = await vscode.window.showWarningMessage(
                    'File already exists. Do you want to overwrite it?',
                    { modal: true },
                    'Yes',
                    'No'
                );

                if (result !== 'Yes') {
                    return; // If user chooses not to overwrite, exit the function
                }
            } catch {
                // If the file does not exist, the 'stat' call will throw and we'll end up here
                // We can safely continue to create the file
            }

            await vscode.workspace.fs.writeFile(fileUri, encodedContent);
            return "File created successfully.";
        } catch (error) {
            return `Failed to create file: ${error}`;
        }
    }

    public async openFileInEditor(path: string) {
        try {
            const folderUri = vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders[0].uri
                : null;

            if (!folderUri) {
                vscode.window.showErrorMessage("No open folder found, cannot create file.");
                return "no workspace found, cannot create file.";
            }
            // Create a complete file Uri
            const fileUri = vscode.Uri.joinPath(folderUri, path);

            try {
                // Use fs.promises to check if the file exists
                // await fs.access(filePath);

                // If the file exists, open it in the editor
                await vscode.window.showTextDocument(fileUri);
                return "File opened successfully.";
            } catch (error) {
                // If the file does not exist or there's an error accessing it
                return `File does not exist: ${fileUri}`;
            }
        } catch (error) {
            return `Failed to open file: ${path}`;
        }
    }

    public async getLaunchFileContent() {
        const launchJsonPath = getLaunchFilePath();
        if (!launchJsonPath) {
            return "Failed: No launch.json file found.";
        }

        try {
            const content = fs.readFileSync(launchJsonPath, 'utf-8');
            return content;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed: ${error}`);
            return `Failed: ${error}`;
        }
    }

    public async addConfigurationToLaunch(newLaunchItem) {
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            vscode.window.showErrorMessage("No open workspace.");
            return;
        }

        // Assuming we're working with the first workspace folder.
        const workspaceFolder = workspaceFolders[0];
        const vscodeDirPath = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const launchJsonPath = path.join(vscodeDirPath, 'launch.json');

        try {
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

            vscode.window.showInformationMessage("New item added to launch.json successfully.");
            return "New item added to launch.json successfully.";

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update launch.json: ${error}`);
            return `Failed to update launch.json: ${error}`;
        }
    }
}

