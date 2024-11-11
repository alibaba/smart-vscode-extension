import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class CommandApis {
    @registerApi(["filterKey=undefined"], ApiMessage.getQueryMsg("commands"))
    public async listCommands(filterKey: string | undefined = undefined): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        const commands = await vscode.commands.getCommands();
        const filteredCommands = commands.filter(command => {
            if (filterKey) {
                return command.toLowerCase().includes(filterKey.toLowerCase());
            }
            return true;
        });
        apiExecuteData.executeSuccess(JSON.stringify(filteredCommands));
        return apiExecuteData;
    }

    public async listCommandsWithCategory(): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        const commands = await vscode.commands.getCommands();

        // 使用一个对象存储分类后的命令
        const categorizedCommands: { [extension: string]: string[]; } = {};

        // 将命令分类到属于它们的扩展名下
        commands.forEach(commandName => {
            if (commandName.startsWith("_")) {
                return;
            }
            const parts = commandName.split('.');
            if (parts.length > 1) {
                const extension = parts[0];
                if (!categorizedCommands[extension]) {
                    categorizedCommands[extension] = [];
                }
                categorizedCommands[extension].push(commandName);
            } else {
                // 如果命令没有明确的扩展名前缀，将它放在一个通用组
                if (!categorizedCommands['general']) {
                    categorizedCommands['general'] = [];
                }
                categorizedCommands['general'].push(commandName);
            }
        });

        // 将分类后的命令转换为JSON字符串
        const categorizedCommandsJson = JSON.stringify(categorizedCommands, null, 4);
        apiExecuteData.executeSuccess(categorizedCommandsJson);

        return apiExecuteData;
    }

    @registerApi(["commandId"], ApiMessage.getActionMsg("execute commands"), true)
    public async executeCommand(commandId: string) {
        const apiExecuteData = new ApiExecuteData();
        try {
            await vscode.commands.executeCommand(commandId);
            apiExecuteData.executeSuccess(`Command ${commandId} has been executed.`, `Command ${commandId} has been executed.`);
        }
        catch (err) {
            apiExecuteData.executeFailed(`Error executing command ${commandId}: ${err}. You may need to install the extension that provides this command.`);
        }
        return apiExecuteData;
    }

    @registerApi(["extensionId"], ApiMessage.getActionMsg("create DBMS connection"))
    public async createDBMSConnect(extensionId: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const extensions = vscode.extensions.all;
            const commandsMetadata: any = {};
            for (const ext of extensions) {
                const packageJSON = ext.packageJSON;
                if (packageJSON.id === extensionId) {
                    commandsMetadata[packageJSON.id] = [];
                    const commands = packageJSON.contributes.commands;
                    for (const command of commands) {
                        commandsMetadata[packageJSON.id].push({
                            commandId: command.command,
                            title: command.title
                        });
                    }
                }
            }
            apiExecuteData.executeSuccess(`Discovered command ids for extension ${extensionId}: ${JSON.stringify(commandsMetadata)}. You can utilize the 'executeCommand' API to run these extension commands for establishing a connection to your DBMS.`);
            return apiExecuteData;
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to create a connection to DBMS: ${e}`);
        }
        return apiExecuteData;
    }
}