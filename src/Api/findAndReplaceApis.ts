import * as vscode from 'vscode';

export default class FindAndReplaceApis {
	static findAndReplace: any;

    public async findAndReplace(position: string, query: string, replace: string, isRegex: boolean = false, preserveCase: boolean = false, findInSelection: boolean = false, matchWholeWord: boolean = false, isCaseSensitive: boolean = false, filesToInclude: string = "", filesToExclude: string = "") {
        if(!findInSelection){
            await vscode.commands.executeCommand('cancelSelection');
        }
        if(filesToInclude || filesToExclude|| position === "files" || position === "file") {
            // If filesToInclude or filesToExclude is not empty string, search in files.
            await vscode.commands.executeCommand('workbench.action.findInFiles', 
                {query: query,
                replace: replace,
                isRegex: isRegex,
                preserveCase: preserveCase,
                matchWholeWord: matchWholeWord,
                isCaseSensitive: isCaseSensitive,
                filesToInclude: filesToInclude,
                filesToExclude: filesToExclude
                });
                //ref: https://github.com/microsoft/vscode/blob/9a987a1cd0d3413ffda4ed41268d9f9ee8b7565f/src/vs/workbench/contrib/search/browser/searchActions.ts#L163-L172
        }
        else /*if(position === "editor") and default */{
            await vscode.commands.executeCommand('editor.actions.findWithArgs', 
                {searchString: query, 
                replaceString: replace, // has different arguments comparing with above
                isRegex: isRegex,
                preserveCase: preserveCase,
                findInSelection: findInSelection,
                matchWholeWord: matchWholeWord,
                isCaseSensitive: isCaseSensitive
                });
            // ref: https://code.visualstudio.com/api/references/commands
        }
        return "Find or replace OK.";
    }

    public async focusFindInPanel(){
        // Only support focus find in panel(terminal, debug console, etc.)
        // Not implentmented yet. Only use one command. May RAG of commands can solve this. 
    }
}