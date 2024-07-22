import * as vscode from 'vscode';

export default class KeybindingApis {

    public async openKeybindingSettings() {
        await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
        return "Successfully opened keyboard shortcuts settings.";
    }

    public async openAndSetKeybinding(commandName: string) {
        await vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', commandName);
        console.log("entered GlobalKeybindings page");
        await new Promise(f => setTimeout(f, 300)); // To wait vscode display the searching result. Even previous command finished, the searching continutes. 300ms is OK.
        await vscode.commands.executeCommand('keybindings.editor.defineKeybinding');
        console.log("set fin,");
        return "Successfully set keybinding.";
    }
}