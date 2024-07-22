import * as vscode from 'vscode';


export default class MessageApis {
    public showQuickPick(items: string[], title: string, callWhen: Function): void {
        vscode.window.showQuickPick(items, { placeHolder: title })
            .then(selection => {
                if (!selection) {
                    return;
                }
                // 用户选择了一个主题，可以在这里处理选择
                console.log('User chooses:', selection);
            });
    }
}