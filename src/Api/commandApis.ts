import * as vscode from 'vscode';

export default class CommandApis {
    public async listCommands(filterKey: string | undefined = undefined): Promise<string[]> {
        const commands = await vscode.commands.getCommands();
        const filteredCommands = commands.filter(command => {
            if (filterKey) {
                return command.toLowerCase().includes(filterKey.toLowerCase());
            }
            return true;
        });
        return filteredCommands;
    }

    public async executeCommand(command: string, ...rest: any[]) {
        try {
            await vscode.commands.executeCommand(command, ...rest);
            return `Command ${command} executed.`;
        }
        catch (err) {
            return `Error executing command ${command}: ${err}`;
        }
    }
}