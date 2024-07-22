import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import { Chat } from "../ViewProvider";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class ExtensionApis {

    @registerApi(ApiMessage.getQueryMsg("extensions"))
    public async getInstalledExtensions(filterKey: string | undefined = undefined): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();

        const extensions = vscode.extensions.all;
        const filteredExtensions = extensions
            .map(extension => ({
                id: extension.id,
                name: extension.packageJSON.displayName || extension.packageJSON.name,
            }))
            .filter(extension => {
                // skip all extensions that start with "vscode."
                if (extension.id.startsWith("vscode.")) {
                    return false;
                }
                if (filterKey) {
                    return extension.name.toLowerCase().includes(filterKey.toLowerCase());
                }
                return true;
            });
        apiExecuteData.executeSuccess(JSON.stringify(filteredExtensions));
        return apiExecuteData;
    }


    public async openExtensionStore(searchKey) {
        // Open the Extensions view and search for the extension by its ID
        await vscode.commands.executeCommand('workbench.extensions.search', searchKey);
    }

    @registerApi(ApiMessage.getActionMsg("install extension"))
    public async requireUserToInstallExtension(extensionName: string, chat: Chat): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const beforeExtensionCommands: any = this.getExtensionCommands();

            // Open the Extensions view and search for the extension by its ID
            await vscode.commands.executeCommand('workbench.extensions.search', extensionName);

            const confirm = await chat.sendMsgToUser(`Accept after installing the ${extensionName} extension.`, true);
            if (confirm) {
                let addedExtensionCommands = this.calAddedCommands(beforeExtensionCommands, this.getExtensionCommands());
                apiExecuteData.executeSuccess(`The extension ${extensionName} has been installed. the new added command ids are: ${JSON.stringify(addedExtensionCommands)}, if need to continue the task, you can use the API 'executeCommand' to execute these commands now.`);
            } else {
                apiExecuteData.executeFailed("The user canceled the task.");
                apiExecuteData.stopTask = true;
            }
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to install extension: ${e}`);
        }
        return apiExecuteData;
    }

    /**
     *  函数：提示用户安装一个指定的扩展 
     *  @deprecated 该函数已经被弃用，不再推荐使用。请使用 requireUserToInstallExtension() 函数代替。
     * */
    public async promptAndInstallExtension(extensionId: string) {
        // 检查扩展是否已经安装
        if (vscode.extensions.getExtension(extensionId)) {
            vscode.window.showInformationMessage(`扩展 "${extensionId}" 已经安装。`);
            return;
        }

        // 显示提示信息，并提供安装选项
        const action = await vscode.window.showInformationMessage(
            `扩展 "${extensionId}" 是必需的。是否要安装它？`,
            '安装'
        );

        // 如果用户选择了'安装'，执行安装命令
        if (action === '安装') {
            vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId)
                .then(() => {
                    console.log(`Extension "${extensionId}" has been installed.`);
                    vscode.window.showInformationMessage(`扩展 "${extensionId}" 安装成功。`);
                }, (err) => {
                    vscode.window.showErrorMessage(`无法安装扩展 "${extensionId}". ${err}`);
                });
        }
    }

    private getExtensionCommands(): { [extensionId: string]: { commandId: string, title: string; }[]; } {
        const extension2Commands = vscode.extensions.all.reduce((acc, ext) => {
            const packageJSON = ext.packageJSON;
            if (packageJSON.contributes && packageJSON.contributes.commands) {
                const commands = packageJSON.contributes.commands;
                if (!acc[packageJSON.id]) {
                    acc[packageJSON.id] = [];
                }
                for (const command of commands) {
                    acc[packageJSON.id].push({
                        commandId: command.command,
                        title: command.title
                    });
                }
            }
            return acc;
        }, {});
        return extension2Commands;
    }

    private calAddedCommands(beforeCommands: Object, afterCommands: Object): Object {
        let addedCommands = {};
        const beforeExtensions = Object.keys(beforeCommands);
        const afterExtensions = Object.keys(afterCommands);
        for (const ext of afterExtensions) {
            if (!beforeExtensions.includes(ext)) {
                addedCommands[ext] = afterCommands[ext];
            }
        }
        return addedCommands;
    }

}