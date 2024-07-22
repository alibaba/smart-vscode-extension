import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getLaunchFilePath } from './utils';

export default class ExecuteApis {

    public async startDebugging(debugConfigurationName: string): Promise<string> {
        try {
            // Ensure there is an open workspace
            const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('No open workspace. A workspace is required to start debugging.');
                return "No open workspace"; // No open workspace
            }
            
            // Assuming debugConfigurationName is a named configuration in launch.json
            // We attempt to find this configuration
            const debugConfiguration = vscode.workspace.getConfiguration('launch', workspaceFolder.uri)
                .configurations.find(config => config.name === debugConfigurationName);
    
            // If the desired debug configuration doesn't exist
            if (!debugConfiguration) {
                vscode.window.showWarningMessage(`Debug configuration '${debugConfigurationName}' not found.`);
                return `Debug configuration '${debugConfigurationName}' not found.`;
            }
    
            // Start debugging with the found configuration
            const started = await vscode.debug.startDebugging(workspaceFolder, debugConfiguration);
    
            if (started) {
                return "Debugging started";
            } else {
                // The debug.startDebugging call can return false indicating a problem starting the debug session
                vscode.window.showErrorMessage('Failed to start debugging session.');
                return 'Failed to start debugging session, you should open the file you want to debug before starting debugging.';
            }
        } catch (e) {
            if (e instanceof Error) {
                vscode.window.showErrorMessage(`Error starting debugging: ${e.message}`);
                return e.message;
            } else {
                vscode.window.showErrorMessage('An unexpected error occurred during debugging.');
                return 'An unexpected error occurred during debugging.';
            }
        }
    }

    public async stopDebugging() {
        await vscode.debug.stopDebugging();
        vscode.window.showInformationMessage('Debugging stopped');
    }
}