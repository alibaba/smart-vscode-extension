import * as vscode from 'vscode';
import Config from '../Common/Config';
import { ApiMessage } from "../Common/Constants";
import ApiExecuteData from "./ApiExecuteData";
import { registerApi } from "./ApiScheduler";


export default class ThemeApis {
    public config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    @registerApi(ApiMessage.getQueryMsg("themes"))
    public async listThemes(): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            const themeExtensions = vscode.extensions.all.filter(ext => {
                const contributes = ext.packageJSON.contributes;
                // 检查扩展的贡献部分是否包含主题信息（文本颜色、图标、工作台）
                return contributes &&
                    (contributes.themes || contributes.iconThemes || contributes.workbenchThemes);
            });

            // 获取主题扩展的显示名称和id
            const themeInfos = themeExtensions.map(ext => {
                const contributeThemes = ext.packageJSON.contributes.themes || [];
                // 主题扩展可能包含多个主题，我们需要映射每个主题
                return contributeThemes.map(theme => ({
                    id: theme.id || theme.label, // 主题ID，如果未提供ID则使用label
                    uiTheme: theme.uiTheme, // 可以指示是 light, dark 或高对比主题
                }));
            }).flat(); // 扁平化数组，因为每个扩展可能包含多个主题
            apiExecuteData.executeSuccess(JSON.stringify(themeInfos));
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to list themes: ${e}`);
        }
        return apiExecuteData;
    }

    @registerApi(ApiMessage.getActionMsg("apply theme"), true)
    public async applyTheme(themeId: string, uiTheme: string): Promise<ApiExecuteData> {
        const apiExecuteData = new ApiExecuteData();
        try {
            console.log(`Applying theme: ${themeId}, uiTheme: ${uiTheme}`);
            let themeType = '';
            switch (uiTheme) {
                case 'vs-dark':
                case 'vs-light':
                case 'vs-high-contrast':
                case 'vs':
                    themeType = 'workbench.colorTheme';
                    break;
                // 如果上述 case 不符，我们可以假设这是个图标主题，或者你也可以在 themeInfos 中加入其他属性用于区分
                default:
                    throw new Error(`Unknown uiTheme: ${uiTheme}`);
            }

            const config = vscode.workspace.getConfiguration();
            config.update(themeType, themeId, vscode.ConfigurationTarget.Global)
                .then(() => {
                    vscode.window.showInformationMessage(`Theme has been applied: ${themeId}`);
                }, (err) => {
                    vscode.window.showErrorMessage(`Failed to apply the theme: ${err}`);
                });
            apiExecuteData.executeSuccess(`Theme has been applied`);
        } catch (e) {
            apiExecuteData.executeFailed(`Failed to apply theme: ${e}`);
        }
        return apiExecuteData;
    }
}