import * as vscode from 'vscode';
import { sendRequireToUser, sendMessageToUser } from './utils';
import TaskStopError from '../Error/TaskStopError';


export default class ExtensionCtrl {

    public async getInstalledExtensions(filterKey: string | undefined = undefined): Promise<{ name: string; id: string }[]> {
        // 获取所有已安装的扩展
        const extensions = vscode.extensions.all;
        // 过滤扩展列表
        const filteredExtensions = extensions
            .map(extension => ({
                id: extension.id,
                name: extension.packageJSON.displayName || extension.packageJSON.name,
            }))
            .filter(extension => {
                // is name start with vscode., then skip it
                if (extension.id.startsWith("vscode.")) {
                    return false;
                }
                // 如果提供了筛选关键字，则使用它来过滤扩展名；否则，返回所有扩展。
                if (filterKey) {
                    return extension.name.toLowerCase().includes(filterKey.toLowerCase());
                }
                return true;
            });
        return filteredExtensions;
    }

    public async openExtensionStore(searchKey) {
        // Open the Extensions view and search for the extension by its ID
        await vscode.commands.executeCommand('workbench.extensions.search', searchKey);
    }

    public async requireUserToInstallExtension(extensionName: string, hint: string | undefined = undefined, timeout: number = 20000): Promise<string> {
        const beforeInstallCommandsMetadata: any = {};
        const extensions = vscode.extensions.all;
        for (const ext of extensions) {
            try {
                const packageJSON = ext.packageJSON;
                if (packageJSON.contributes && packageJSON.contributes.commands) {
                    const commands = packageJSON.contributes.commands;
                    if (!beforeInstallCommandsMetadata[packageJSON.id]) {
                        beforeInstallCommandsMetadata[packageJSON.id] = [];
                    }
                    for (const command of commands) {
                        beforeInstallCommandsMetadata[packageJSON.id].push({
                            command: command.command,
                            title: command.title
                        });
                    }
                }
            } catch (err) {
                console.error(`Error reading package.json for extension ${ext.id}: ${err}`);
                continue;
            }
        }

        // Open the Extensions view and search for the extension by its ID
        await vscode.commands.executeCommand('workbench.extensions.search', extensionName);

        // return new Promise<string>((resolve, reject) => {
        //     let timeoutHandler = setTimeout(() => {
        //         onExtensionsChanged.dispose(); // Cleanup the listener if timeout occurs
        //         reject(new Error(`Timeout: Waiting for the extension '${extensionName}' to install exceeded ${timeout} milliseconds.`));
        //     }, timeout);

        //     // Register an event listener for when the list of installations changes
        //     const onExtensionsChanged = vscode.extensions.onDidChange(() => {
        //         clearTimeout(timeoutHandler); // Clear the timeout since installation is detected
        //         onExtensionsChanged.dispose(); // Cleanup the listener
        //         resolve(`The extension '${extensionName}' was successfully installed.`);
        //     });
        // });

        // return sendRequireToUser(hint, "The extension was successfully installed");

        let msg = hint;
        let response_for_confirm = "The extension was successfully installed";
        const confirmBtnText = "I have finished the requirement";
        const cancelBtnText = "Cancel Task";
        return new Promise((resolve, reject) => {
            if (!msg) {
                msg = "Please confirm the action.";
            }
            vscode.window.showInformationMessage(msg, confirmBtnText, cancelBtnText).then((selectedOption) => {
                if (selectedOption === confirmBtnText) {
                    const afterInstallCommandsMetadata: any = {};
                    const extensions = vscode.extensions.all;
                    for (const ext of extensions) {
                        try {
                            const packageJSON = ext.packageJSON;
                            if (packageJSON.contributes && packageJSON.contributes.commands) {
                                const commands = packageJSON.contributes.commands;
                                if (!afterInstallCommandsMetadata[packageJSON.id]) {
                                    afterInstallCommandsMetadata[packageJSON.id] = [];
                                }
                                for (const command of commands) {
                                    afterInstallCommandsMetadata[packageJSON.id].push({
                                        command: command.command,
                                        title: command.title
                                    });
                                }
                            }
                        } catch (err) {
                            console.error(`Error reading package.json for extension ${ext.id}: ${err}`);
                            continue;
                        }
                    }
                    // get the new added extension commands
                    let addedCommandsMetadata = {};
                    const beforeInstallExtensions = Object.keys(beforeInstallCommandsMetadata);
                    const afterInstallExtensions = Object.keys(afterInstallCommandsMetadata);
                    for (const ext of afterInstallExtensions) {
                        if (!beforeInstallExtensions.includes(ext)) {
                            addedCommandsMetadata[ext] = afterInstallCommandsMetadata[ext];
                        }
                    }
                    resolve(`${response_for_confirm}, the new added commands are: ${JSON.stringify(addedCommandsMetadata)}, if need to continue the task, you can use the API 'executeCommand' to execute these commands now.`);
                } else if (selectedOption === cancelBtnText) {
                    reject(new TaskStopError());
                } else {
                    reject("Unknown option selected");
                }
            });
        });
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

}