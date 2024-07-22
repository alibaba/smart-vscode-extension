import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export default class SettingsCollector {
    private systemSettingsOutputDir: string;
    private extensionSettingsOutputDir: string;

    constructor(outputDir: string) {
        this.systemSettingsOutputDir = path.join(__dirname, "../", outputDir, "system");
        this.extensionSettingsOutputDir = path.join(__dirname, "../", outputDir, "extension");

        // Ensure the output directories exist
        if (!fs.existsSync(this.systemSettingsOutputDir)) {
            fs.mkdirSync(this.systemSettingsOutputDir, { recursive: true });
        }
        if (!fs.existsSync(this.extensionSettingsOutputDir)) {
            fs.mkdirSync(this.extensionSettingsOutputDir, { recursive: true });
        }
    }

    public async writeSystemSettings(): Promise<void> {
        const originalSettingsPath = path.join(this.systemSettingsOutputDir, "../originalSettings.text");
        const originalSettingsContent = fs.readFileSync(originalSettingsPath, 'utf8');

        // Split the content by empty lines to separate settings blocks
        const settingsBlocks = originalSettingsContent.split(/\n\s*\n/); // Regex to split by empty line(s)

        const categorizedSettings: { [category: string]: any[]; } = {};

        // Process each block
        settingsBlocks.forEach(block => {
            // Split the block into lines
            const lines = block.split('\n').filter(line => line.trim() !== '');

            // Collect descriptions
            const descriptionLines = lines.filter(line => line.trim().startsWith('//'));
            const description = descriptionLines.map(line => line.trim().substring(2)).join('\n');

            // Collect the JSON part by excluding description lines
            const jsonPartLines = lines.filter(line => !line.trim().startsWith('//'));
            let jsonPart: string = jsonPartLines.join('');
            if (jsonPart.endsWith(",")) {
                jsonPart = jsonPart.slice(0, -1);
            }

            try {
                // Parse the JSON part to an object
                const settingEntry = JSON.parse('{' + jsonPart + '}');

                for (const [key, value] of Object.entries(settingEntry)) {
                    // Determine the category based on setting key
                    const category = key.split('.')[0];


                    // Initialize the category if it doesn't exist
                    if (!categorizedSettings[category]) {
                        categorizedSettings[category] = [];
                    }

                    // Add setting information to categorized settings
                    categorizedSettings[category].push({
                        settingId: key,
                        desc: description,
                        setting: settingEntry,
                    });
                }
            } catch (e) {
                console.error(e); // Handle any JSON parse errors
            }
        });

        // Write categorized settings to separate files
        for (const category in categorizedSettings) {
            this.writeSettingsToFile(this.systemSettingsOutputDir, category, categorizedSettings[category]);
        }
    }

    public writeExtensionSettings(): void {
        const extension2Settings: { [extensionId: string]: any[]; } = {};
        const extensions = vscode.extensions.all;

        for (const ext of extensions) {
            // Skip if the extension does not contribute settings
            if (!ext.packageJSON.contributes || !ext.packageJSON.contributes.configuration) {
                continue;
            }
            const extensionId = ext.id;
            const settingsInfos: Object[] = [];
            try {
                ext.packageJSON.contributes.configuration.forEach((setting: any) => {
                    const properties: Object = setting.properties;
                    for (const key in properties) {
                        const property = properties[key];
                        settingsInfos.push({
                            name: key,
                            desc: property.description,
                            default: property.default,
                            type: property.type,
                        });
                    }
                });
            } catch (error) {
                const properties: Object = ext.packageJSON.contributes.configuration.properties;
                for (const key in properties) {
                    const property = properties[key];
                    settingsInfos.push({
                        name: key,
                        desc: property.description,
                        default: property.default,
                        type: property.type,
                    });
                }
            }
            extension2Settings[extensionId] = settingsInfos;
        }

        // Write settings of each extension to separate files
        for (const extensionId in extension2Settings) {
            this.writeSettingsToFile(this.extensionSettingsOutputDir, extensionId, extension2Settings[extensionId]);
        }
    }

    private getSettings(configuration: vscode.WorkspaceConfiguration): any[] {
        let settings: any[] = [];
        // Here you can implement logic to extract system settings
        // Similar to how extension settings are extracted in writeExtensionSettings method
        // But as mentioned previously, this approach does not get the description directly
        return settings;
    }

    private writeSettingsToFile(outputDir: string, fileBaseName: string, settings: any[]): void {
        const filePath = path.join(outputDir, `${fileBaseName}.json`);
        fs.writeFile(filePath, JSON.stringify(settings, null, 4), (err) => {
            if (err) {
                console.error(`Failed to write settings to ${filePath}`, err);
            }
        });
    }
}
