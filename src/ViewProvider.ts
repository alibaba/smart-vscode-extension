/**
 * @author Ali Gençay
 * https://github.com/gencay/vscode-chatgpt
 *
 * @license
 * Copyright (c) 2022 - Present, Ali Gençay
 *
 * All rights reserved. Code licensed under the ISC license
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

import delay from 'delay';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as vscode from 'vscode';

import { ChatGPTAPI as ChatGPTAPI3 } from '../chatgpt-4.7.2/index';
import { ChatGPTAPI as ChatGPTAPI35 } from '../chatgpt-5.1.1';
import ChatPipeline from "./ChatPipeline";

type LoginMethod = "GPT3 OpenAI API Key";
type AuthType = "";
export class Chat {
  private viewProvider?: SmartVscodeViewProvider;

  private apiConfirmed: ((value: unknown) => void) | null = null;

  constructor(viewProvider?: SmartVscodeViewProvider) {
    this.viewProvider = viewProvider;
  }

  public acceptApi() {
    if (this.apiConfirmed) {
      this.apiConfirmed(true);
      this.apiConfirmed = null;
    }
  }

  public refuseApi() {
    if (this.apiConfirmed) {
      this.apiConfirmed(false);
      this.apiConfirmed = null;
    }
  }

  public async responseQuestion(userInput: string) {
    this.viewProvider?.sendApiRequestTemp(userInput, { command: "freeText" });
  }

  public async sendMsgToUser(message: string, confirm: boolean = false, responseInMarkdown = false) {
    if (this.viewProvider === undefined) {
      return true;
    }
    const autoScroll = this.viewProvider.autoScroll;
    const id = this.viewProvider.getRandomId();

    if (confirm) {
      const allowed = await new Promise((resolve) => {
        this.viewProvider?.sendMessage({ type: 'addApiResponse', value: message, id, autoScroll, responseInMarkdown, confirm, done: true });
        this.apiConfirmed = resolve;
      });
      return allowed;
    } else {
      this.viewProvider.sendMessage({ type: 'addApiResponse', value: message, rawId: true, id, autoScroll, responseInMarkdown: true, confirm, done: true });
    }
    return true;
  }
}

export default class SmartVscodeViewProvider implements vscode.WebviewViewProvider {
  private webView?: vscode.WebviewView;

  public subscribeToResponse: boolean;
  public autoScroll: boolean;
  public useAutoLogin?: boolean;
  public useGpt3?: boolean;
  public chromiumPath?: string;
  public profilePath?: string;
  public model?: string;

  private apiGpt3?: ChatGPTAPI3;
  private apiGpt35?: ChatGPTAPI35;
  private conversationId?: string;
  private messageId?: string;
  private proxyServer?: string;
  private loginMethod?: LoginMethod;
  private authType?: AuthType;

  private questionCounter: number = 0;
  private inProgress: boolean = false;
  private abortController?: AbortController;
  private currentMessageId: string = "";
  private response: string = "";

  private pipeline: ChatPipeline;

  private chat: Chat;

  /**
   * Message to be rendered lazily if they haven't been rendered
   * in time before resolveWebviewView is called.
   */
  private leftOverMessage?: any;
  constructor(private context: vscode.ExtensionContext, pipeline: ChatPipeline) {
    this.subscribeToResponse = vscode.workspace.getConfiguration("chatgpt").get("response.showNotification") || false;
    this.autoScroll = !!vscode.workspace.getConfiguration("smartVscode").get("response.autoScroll");
    this.model = vscode.workspace.getConfiguration().get("smartVscode.chatLightModel") as string;
    this.pipeline = pipeline;
    this.chat = new Chat(this);

    this.setMethod();
    this.setChromeExecutablePath();
    this.setProfilePath();
    this.setProxyServer();
    this.setAuthType();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this.webView = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this.context.extensionUri
      ]
    };

    webviewView.webview.html = this.getWebviewHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async data => {
      switch (data.type) {
        case 'addFreeTextQuestion':
          this.sendApiRequest(data.value, { command: "freeText" });
          // this.sendApiRequestTemp(data.value, { command: "freeText" });
          break;
        case 'acceptApi':
          this.chat.acceptApi();
          break;
        case 'refuseApi':
          this.chat.refuseApi();
          break;
        case 'editCode':
          const escapedString = (data.value as string).replace(/\$/g, '\\$');;
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(escapedString));

          this.logEvent("code-inserted");
          break;
        case 'openNew':
          const document = await vscode.workspace.openTextDocument({
            content: data.value,
            language: data.language
          });
          vscode.window.showTextDocument(document);

          this.logEvent(data.language === "markdown" ? "code-exported" : "code-opened");
          break;
        case 'clearConversation':
          this.messageId = undefined;
          this.conversationId = undefined;

          this.logEvent("conversation-cleared");
          break;
        case 'clearBrowser':
          this.logEvent("browser-cleared");
          break;
        case 'cleargpt3':
          this.apiGpt3 = undefined;

          this.logEvent("gpt3-cleared");
          break;
        case 'login':
          this.prepareConversation().then(success => {
            if (success) {
              this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);

              this.logEvent("logged-in");
            }
          });
          break;
        case 'openSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', "@ext:IntelligentComputing.smart-vscode");

          this.logEvent("settings-opened");
          break;
        case 'openSettingsPrompt':
          vscode.commands.executeCommand('workbench.action.openSettings', "@ext:IntelligentComputing.vscode-chatgpt promptPrefix");

          this.logEvent("settings-prompt-opened");
          break;
        case 'showConversation':
          /// ...
          break;
        case "stopGenerating":
          this.stopGenerating();
          this.stopTask();
          break;
        default:
          break;
      }
    });

    if (this.leftOverMessage != null) {
      // If there were any messages that wasn't delivered, render after resolveWebView is called.
      this.sendMessage(this.leftOverMessage);
      this.leftOverMessage = null;
    }
  }

  private stopGenerating(): void {
    this.abortController?.abort?.();
    this.inProgress = false;
    this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress });
    // const responseInMarkdown = !this.isCodexModel;
    // this.sendMessage({ type: 'addResponse', value: this.response, done: true, id: this.currentMessageId, autoScroll: this.autoScroll, responseInMarkdown });
  }

  private stopTask(): void {
    this.pipeline.stopTask();
  }

  public clearSession(): void {
    this.stopGenerating();
    this.apiGpt3 = undefined;
    this.messageId = undefined;
    this.conversationId = undefined;
    this.logEvent("cleared-session");
  }

  public setProxyServer(): void {
    this.proxyServer = vscode.workspace.getConfiguration("chatgpt").get("proxyServer");
  }

  public setMethod(): void {
    this.loginMethod = vscode.workspace.getConfiguration("chatgpt").get("method") as LoginMethod;

    this.useGpt3 = true;
    this.useAutoLogin = false;
    this.clearSession();
  }

  public setAuthType(): void {
    this.authType = vscode.workspace.getConfiguration("chatgpt").get("authenticationType");
    this.clearSession();
  }

  public setChromeExecutablePath(): void {
    let path = "";
    switch (os.platform()) {
      case 'win32':
        path = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        break;

      case 'darwin':
        path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        break;

      default:
        /**
         * Since two (2) separate chrome releases exists on linux
         * we first do a check to ensure we're executing the right one.
         */
        const chromeExists = fs.existsSync('/usr/bin/google-chrome');

        path = chromeExists
          ? '/usr/bin/google-chrome'
          : '/usr/bin/google-chrome-stable';
        break;
    }

    this.chromiumPath = vscode.workspace.getConfiguration("chatgpt").get("chromiumPath") || path;
    this.clearSession();
  }

  public setProfilePath(): void {
    this.profilePath = vscode.workspace.getConfiguration("chatgpt").get("profilePath");
    this.clearSession();
  }

  private get isCodexModel(): boolean {
    return !!this.model?.startsWith("code-");
  }

  private get isGpt35Model(): boolean {
    return !!this.model?.startsWith("gpt-");
  }



  public async prepareConversation(modelChanged = false): Promise<boolean> {
    if (modelChanged && this.useAutoLogin) {
      // no need to reinitialize in autologin when model changes
      return false;
    }

    const state = this.context.globalState;
    const configuration = vscode.workspace.getConfiguration("chatgpt");

    if (this.useGpt3) {
      if ((this.isGpt35Model && !this.apiGpt35) || (!this.isGpt35Model && !this.apiGpt3) || modelChanged) {
        const config = vscode.workspace.getConfiguration();
        // extract the necessary configuration

        let apiKey = config.get("smartVscode.apiKey") as string;
        // const apiBaseUrl = new URL("v1", config.get("smartVscode.apiBaseUrl") || "https://api.openai.com").toString();
        const apiBaseUrl = config.get("smartVscode.apiBaseUrl") as string;
        // let apiKey = configuration.get("gpt3.apiKey") as string || state.get("chatgpt-gpt3-apiKey") as string;
        const organization = configuration.get("gpt3.organization") as string;
        const max_tokens = configuration.get("gpt3.maxTokens") as number;
        const temperature = configuration.get("gpt3.temperature") as number;
        const top_p = configuration.get("gpt3.top_p") as number;

        if (!apiKey) {
          vscode.window.showErrorMessage("Please add your API Key to use OpenAI official APIs. Storing the API Key in Settings is discouraged due to security reasons, though you can still opt-in to use it to persist it in settings. Instead you can also temporarily set the API Key one-time: You will need to re-enter after restarting the vs-code.", "Store in session (Recommended)", "Open settings").then(async choice => {
            if (choice === "Open settings") {
              vscode.commands.executeCommand('workbench.action.openSettings', "chatgpt.gpt3.apiKey");
              return false;
            } else if (choice === "Store in session (Recommended)") {
              await vscode.window
                .showInputBox({
                  title: "Store OpenAI API Key in session",
                  prompt: "Please enter your OpenAI API Key to store in your session only. This option won't persist the token on your settings.json file. You may need to re-enter after restarting your VS-Code",
                  ignoreFocusOut: true,
                  placeHolder: "API Key",
                  value: apiKey || ""
                })
                .then((value) => {
                  if (value) {
                    apiKey = value;
                    state.update("chatgpt-gpt3-apiKey", apiKey);
                    this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);
                  }
                });
            }
          });

          return false;
        }
        if (this.isGpt35Model) {
          this.apiGpt35 = new ChatGPTAPI35({
            apiKey,
            fetch: fetch,
            apiBaseUrl: apiBaseUrl?.trim() || undefined,
            organization,
            completionParams: {
              model: this.model,
              max_tokens,
              temperature,
              top_p,
            }
          });
        } else {
          this.apiGpt3 = new ChatGPTAPI3({
            apiKey,
            fetch: fetch,
            apiBaseUrl: apiBaseUrl?.trim() || undefined,
            organization,
            completionParams: {
              model: this.model,
              max_tokens,
              temperature,
              top_p,
            }
          });
        }
      }
    }

    this.sendMessage({ type: 'loginSuccessful', showConversations: this.useAutoLogin }, true);

    return true;
  }

  private get systemContext() {
    return `You are ChatGPT helping the User with pair programming.`;
  }

  private processQuestion(question: string, code?: string, language?: string) {
    if (code != null) {
      // Add prompt prefix to the code if there was a code block selected
      question = `${question}${language ? ` (The following code is in ${language} programming language)` : ''}: ${code}`;
    }
    return question + "\r\n";
  }

  public async sendApiRequestTemp(prompt: string, options: { command: string, code?: string, previousAnswer?: string, language?: string; }) {
    // if (this.inProgress) {
    //   // The AI is still thinking... Do not accept more questions.
    //   return;
    // }

    this.questionCounter++;

    this.logEvent("api-request-sent", { "chatgpt.command": options.command, "chatgpt.hasCode": String(!!options.code), "chatgpt.hasPreviousAnswer": String(!!options.previousAnswer) });

    if (!await this.prepareConversation()) {
      return;
    }

    this.response = '';
    let question = this.processQuestion(prompt, options.code, options.language);
    const responseInMarkdown = !this.isCodexModel;

    // If the ChatGPT view is not in focus/visible; focus on it to render Q&A
    if (this.webView == null) {
      vscode.commands.executeCommand('smart-vscode.view.focus');
    } else {
      this.webView?.show?.(true);
    }

    this.inProgress = true;
    this.abortController = new AbortController();
    this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress, showStopButton: this.useGpt3 });
    // this.sendMessage({ type: 'addQuestion', value: prompt, code: options.code, autoScroll: this.autoScroll });
    this.currentMessageId = this.getRandomId();
    this.conversationId = this.currentMessageId;

    // this.sendMessage({ type: 'addQuestion', value: prompt, code: options.code, autoScroll: this.autoScroll });

    try {
      if (this.useGpt3) {
        if (this.isGpt35Model && this.apiGpt35) {
          const gpt3Response = await this.apiGpt35.sendMessage(question, {
            systemMessage: this.systemContext,
            messageId: this.conversationId,
            parentMessageId: this.messageId,
            abortSignal: this.abortController.signal,
            onProgress: (partialResponse) => {
              this.response = partialResponse.text;
              this.sendMessage({ type: 'addResponse', value: this.response, rawId: true, id: this.conversationId, autoScroll: this.autoScroll, responseInMarkdown });
            },
          });
          ({ text: this.response, parentMessageId: this.messageId } = gpt3Response);
        } else if (!this.isGpt35Model && this.apiGpt3) {
          ({ text: this.response, conversationId: this.conversationId, parentMessageId: this.messageId } = await this.apiGpt3.sendMessage(question, {
            promptPrefix: this.systemContext,
            messageId: this.conversationId,
            parentMessageId: this.messageId,
            abortSignal: this.abortController.signal,
            onProgress: (partialResponse) => {
              this.response = partialResponse.text;
              this.sendMessage({ type: 'addResponse', value: this.response, id: this.messageId, autoScroll: this.autoScroll, responseInMarkdown });
            },
          }));
        }
      }

      if (options.previousAnswer != null) {
        this.response = options.previousAnswer + this.response;
      }

      this.sendMessage({ type: 'addResponse', value: this.response, done: true, rawId: true, id: this.currentMessageId, autoScroll: this.autoScroll, responseInMarkdown });

      if (this.subscribeToResponse) {
        vscode.window.showInformationMessage("ChatGPT responded to your question.", "Open conversation").then(async () => {
          await vscode.commands.executeCommand('smart-vscode.view.focus');
        });
      }
    } catch (error: any) {
      let message;
      let apiMessage = error?.response?.data?.error?.message || error?.tostring?.() || error?.message || error?.name;

      this.logError("api-request-failed");

      if (error?.response?.status || error?.response?.statusText) {
        message = `${error?.response?.status || ""} ${error?.response?.statusText || ""}`;

        vscode.window.showErrorMessage("An error occured. If this is due to max_token you could try `ChatGPT: Clear Conversation` command and retry sending your prompt.", "Clear conversation and retry").then(async choice => {
          if (choice === "Clear conversation and retry") {
            await vscode.commands.executeCommand("vscode-chatgpt.clearConversation");
            await delay(250);
            this.sendApiRequestTemp(prompt, { command: options.command, code: options.code });
          }
        });
      } else if (error.statusCode === 400) {
        message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or one of your parameters is unknown. Reset your settings to default. (HTTP 400 Bad Request)`;

      } else if (error.statusCode === 401) {
        message = 'Make sure you are properly signed in. If you are using Browser Auto-login method, make sure the browser is open (You could refresh the browser tab manually if you face any issues, too). If you stored your API key in settings.json, make sure it is accurate. If you stored API key in session, you can reset it with `ChatGPT: Reset session` command. (HTTP 401 Unauthorized) Potential reasons: \r\n- 1.Invalid Authentication\r\n- 2.Incorrect API key provided.\r\n- 3.Incorrect Organization provided. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.';
      } else if (error.statusCode === 403) {
        message = 'Your token has expired. Please try authenticating again. (HTTP 403 Forbidden)';
      } else if (error.statusCode === 404) {
        message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. (HTTP 404 Not Found)`;
      } else if (error.statusCode === 429) {
        message = "Too many requests try again later. (HTTP 429 Too Many Requests) Potential reasons: \r\n 1. You exceeded your current quota, please check your plan and billing details\r\n 2. You are sending requests too quickly \r\n 3. The engine is currently overloaded, please try again later. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
      } else if (error.statusCode === 500) {
        message = "The server had an error while processing your request, please try again. (HTTP 500 Internal Server Error)\r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
      }

      if (apiMessage) {
        message = `${message ? message + " " : ""}

	${apiMessage}
`;
      }

      this.sendMessage({ type: 'addError', value: message, autoScroll: this.autoScroll });

      return;
    } finally {
      this.inProgress = false;
      this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress });
    }
  }


  public async sendApiRequest(prompt: string, options: { command: string, code?: string, previousAnswer?: string, language?: string; }) {

    if (this.inProgress) {
      // The AI is still thinking... Do not accept more questions.
      return;
    }
    this.questionCounter++;

    this.logEvent("api-request-sent", { "chatgpt.command": options.command, "chatgpt.hasCode": String(!!options.code), "chatgpt.hasPreviousAnswer": String(!!options.previousAnswer) });

    // if (!await this.prepareConversation()) {
    //   return;
    // }

    if (!this.isValidModelConfig()) {
      vscode.window.showWarningMessage("【SmartVscode】:Please configure your API Key of Model in the settings.", "OpenSetting").then(selection => {
        if (selection === "OpenSetting") {
          vscode.commands.executeCommand('workbench.action.openSettings', "@ext:IntelligentComputing.smart-vscode");
        }
      });
      return;
    }

    this.response = '';
    let question = this.processQuestion(prompt, options.code, options.language);
    const responseInMarkdown = !this.isCodexModel;

    // If the ChatGPT view is not in focus/visible; focus on it to render Q&A
    if (this.webView == null) {
      vscode.commands.executeCommand('smart-vscode.view.focus');
    } else {
      this.webView?.show?.(true);
    }

    this.inProgress = true;
    this.abortController = new AbortController();
    this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress, showStopButton: this.useGpt3 });
    this.sendMessage({ type: 'addQuestion', value: prompt, code: options.code, autoScroll: this.autoScroll });
    this.currentMessageId = this.getRandomId();

    try {
      if (this.useGpt3) {
        await this.pipeline.run(question, this.chat);
      }
      if (this.subscribeToResponse) {
        vscode.window.showInformationMessage("ChatGPT responded to your question.", "Open conversation").then(async () => {
          await vscode.commands.executeCommand('smart-vscode.view.focus');
        });
      }
    } catch (error: any) {
      let message;
      let apiMessage = error?.response?.data?.error?.message || error?.tostring?.() || error?.message || error?.name;

      this.logError("api-request-failed");

      if (error?.response?.status || error?.response?.statusText) {
        message = `${error?.response?.status || ""} ${error?.response?.statusText || ""}`;

        vscode.window.showErrorMessage("An error occured. If this is due to max_token you could try `ChatGPT: Clear Conversation` command and retry sending your prompt.", "Clear conversation and retry").then(async choice => {
          if (choice === "Clear conversation and retry") {
            await vscode.commands.executeCommand("vscode-chatgpt.clearConversation");
            await delay(250);
            this.sendApiRequest(prompt, { command: options.command, code: options.code });
          }
        });
      } else if (error.statusCode === 400) {
        message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or one of your parameters is unknown. Reset your settings to default. (HTTP 400 Bad Request)`;
      } else if (error.statusCode === 401) {
        message = 'Make sure you are properly signed in. If you are using Browser Auto-login method, make sure the browser is open (You could refresh the browser tab manually if you face any issues, too). If you stored your API key in settings.json, make sure it is accurate. If you stored API key in session, you can reset it with `ChatGPT: Reset session` command. (HTTP 401 Unauthorized) Potential reasons: \r\n- 1.Invalid Authentication\r\n- 2.Incorrect API key provided.\r\n- 3.Incorrect Organization provided. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.';
      } else if (error.statusCode === 403) {
        message = 'Your token has expired. Please try authenticating again. (HTTP 403 Forbidden)';
      } else if (error.statusCode === 404) {
        message = `Your method: '${this.loginMethod}' and your model: '${this.model}' may be incompatible or you may have exhausted your ChatGPT subscription allowance. (HTTP 404 Not Found)`;
      } else if (error.statusCode === 429) {
        message = "Too many requests try again later. (HTTP 429 Too Many Requests) Potential reasons: \r\n 1. You exceeded your current quota, please check your plan and billing details\r\n 2. You are sending requests too quickly \r\n 3. The engine is currently overloaded, please try again later. \r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
      } else if (error.statusCode === 500) {
        message = "The server had an error while processing your request, please try again. (HTTP 500 Internal Server Error)\r\n See https://platform.openai.com/docs/guides/error-codes for more details.";
      }

      if (apiMessage) {
        message = `${message ? message + " " : ""}

	${apiMessage}
`;
      }

      this.sendMessage({ type: 'addError', value: message, autoScroll: this.autoScroll });

      return;
    } finally {
      this.inProgress = false;
      this.sendMessage({ type: 'showInProgress', inProgress: this.inProgress });
    }
  }

  /**
   * Message sender, stores if a message cannot be delivered
   * @param message Message to be sent to WebView
   * @param ignoreMessageIfNullWebView We will ignore the command if webView is null/not-focused
   */
  public sendMessage(message: any, ignoreMessageIfNullWebView?: boolean) {
    if (this.webView) {
      this.webView?.webview.postMessage(message);
    } else if (!ignoreMessageIfNullWebView) {
      this.leftOverMessage = message;
    }
  }

  private logEvent(eventName: string, properties?: {}): void {
    // You can initialize your telemetry reporter and consume it here - *replaced with console.debug to prevent unwanted telemetry logs
    // this.reporter?.sendTelemetryEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown", ...properties }, { "chatgpt.questionCounter": this.questionCounter });
    console.debug(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown", ...properties }, { "chatgpt.questionCounter": this.questionCounter });
  }

  private logError(eventName: string): void {
    // You can initialize your telemetry reporter and consume it here - *replaced with console.error to prevent unwanted telemetry logs
    // this.reporter?.sendTelemetryErrorEvent(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
    console.error(eventName, { "chatgpt.loginMethod": this.loginMethod!, "chatgpt.authType": this.authType!, "chatgpt.model": this.model || "unknown" }, { "chatgpt.questionCounter": this.questionCounter });
  }

  private getWebviewHtml(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js'));
    const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.css'));

    const vendorHighlightCss = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.css'));
    const vendorHighlightJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'highlight.min.js'));
    const vendorMarkedJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'marked.min.js'));
    const vendorTailwindJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'tailwindcss.3.2.4.min.js'));
    const vendorTurndownJs = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'turndown.js'));

    const nonce = this.getRandomId();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" data-license="isc-gnc">
    <link href="${stylesMainUri}" rel="stylesheet">
    <link href="${vendorHighlightCss}" rel="stylesheet">
    <script src="${vendorHighlightJs}"></script>
    <script src="${vendorMarkedJs}"></script>
    <script src="${vendorTailwindJs}"></script>
    <script src="${vendorTurndownJs}"></script>
</head>
<body class="overflow-hidden">
    <div class="flex flex-col h-screen">
        <div id="introduction" class="flex flex-col justify-between h-full justify-center px-6 w-full relative login-screen overflow-auto">
            <div data-license="isc-gnc-hi-there" class="flex items-start text-center features-block my-5">
                <div class="flex flex-col gap-3.5 flex-1">
                    <!-- <img src="/Users/pengjiazhen/code/github/smart-vscode-extension/images/ai-logo.png" height="48"/> -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="w-6 h-6 m-auto">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path>
                    </svg>
                    <h2>Features</h2>
                    <ul class="flex flex-col gap-3.5" style="font-size: 14px;">
                        <li class="features-li w-full border border-zinc-700 p-3 rounded-md">Describe tasks about VS Code in natural language, and they will be automatically completed.</li>
                        <li class="features-li w-full border border-zinc-700 p-3 rounded-md">Supported tasks cover various functionalities across editor, terminal, extension ...  </li>
                        <li class="features-li w-full border border-zinc-700 p-3 rounded-md">Recommended tasks are those achievable through VS Code commands and settings. </li>
                    </ul>
                    <div class="mt-8" style="font-size: 12px;">
                        <table class="w-full border-collapse border-2 border-dashed border-zinc-700 rounded-md">
                            <thead>
                                <tr>
                                    <th colspan="2" class="p-4 text-center border-b border-dashed border-zinc-700">Input Example</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Increase the font size in my editor to 16. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Enable auto-saving of files every 5 seconds. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Navigate back to the previous location. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Help me set a black theme.</td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Enable the column selection.   </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Disable the tab preview mode to open a file in a new tab.</td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Scroll files together when I view multiple files at the same time. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Open the current file position in the system window. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Increase the amount of scrollback kept in the terminal buffer to 2000. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700">Help me configure the python environment, write a quick sort example in python, and help me execute it. </td>
                                </tr>
                                <tr class="border-b border-zinc-700">
                                    <td class="p-3 text-center border-r border-zinc-700"> ... ... </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4">
                        <a href="https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen?spm=a2c4g.11186623.help-menu-2400256.d_0_1_0.25a41d1c0TzugM&scm=20140722.H_2840915._.OR_help-V_1" ">Get Free Qwen Token</a>
                        <span class="mx-2">|</span>
                        <a href="https://platform.openai.com/api-keys" >Get ChatGPT Token</a>
                    </div>
                </div>
            </div>
            <div class="notification bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Notice:</strong>
                <span class="block sm:inline">The current version shares some free Qwen tokens, but please note that they may be exhausted at any time.</span>
            </div>
            <div class="flex flex-col gap-4 h-full items-center justify-end text-center">
                <p class="max-w-sm text-center text-xs text-slate-500">
                    <a title="" id="settings-button" href="#">Settings</a>&nbsp; | &nbsp;<a title="Supported Tasks" id="github-button" href="https://alibaba.github.io/smart-vscode-extension/en/tutorial/tasks.html">Supported Tasks</a>&nbsp; | &nbsp;<a title="Go to GitHub" id="github-button" href="https://github.com/alibaba/smart-vscode-extension">GitHub</a>&nbsp; | &nbsp;<a title="Read Document" id="doc-button" href="https://alibaba.github.io/smart-vscode-extension/en/index.html">Document</a>
                </p>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto" id="qa-list" data-license="isc-gnc"></div>
        <div class="flex-1 overflow-y-auto hidden" id="conversation-list" data-license="isc-gnc"></div>
        <div id="in-progress" class="pl-4 pt-2 flex items-center hidden" data-license="isc-gnc">
            <div class="typing">Thinking</div>
            <div class="spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
            </div>
            <button id="stop-button" class="btn btn-primary flex items-end p-1 pr-2 rounded-md ml-5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Stop responding</button>
        </div>
        <div class="p-4 flex items-center pt-2" data-license="isc-gnc">
            <div class="flex-1 textarea-wrapper">
                <textarea
                    type="text"
                    rows="1" data-license="isc-gnc"
                    id="question-input"
                    placeholder="Input a question or task..."
                    onInput="this.parentNode.dataset.replicatedValue = this.value"></textarea>
            </div>
            <div id="chat-button-wrapper" class="absolute bottom-14 items-center more-menu right-8 border border-gray-200 shadow-xl hidden text-xs" data-license="isc-gnc">
                <button class="flex gap-2 items-center justify-start p-2 w-full" id="clear-button"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>&nbsp;New chat</button>	
                <button class="flex gap-2 items-center justify-start p-2 w-full" id="settings-button"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>&nbsp;Settings</button>
            </div>
            <div id="question-input-buttons" class="right-6 absolute p-0.5 ml-5 flex items-center gap-2">
                <button id="more-button" title="More actions" class="rounded-lg p-0.5" data-license="isc-gnc">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                </button>
                <button id="ask-button" title="Submit prompt" class="ask-button rounded-lg p-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                </button>
            </div>
        </div>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public getRandomId() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public isValidModelConfig() {
    const config = vscode.workspace.getConfiguration();
    if (Reflect.ownKeys(config.get("smartVscode.chatModelConfig") || {}).length > 0 &&
      Reflect.ownKeys(config.get("smartVscode.embeddingModelConfig") || {}).length > 0) {
      return true;
    }

    if (config.get("smartVscode.apiKey") != "" && config.get("smartVscode.apiBaseUrl") != "") {
      return true;
    }
    return false;
  }
}
