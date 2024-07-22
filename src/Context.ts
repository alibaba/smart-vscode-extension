/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { getCurFocusFilePath, getWorkspaceFolder } from "./Apis/Utils";


export class Context {
    public userId = "";
    public sessionId = "";
    public content = "";
    public workspaceFolder = "";
    public curFile = "";
    public chatModelConfig: any;
    public embeddingModelConfig: any;

    // for test
    private isTest = false;
    private testAnswer = "";


    constructor(userId: string, sessionId: string, content: any = undefined, isTest: boolean = false, testAnswer: string = "") {
        this.userId = userId;
        this.sessionId = sessionId;
        this.content = content;
        this.workspaceFolder = getWorkspaceFolder() || "";
        this.curFile = getCurFocusFilePath() || "";
        const config = vscode.workspace.getConfiguration();
        this.chatModelConfig = this.existedModelConfig("smartVscode.chatModelConfig") ? config.get("smartVscode.chatModelConfig") : this.getOpenAIChatModelConfig();
        this.embeddingModelConfig = this.existedModelConfig("smartVscode.embeddingModelConfig") ? config.get("smartVscode.embeddingModelConfig") : this.getOpenAIEmbeddingModelConfig();

        // for test
        this.isTest = isTest;
        this.testAnswer = testAnswer;
    }


    public toObject() {
        console.log("Context: ", this);
        const environments = {
            "The current workspace folder": this.workspaceFolder,
            "The current file": this.curFile
        };

        return {
            userId: this.userId,
            sessionId: this.sessionId,
            content: this.content,
            environments: environments,
            chatModelConfig: this.chatModelConfig,
            embeddingModelConfig: this.embeddingModelConfig,
            isTest: this.isTest,
            testAnswer: this.testAnswer
        };
    }



    private getOpenAIChatModelConfig(isLight: boolean = false): Object {
        const config = vscode.workspace.getConfiguration();
        // extract the necessary configuration

        const apiKey = config.get("smartVscode.apiKey");
        const baseUrl = new URL("v1", config.get("smartVscode.apiBaseUrl") || "https://api.openai.com").toString();
        const modelName = isLight ? config.get("smartVscode.chatLightModel") : config.get("smartVscode.chatAdvancedModel");

        /* eslint-disable @typescript-eslint/naming-convention */
        return {
            "Lightweight": {
                "model_type": "openai_chat",
                "model_name": modelName,
                "api_key": apiKey,
                "client_args": {
                    "base_url": baseUrl,
                }
            },
            "Advanced": {
                "model_type": "openai_chat",
                "model_name": modelName,
                "api_key": apiKey,
                "client_args": {
                    "base_url": baseUrl,
                }
            }
        };
    }

    private getOpenAIEmbeddingModelConfig(): Object {
        const config = vscode.workspace.getConfiguration();
        // extract the necessary configuration
        const apiKey = config.get("smartVscode.apiKey");
        const baseUrl = new URL("v1", config.get("smartVscode.apiBaseUrl") || "https://api.openai.com").toString();
        const modelName = config.get("smartVscode.embeddingModel");

        /* eslint-disable @typescript-eslint/naming-convention */
        return {
            "model_type": "openai_embedding",
            "model_name": modelName,
            "api_key": apiKey,
            "client_args": {
                "base_url": baseUrl,
            }
        };
    }

    private existedModelConfig(name: string): boolean {
        const config = vscode.workspace.getConfiguration();
        return Reflect.ownKeys(config.get(name) || {}).length > 0;
    }
}