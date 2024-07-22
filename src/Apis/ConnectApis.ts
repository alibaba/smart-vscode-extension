import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class ConnectApis {
    @registerApi(ApiMessage.getActionMsg("create remote SSH server connect"))
    public async createRemoteSSHServerConnect() {
        const apiExecuteData = new ApiExecuteData();

        if (!this.isRemoteExtensionInstalled()) {
            apiExecuteData.executeFailed("Failed to open remote argument input window, please install ms-vscode-remote.remote-ssh extension first.");
        }
        await vscode.commands.executeCommand('workbench.view.remote');
        await vscode.commands.executeCommand('opensshremotes.addNewSshHost');
        apiExecuteData.executeSuccess("Successfully opened remote argument input window.");
        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg("open remote config file"))
    public async openRemoteConfigFile() {
        const apiExecuteData = new ApiExecuteData();
        if (!this.isRemoteExtensionInstalled()) {
            apiExecuteData.executeFailed("Failed to open remote argument input window, please install ms-vscode-remote.remote-ssh extension first.");
        }
        await vscode.commands.executeCommand('opensshremotes.openConfigFile');
        apiExecuteData.executeSuccess("Successfully opened remote config file.");
        return apiExecuteData;
    }

    public async isRemoteExtensionInstalled() {
        return vscode.extensions.getExtension('ms-vscode-remote.remote-ssh') !== undefined;
    }
}