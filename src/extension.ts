// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import Api from "./Apis/Api";
import ApiScheduler from './Apis/ApiScheduler';
import BreakpointApis from "./Apis/BreakpointApis";
import CommandApis from "./Apis/CommandApis";
import ConnectApis from './Apis/ConnectApis';
import ExecuteApis from './Apis/ExecuteApis';
import ExtensionApis from './Apis/ExtensionApis';
import FileApis from './Apis/FileApis';
import FindAndReplaceApis from './Apis/FindAndReplaceApis';
import KeybindingApis from './Apis/KeybindingApis';
import SettingApis from './Apis/SettingApis';
import ThemeApis from './Apis/ThemeApis';
import WindowApis from './Apis/windowApis';
import ChatPipeline from './ChatPipeline';
import Config from './Common/Config';
import { startTestServer } from './Common/HttpServerForTest';
import CommandsCollector from "./Metadata/CommandCollector";
import SettingsCollector from "./Metadata/SettingCollector";
import SmartVscodeViewProvider, { Chat } from './ViewProvider';
import { NetworkError } from "./Error/SmartVscodeError";


export async function activate(context: vscode.ExtensionContext) {
	const config = new Config();
	config.version = context.extension.packageJSON.version;
	const apiScheduler = ApiScheduler.getInstance();

	let userId: string = context.globalState.get('userId') as string;
	if (!userId) {
		userId = uuid();
		context.globalState.update('userId', userId);
	}

	const pipeline = new ChatPipeline(config, apiScheduler, userId);
	try {
		await pipeline.refreshCallCount();
	} catch (error) {
		console.log(new NetworkError());
	}

	const themeApis = new ThemeApis(config);
	const settingApis = new SettingApis();
	const windowApis = new WindowApis();
	const extensionApis = new ExtensionApis();
	const executeApis = new ExecuteApis();
	const fsApis = new FileApis();
	const connectApis = new ConnectApis();
	const keybindingApis = new KeybindingApis();
	const findAndReplaceApis = new FindAndReplaceApis();
	const commandApis = new CommandApis();
	const breakpointApis = new BreakpointApis();


	const provider = new SmartVscodeViewProvider(context, pipeline);
	let smartVscodeChatViewProvider = vscode.window.registerWebviewViewProvider('smart-vscode.view', provider, {
		webviewOptions: {
			retainContextWhenHidden: true,
		},
	});

	// 比如，您可以输入API的json [{"name": "setProperties", "arguments": "{\"key2Value\": \"{\\\"editor.fontSize\\\": 18}\"}"}] ，会直接执行
	// 测试用，发布时删除
	let debugCallApi = vscode.commands.registerCommand('smart-vscode.call_api', async () => {
		let apiJson = await vscode.window.showInputBox({
			placeHolder: "Input api" // 这里设置输入框的提示文字
		});
		if (!apiJson) {
			return;
		}
		apiJson = JSON.parse(apiJson);
		if (apiJson) {
			console.log(apiJson);
			const api: Api = apiScheduler.getApi(apiJson["name"]);
			await api.run(apiJson["arguments"], undefined);
		} else {
			vscode.window.showInformationMessage("未输入任何API。");
		}
	});

	let commandsManual = vscode.commands.registerCommand('smart-vscode.commands_manual', async () => {
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

	let collectCommandMetaData = vscode.commands.registerCommand('smart-vscode.collectCommandMetaData', async () => {
		const commandCollector = new CommandsCollector("src/Metadata/CommandMetaData/");
		commandCollector.writeExtensionCommands();
		commandCollector.writeSystemCommands();

		const settingCollector = new SettingsCollector("src/Metadata/SettingMetaData/");
		// settingCollector.writeSystemSettings();
		settingCollector.writeExtensionSettings();
	});


	let debugAny = vscode.commands.registerCommand('smart-vscode.debug_any', async () => {
		// commandApis.executeCommand("editor.action.blockComment");
		// const res = await vscode.commands.executeCommand("workbench.extensions.action.setColorTheme");

		const res = await vscode.commands.executeCommand("workbench.action.navigateBackInNavigationLocations");
		// const res = await vscode.commands.executeCommand("workbench.extensions.action.setColorTheme");
		//const settingCollector = new SettingsCollector("src/Metadata/SettingMetaData/");
		//settingCollector.writeSystemSettings();
		// settingCollector.writeExtensionSettings();

		// settingApis.setLanguage("en");
		// fsApis.formatCurrentFile();
		// const result: ApiExecuteData = await commandApis.executeCommand("editor.action.formatDocument");
		// console.log(result.toModelMsg);
	});

	context.subscriptions.push(debugCallApi);
	context.subscriptions.push(commandsManual);
	context.subscriptions.push(debugAny);
	context.subscriptions.push(smartVscodeChatViewProvider);
	context.subscriptions.push(collectCommandMetaData);
	if (config.testMode) {
		// startTestServer(config.testServerPort, (result) => {
		// 	pipeline.interactionLoop(result, new Chat());
		// });
		startTestServer(config.testServerPort, (data) => {
			pipeline.run(data["q"], new Chat(), true, data["a"]);
		});
	}
}

export function deactivate() { }
