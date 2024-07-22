// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import ExtensionApis from './Api/extensionCtrl';
import ThemeApis from './Api/themeCtrl';
import Config from './config';
import Api from './Api/api';
import ApiScheduler from './Api/ApiScheduler';
import ChatPipeline from './ChatPipeline';
import SettingApis from './Api/settingCtrl';
import WindowApis from './Api/windowCtrl';
import FsApis from './Api/fsApis';
import ExecuteApis from './Api/executeApis';
import ConnectApis from './Api/connectApis';
import KeybindingApis from './Api/keybindingApis';
import CommandApis from './Api/commandApis';
import FindAndReplaceApis from './Api/findAndReplaceApis';
import ViewProvider from './ViewProvider/ViewProvider2';
import SmartVscodeViewProvider from './ViewProvider/ViewProvider2';



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "smart-vscode" is now active!');
	const config = new Config();
	const apiScheduler = new ApiScheduler();

	registerAllApis(apiScheduler, config);

	const pipeline = new ChatPipeline(config, apiScheduler);
	const themeApis = new ThemeApis(config);
	const settingApis = new SettingApis();
	const windowApis = new WindowApis();
	const extensionApis = new ExtensionApis();
	const executeApis = new ExecuteApis();
	const fsApis = new FsApis();
	const connectApis = new ConnectApis();
	const keybindingApis = new KeybindingApis();
	const findAndReplaceApis = new FindAndReplaceApis();

	let smartVscodeChatViewProvider = vscode.window.registerWebviewViewProvider('SmartVscodeChat', new SmartVscodeViewProvider(context));

	// 注册一个命令，用于提示用户安装扩展
	let smartVscodeExtension = vscode.commands.registerCommand('smart-vscode.smart_ask', async () => {
		// fsApis.createFile("wlg.txt", "Hello World");
		// fsApis.openFileInEditor("hello.py");
		// const res= await executeApis.startDebugging("Python: Current File");
		// executeApis.addItemToLaunchJson(JSON.stringify(item));
		// windowApis.requireUserOpenWorkspace();
		// const res = await connectApis.isRemoteExtensionInstalled();
		// console.log(res);
		// 显示输入框要求用户输入一句话
		// await extensionApis.requireUserToInstallExtension("ms-vscode-remote.remote-ssh", "Please install remote ssh extension first.");
		// console.log("smart ask");

		const question = await vscode.window.showInputBox({
			placeHolder: "请输入您的问题…" // 这里设置输入框的提示文字
		});

		// const question = "i want to connect to remote server";
		// themeApis.listThemes();
		// 验证输入是否为空
		if (question) {
			// 如果输入不为空，则使用pipeline处理用户输入的文本
			pipeline.run(question);
		} else {
			// 如果输入为空，则可选地给出提示或者执行其他逻辑
			vscode.window.showInformationMessage("未输入任何问题。");
		}
	});

	let view_panel = vscode.commands.registerCommand('smart-vscode.smart_view', async () => {

	});

	// 比如，您可以输入API的json [{"name": "setProperties", "arguments": "{\"key2Value\": \"{\\\"editor.fontSize\\\": 18}\"}"}] ，会直接执行
	// 测试用，发布时删除
	let debug_call_api = vscode.commands.registerCommand('smart-vscode.call_api', async () => {
		const apiJson = await vscode.window.showInputBox({
			placeHolder: "Input api" // 这里设置输入框的提示文字
		});

		if (apiJson) {
			console.log(apiJson);
			apiScheduler.runApis(apiJson);
		} else {
			vscode.window.showInformationMessage("未输入任何API。");
		}
	});




	let commands_manual = vscode.commands.registerCommand('smart-vscode.commands_manual', async () => {
		const allCommands: string[] = await vscode.commands.getCommands(true);

		const commandDetails: { command: string; }[] = [];

		for (const command of allCommands) {
			commandDetails.push({ command: command });
		}

		const json = JSON.stringify(commandDetails, null, 2);

		const filePath = path.join(context.extensionPath, 'metadata', 'commands.json');
		const uriPath = vscode.Uri.file(filePath);

		fs.writeFile(uriPath.fsPath, json, (err) => {
			if (err) {
				vscode.window.showErrorMessage(`Error writing file: ${err.message}`);
				return;
			}
			vscode.window.showInformationMessage(`Commands exported to ${uriPath.fsPath}`);
		});
	});


	let debug_any = vscode.commands.registerCommand('smart-vscode.debug_any', async () => {
		settingApis.storageAllSettings("test_settings.json");
	});
	// 将注册的命令添加到VS Code的上下文中，以便它们在必要的时候被正确地回收
	context.subscriptions.push(smartVscodeExtension);
	context.subscriptions.push(view_panel);
	context.subscriptions.push(debug_call_api);
	context.subscriptions.push(commands_manual);
	context.subscriptions.push(debug_any);
	context.subscriptions.push(smartVscodeChatViewProvider);


}

