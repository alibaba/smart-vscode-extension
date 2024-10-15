import * as fs from 'fs';
import * as vscode from 'vscode';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";
import { getVSCodeArgvPath, isOpenWorkspaceFolder } from "./Utils";


export default class SettingApis {
    private static filterSettings: string[] = ["workbench.colorTheme"];

    @registerApi(ApiMessage.getQueryMsg("settings"))
    public async getProperties(keys: string[]): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const settings: { [key: string]: any; } = {};
            const config = vscode.workspace.getConfiguration();

            for (const key of keys) {
                // 获取全局配置值
                const globalValue = config.inspect(key)?.globalValue;
                const defaultValue = config.inspect(key)?.defaultValue;
                // 获取工作区配置值，优先使用, 如果未定义则使用全局值
                const value = config.inspect(key)?.workspaceValue ?? globalValue ?? defaultValue;
                settings[key] = value;
            }

            apiExecuteData.executeSuccess(JSON.stringify(settings));
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to get setting properties: ${e}`);
        }
        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg("update settings"), true)
    public async setProperties(key2Value: Object, onGlobal: boolean = false): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        if (typeof onGlobal === 'string') {
            onGlobal = onGlobal === 'true';
        }

        try {
            if (!isOpenWorkspaceFolder()) {
                apiExecuteData.executeFailed(undefined, "Please open the workspace folder before updating the settings.");
                apiExecuteData.stopTask = true;
                return apiExecuteData;
            }
            if (typeof key2Value !== 'object') {
                key2Value = JSON.parse(key2Value);
            }
            const config = vscode.workspace.getConfiguration();
            const changes: string[] = [];

            for (const [key, newValue] of Object.entries(key2Value)) {
                const setting = config.inspect(key);

                // 获取当前设置值
                let currentValue = setting?.globalValue || setting?.workspaceValue;
                if (currentValue === undefined) {
                    currentValue = setting?.defaultValue; // 如果没有设置，获取默认值
                }

                // 添加修改信息
                changes.push(`Setting '${key}': Old Value = ${currentValue}, New Value = ${newValue}`);

                if (setting?.defaultValue === undefined || this.isFilterSetting(key)) {
                    apiExecuteData.executeFailed(`Failed to update setting ${key} to ${newValue}, because the setting ${key} is incorrect or outdated, please check the setting name.`);
                    return apiExecuteData;
                }
                if (setting && setting.defaultValue !== undefined && typeof setting.defaultValue !== typeof newValue) {
                    apiExecuteData.executeFailed(`Failed to update setting ${key} to ${newValue} because the type of the value is incorrect. Expected type: ${typeof setting.defaultValue}.`);
                    return apiExecuteData;
                }

                // 更新设置
                if (onGlobal) {
                    await config.update(key, newValue, vscode.ConfigurationTarget.Global);
                } else {
                    await config.update(key, newValue, vscode.ConfigurationTarget.Workspace);
                }
            }
            apiExecuteData.executeSuccess(`Settings have been updated`, `Settings have been updated:\n${changes.join('\n')}`);
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to update settings: ${e}`);
        }

        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg("set language and then restart vscode"), true)
    public async setLanguage(language: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        const argvJsonPath = getVSCodeArgvPath(); // Construct the path to the argv.json file
        try {
            // Check if the file exists and read content, otherwise use an empty string
            if (fs.existsSync(argvJsonPath)) {
                const argvContent = fs.readFileSync(argvJsonPath, { encoding: 'utf8' });

                // Use a regular expression to replace the locale value
                const regex = /("locale":\s*").+?"/;
                let updatedArgvContent;
                if (regex.test(argvContent)) {
                    // If the "locale" key already exists, replace the existing language with the new one
                    updatedArgvContent = argvContent.replace(regex, `$1${language}"`);
                } else {
                    // If the "locale" key does not exist, add it to the end before the closing brace
                    updatedArgvContent = argvContent.replace(/\}$/, `, "locale": "${language}" }`);
                }

                // Write the updated content back to argv.json
                fs.writeFileSync(argvJsonPath, updatedArgvContent, { encoding: 'utf8' });
                apiExecuteData.executeSuccess("Set language successfully!", 'Please restart VSCode to apply the language change.');
            } else {
                apiExecuteData.executeFailed(undefined, `The file ${argvJsonPath} does not exist.`);
            }
            apiExecuteData.stopTask = true;
        } catch (error) {
            apiExecuteData.executeFailed(undefined, `An error occurred while setting the language: ${error}`);
        }
        return apiExecuteData;
    }

    public isFilterSetting(key: string) {
        return SettingApis.filterSettings.includes(key);
    }
}