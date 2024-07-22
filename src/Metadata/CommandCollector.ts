import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export default class CommandsCollector {
    private systemCommandOutputDir: string;
    private extensionCommandOutputDir: string;


    constructor(outputDir: string) {
        this.systemCommandOutputDir = path.join(__dirname, "../", outputDir, "system");
        this.extensionCommandOutputDir = path.join(__dirname, "../", outputDir, "extension");
        // Ensure the output directory exists
        if (!fs.existsSync(this.systemCommandOutputDir)) {
            fs.mkdirSync(this.systemCommandOutputDir, { recursive: true });
        }

        if (!fs.existsSync(this.extensionCommandOutputDir)) {
            fs.mkdirSync(this.extensionCommandOutputDir, { recursive: true });
        }
    }

    /**
     * List commands with their categories and write them into the directory.
     */
    public async writeSystemCommands(): Promise<void> {
        const systemPrefixes = ['workbench', "vscode.", "search", "notebook", "editor"];
        const commands = await vscode.commands.getCommands();
        const categorizedCommands = {};
        commands.forEach(commandName => {
            if (commandName.startsWith("_") || this.isExtensionStartWithVscode(commandName)) {
                return;
            }

            systemPrefixes.forEach(prefix => {
                if (commandName.startsWith(prefix)) {
                    // 确保键对应的数组存在
                    categorizedCommands[prefix] = categorizedCommands[prefix] || [];
                    // 将命令对象添加到对应的数组中
                    categorizedCommands[prefix].push({ commandId: commandName, desc: "" });
                }
            });
        });

        for (const prefix in categorizedCommands) {
            this.writeCommandsToFile(this.systemCommandOutputDir, prefix.replace(".", ""), categorizedCommands[prefix]);
        }
    }

    /**
     * decide whether the extension is start with vscode
     */
    private isExtensionStartWithVscode(name: string) {
        return name.startsWith("vscode.") && name.split(".").length > 2;
    }

    public writeExtensionCommands(): void {
        const extension2Commands: { [extensionId: string]: any[]; } = {};
        const extensions = vscode.extensions.all;

        for (const ext of extensions) {
            // Skip if the extension does not contribute commands
            if (!ext.packageJSON.contributes || !ext.packageJSON.contributes.commands) {
                continue;
            }

            const extensionId = ext.id;

            // Include as much information of each command as possible
            const commandsInfo = ext.packageJSON.contributes.commands.map((cmd: any) => {
                return {
                    commandId: cmd.command,
                    desc: cmd.title,
                    category: cmd.category, // Optional, may not exist
                };
            });
            extension2Commands[extensionId] = commandsInfo;
        }

        // Write commands of each extension to separate files.
        for (const extensionId in extension2Commands) {
            this.writeCommandsToFile(this.extensionCommandOutputDir, extensionId, extension2Commands[extensionId]);
        }
    }

    private writeCommandsToFile(outputDir: string, extension: string, commands: string[]): void {
        const filePath = path.join(outputDir, `${extension}.json`);
        fs.writeFile(filePath, JSON.stringify(commands, null, 4), () => { });
    }
}