// export function activate(context: vscode.ExtensionContext) {
// 	let smartVscodeChatViewProvider = vscode.window.registerWebviewViewProvider('SmartVscodeChat', new ViewProvider(context.extensionUri));
// 	context.subscriptions.push(smartVscodeChatViewProvider);
// }


function registerAllApis(apiScheduler: ApiScheduler, config: Config) {
	const themeApis = new ThemeApis(config);
	const settingApis = new SettingApis();
	const windowApis = new WindowApis();
	const fsApis = new FsApis();
	const extensionApis = new ExtensionApis();
	const executeApis = new ExecuteApis();
	const connectApis = new ConnectApis();
	const keybindingApis = new KeybindingApis();
	const commandApis = new CommandApis();
	const findAndReplaceApis = new FindAndReplaceApis();

	apiScheduler.registerApi(new Api(themeApis.listThemes.name, [], () => themeApis.listThemes()));
	apiScheduler.registerApi(new Api(themeApis.applyTheme.name, ["themeId", "uiTheme"], (themeId: string, uiTheme: string) => themeApis.applyTheme(themeId, uiTheme)));

	apiScheduler.registerApi(new Api(settingApis.getProperties.name, ["keys"], (keys) => settingApis.getProperties(keys)));
	apiScheduler.registerApi(new Api(settingApis.setProperties.name, ["key2Value"], (key2Value) => settingApis.setProperties(key2Value)));

	apiScheduler.registerApi(new Api(windowApis.createNewWindow.name, [], () => windowApis.createNewWindow()));
	apiScheduler.registerApi(new Api(windowApis.createOrOpenWorkspace.name, [], () => windowApis.createOrOpenWorkspace()));

	apiScheduler.registerApi(new Api(fsApis.createFile.name, ["path", "content"], (path: string, content: string) => fsApis.createFile(path, content)));
	apiScheduler.registerApi(new Api(fsApis.openFileInEditor.name, ["path"], (path: string) => fsApis.openFileInEditor(path)));
	apiScheduler.registerApi(new Api(fsApis.getLaunchFileContent.name, [], () => fsApis.getLaunchFileContent()));
	apiScheduler.registerApi(new Api(fsApis.addConfigurationToLaunch.name, ["item"], (newLaunchItem) => fsApis.addConfigurationToLaunch(newLaunchItem)));

	apiScheduler.registerApi(new Api(extensionApis.getInstalledExtensions.name, ["filterKey"], (filterKey: string | undefined = undefined) => extensionApis.getInstalledExtensions(filterKey)));
	apiScheduler.registerApi(new Api(extensionApis.requireUserToInstallExtension.name, ["extensionName"], (extensionName: string, hint: string | undefined = undefined) => extensionApis.requireUserToInstallExtension(extensionName, hint)));
	// apiScheduler.registerApi(new Api(extensionApis.openExtensionStore.name, ["searchKey"], extensionApis.openExtensionStore));

	apiScheduler.registerApi(new Api(executeApis.startDebugging.name, ["debugConfigurationName"], (debugConfigurationName) => executeApis.startDebugging(debugConfigurationName)));

	apiScheduler.registerApi(new Api(connectApis.createRemoteConnect.name, [], () => connectApis.createRemoteConnect()));
	apiScheduler.registerApi(new Api(connectApis.openRemoteConfigFile.name, [], () => connectApis.openRemoteConfigFile()));

	apiScheduler.registerApi(new Api(keybindingApis.openKeybindingSettings.name, [], () => keybindingApis.openKeybindingSettings()));
	apiScheduler.registerApi(new Api(keybindingApis.openAndSetKeybinding.name, ["commandName"], (commandName: string) => keybindingApis.openAndSetKeybinding(commandName)));

	apiScheduler.registerApi(new Api(commandApis.listCommands.name, ["filterKey"], (filterKey: string | undefined = undefined) => commandApis.listCommands(filterKey)));
	apiScheduler.registerApi(new Api(commandApis.executeCommand.name, ["command", "rest"], (command: string, ...rest: any[]) => commandApis.executeCommand(command, ...rest)));

	apiScheduler.registerApi(new Api(findAndReplaceApis.findAndReplace.name, ["position", "query", "replace", "isRegex", "preserveCase", "findInSelection", "matchWholeWord", "isCaseSensitive", "filesToInclude", "filesToExclude"], (position: string, query: string, replace: string, isRegex: boolean, preserveCase: boolean, findInSelection: boolean, matchWholeWord: boolean, isCaseSensitive: boolean, filesToInclude: string, filesToExclude: string) => findAndReplaceApis.findAndReplace(position, query, replace, isRegex, preserveCase, findInSelection, matchWholeWord, isCaseSensitive, filesToInclude, filesToExclude)));
}


// This method is called when your extension is deactivated
export function deactivate() { }
