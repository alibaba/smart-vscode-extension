import * as vscode from 'vscode';

export default class ConnectApis {
    public async createRemoteConnect() {
        if (!this.isRemoteExtensionInstalled()) {
            return "Failed to open remote argument input window, please install ms-vscode-remote.remote-ssh extension first.";
        }
        await vscode.commands.executeCommand('workbench.view.remote');
        await vscode.commands.executeCommand('opensshremotes.addNewSshHost');
        return "Successfully opened remote argument input window.";
    }

    public async openRemoteConfigFile() {
        if (!this.isRemoteExtensionInstalled()) {
            return "Failed to open remote argument input window, please install ms-vscode-remote.remote-ssh extension first.";
        }
        await vscode.commands.executeCommand('opensshremotes.openConfigFile');
        return "Successfully opened remote config file.";
    }

    public async isRemoteExtensionInstalled() {
        return vscode.extensions.getExtension('ms-vscode-remote.remote-ssh') !== undefined;
    }
}