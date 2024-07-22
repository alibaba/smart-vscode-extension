import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SettingsMetadataExporter {
    public async getAllSettingsMetadata(): Promise<void> {
        // Retrieve all extensions
        const extensions = vscode.extensions.all;

        // Object to store settings metadata
        const settingsMetadata: any = {};

        // Iterate over extensions to read their package.json
        for (const ext of extensions) {
            try {
                const packageJSON = ext.packageJSON;

                // Look for the contributes.configuration section
                if (packageJSON.contributes && packageJSON.contributes.configuration) {
                    const configuration = packageJSON.contributes.configuration;
                    // Handle both array and single object form of "configuration"
                    const configArray = Array.isArray(configuration) ? configuration : [configuration];

                    for (const config of configArray) {
                        if (config.properties) {
                            // Iterate over the properties (settings)
                            for (const key in config.properties) {
                                if (config.properties.hasOwnProperty(key)) {
                                    // Extract and store possible values and descriptions
                                    settingsMetadata[key] = {
                                        description: config.properties[key].description,
                                        default: config.properties[key].default,
                                        type: config.properties[key].type,
                                        enum: config.properties[key].enum,
                                        enumDescriptions: config.properties[key].enumDescriptions
                                    };
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Error reading package.json for extension ${ext.id}: ${err}`);
                continue;
            }
        }
        return settingsMetadata;
    }
}