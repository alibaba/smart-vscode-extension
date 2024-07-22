import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { getVscodeFilePath } from '../utils';
import { SettingsMetadataExporter } from '../Utils/SettingExporter';

export default class SettingCtrl {
    constructor() {

    }

    public async storageAllSettings(filePath: string) {
        const exporter = new SettingsMetadataExporter();
        await exporter.getAllSettingsMetadata();
    }

    // public async storageAllSettings2(filePath: string): Promise<void> {
    //     const configuration = vscode.workspace.getConfiguration();
    //     const writeFileAsync = util.promisify(fs.writeFile);

    //     try {
    //         // Retrieve all the settings as an object
    //         const settings: { [key: string]: any } = {};

    //         // Inspect each setting available in the configuration
    //         // NOTE: This method does not guarantee capturing all settings with their metadata (e.g., descriptions)
    //         for (const key of Object.keys(configuration)) {
    //             const inspectResult = configuration.inspect(key);
    //             if (inspectResult) {
    //                 // Preference global setting over workspace or workspaceFolder settings
    //                 settings[key] = inspectResult.globalValue ?? inspectResult.workspaceValue ?? inspectResult.workspaceFolderValue ?? inspectResult.defaultValue;
    //             }
    //         }

    //         // Convert the settings object to a JSON string
    //         const settingsJSON = JSON.stringify(settings, null, 4);

    //         // Write the JSON string to the specified file path
    //         await writeFileAsync(filePath, settingsJSON, 'utf8');

    //         vscode.window.showInformationMessage('Settings have been successfully saved to ' + filePath);
    //     } catch (error) {
    //         vscode.window.showErrorMessage('Failed to save settings: ' + (error instanceof Error ? error.message : String(error)));
    //     }
    // }

    private configAsObject(configuration: vscode.WorkspaceConfiguration): object {
        let settings = Object.create(null);
        for (const key of Object.keys(configuration)) {
            const value = configuration.get(key);
            settings[key] = value;
        }
        return settings;
    }

    public getProperties(keys: string[]) {
        // 读取vscode的setting.json文件，并返回一个Object，包含所有的设置
        const only_workspace_value = true;

        const settings: { [key: string]: any } = {};
        for (const key of keys) {
            const config = vscode.workspace.getConfiguration();
            const value = only_workspace_value ? config.inspect(key)?.workspaceValue : config.get(key);
            if (value !== undefined) {
                settings[key] = value;
            }
        }
        return settings;
    }

    public async setProperties(key2Value: Object) {
        if (typeof key2Value !== 'object') {
            key2Value = JSON.parse(key2Value);
        }
        const config = vscode.workspace.getConfiguration();
        for (const [key, value] of Object.entries(key2Value)) {
            const setting = config.inspect(key);
            if (!setting?.defaultValue) {
                // setting not found
                return `Failed to update setting ${key} to ${value}, because the setting ${key} is incorret or outdated, please check the setting name.`;
            }
            if (setting && setting.defaultValue !== undefined && typeof setting.defaultValue !== typeof value) {
                // value's type is incorrect
                return `Failed to update setting ${key} to ${value} because the type of the value is incorrect. Expected type: ${typeof setting.defaultValue}.`;
            }
            try {
                // The `update` method returns a Promise that we have to await.
                await config.update(key, value, vscode.ConfigurationTarget.Workspace);
            }
            catch (error) {
                // If an error occurs, return the error message
                return `Failed to update setting ${key} to ${value} with error: ${error}.`;
            }
        }
        return "Settings have been updated";
    }

    public async setLanguage(language: string): Promise<void> {
        const argvJsonPath = path.join(getVscodeFilePath(), 'argv.json'); // Construct the path to the argv.json file

        try {
            let argvConfig = {};

            // Check if the file exists, if not create an empty JSON object
            if (fs.existsSync(argvJsonPath)) {
                // Read the contents of the argv.json file
                const argvContent = fs.readFileSync(argvJsonPath, { encoding: 'utf8' });
                argvConfig = argvContent !== "" ? JSON.parse(argvContent) : {};
            }

            // Set the language in the configuration
            argvConfig['locale'] = language;

            // Write the updated JSON back to argv.json
            fs.writeFileSync(argvJsonPath, JSON.stringify(argvConfig), { encoding: 'utf8' });

            // Prompt the user to restart VSCode to apply the changes
            const restartAction = 'Restart Now';
            const result = await vscode.window.showInformationMessage(
                'Please restart VSCode to apply the language change.',
                restartAction
            );

            // If the user chooses to restart immediately
            if (result === restartAction) {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`An error occurred while setting the language: ${error}`);
        }
    }
}