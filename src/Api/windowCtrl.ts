import * as vscode from 'vscode';

export default class WindowCtrl {
    public async createNewWindow() {
        await vscode.commands.executeCommand('workbench.action.newWindow');
        return "A new window is created successfully.";
    }

    public async createOrOpenWorkspace() {
        // Check if a workspace is currently open

        return new Promise<string>(async (resolve, reject) => {
            if (!vscode.workspace.workspaceFolders) {
                // Use the built-in command to open a folder dialog
                const uri = await vscode.window.showOpenDialog({
                    canSelectFolders: true,
                    canSelectFiles: false,
                    canSelectMany: false,
                    openLabel: 'Open as Workspace'
                });
                if (uri && uri.length > 0) {
                    // Open the selected folder as a workspace (in a new window by default)
                    await vscode.commands.executeCommand('vscode.openFolder', uri[0], false);
                    resolve("A workspace is opened successfully.");
                }
            }
        });
    }
}