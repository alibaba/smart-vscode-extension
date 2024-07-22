<h3 align="center"><img src="https://github.com/alibaba/smart-vscode-extension/blob/main/images/ai-logo.png?raw=true" height="64"><br>SmartVscode: Controlling anything of Vscode by natural language</h3>

<div align="center">

![](https://img.shields.io/visual-studio-marketplace/v/gencay.vscode-chatgpt?color=orange&label=VS%20Code)
![](https://img.shields.io/badge/license-Apache--2.0-black")
[![](https://img.shields.io/badge/Docs-English%7C%E4%B8%AD%E6%96%87-blue?logo=markdown)](https://alibaba.github.io/app-controller/en/index.html)

</div>



## News
- <img src="https://img.alicdn.com/imgextra/i3/O1CN01SFL0Gu26nrQBFKXFR_!!6000000007707-2-tps-500-500.png" alt="new" width="30" height="30"/>**[2024-06-27]** We have now released the **SmartVscode** v1.0 version, it is based on [App-Controller](https://github.com/alibaba/app-controller) framework.

## What's SmartVscode?
**SmartVscode** aims to revolutionize how we interact with the powerful capabilities of Visual Studio Code by harnessing the simplicity and intuitiveness of natural language. Envision seamlessly toggling themes, connecting to remote servers, or even generate a mini-game — all articulated through natural language. This innovative method is designed to make coding more efficient and advanced, taking users into a new stage of interacting with software.

- 🔥 **Natural Language Command Interface**: Execute a wide array of VS Code commands simply by expressing your intention in natural language. No need to memorize complex command syntax or search through menus—let the plugin understand and act upon your instructions.

- ➕ **Automated Task Execution**: Streamline your development workflow with tasks automated by your descriptions. Whether you need to switch up your coding environment by changing themes and fonts or start a new project component like a mini-game, just ask and it's done.

- 📃 **Interactive Sidebar Conversations**: Engage in a dynamic conversation with your editor. Get instant responses right in your sidebar conversation window (feature coming soon)


## Feature Video

### Tic-tac-toe Game

<!-- https://github.com/alibaba/pilotscope/assets/31238100/eef9765a-8cda-4654-a147-475ed1a13c58 -->
![game](https://github.com/alibaba/smart-vscode-extension/blob/main/images/game8x.gif?raw=true)

### Style Changing

<!-- https://github.com/alibaba/pilotscope/assets/31238100/18480837-b90f-44d6-8c28-d5f17a4552da -->
![style](https://github.com/alibaba/smart-vscode-extension/blob/main/images/fontsize2x.gif?raw=true)

### Theme Changing

<!-- https://github.com/alibaba/pilotscope/assets/31238100/2a8cd2fd-22df-4ba0-a564-90cad6c708bb -->
![Theme Changing](https://github.com/alibaba/smart-vscode-extension/blob/main/images/theme1_8x.gif?raw=true)


### Enable auto saving

<!-- https://github.com/alibaba/pilotscope/assets/31238100/77548e8a-2832-4770-8924-ea479646e3a8 -->
![Auto Saving](https://github.com/alibaba/smart-vscode-extension/blob/main/images/autosave2x.gif?raw=true)


## Roadmap
- More supported capabilities of Vscode to called by natural language
- Supporting streaming response for user simple question.
- Introducing user feedback for task. 
- More beautiful UI view.
## How to use
To begin utilizing this extension, follow these steps:
### Installation
1. Navigate to the Visual Studio Code Extension Marketplace.
2. Search for and install the extension.
### Add Model Config
Once the extension is installed:
- Locate the chat window titled "SmartVscode" in your left sidebar, which should resemble the following:
<p align="center"><img src="https://github.com/alibaba/smart-vscode-extension/blob/main/images/image.png?raw=true" alt="alt text" width="200"/></p>

- Configure your model settings within the extension:
   - Access the our settings by clicking "Settings" button:
   - For using OpenAI, input your API key and select your preferred chat and embedding models
<p align="center"><img src="https://github.com/alibaba/smart-vscode-extension/blob/main/images/image-2.png?raw=true" alt="alt text" width="400"/></p> 

   - For other AI models, like qwen, you should add the model configuration directly to your settings.json file, accessible via the "Edit in settings.json" button:
     - ![alt text](https://github.com/alibaba/smart-vscode-extension/blob/main/images/image-3.png?raw=true)
     -  All format for model config need to obey the [format](https://modelscope.github.io/agentscope/en/tutorial/203-model.html).
     - A example on using setting file to configure openAI model.
     - ```json
        "smartVscode.chatModelConfig": {
            "Lightweight": {
            "model_type": "openai_chat",
            "model_name": "your modelName",
            "api_key": "your apiKey",
            "client_args": {
                "base_url": "your baseUrl"
            }
            },
            "Advanced": {
            "model_type": "openai_chat",
            "model_name": "your modelName",
            "api_key": "your apiKey",
            "client_args": {
                "base_url": "your baseUrl"
            }
            }
        },
        "smartVscode.embeddingModelConfig": {
            "model_type": "openai_embedding",
            "model_name": "your modelName",
            "api_key": "your apiKey",
            "client_args": {
            "base_url": "your baseUrl"
            }
        }
        ```

## Supported Tasks
Here we provide an overview of the tasks supported by SmartVscode. 


| Task                  | Input Example                                   |
| --------------------- | ----------------------------------------------- |
| **Settings**          |                                                 |
| Theme                 | Switch to dark theme                            |
| Font                  | Set font size to 14                             |
| Keybinding            | I want to set a shortcut key for saving as      |
| **Editor**            |                                                 |
| Format                | Format this file                                |
| Format                | Format the selected code                        |
| Replace               | Replace "var" with "let"                        |
| Comment               | Comment the selected code                       |
| Comment               | Uncomment the selected code                     |
| Duplicate             | Duplicate the current line                      |
| Duplicate             | Duplicate the selected code                     |
| File                  | Open the file named "main.py"                   |
| Navigate              | Go to line 20                                   |
| Navigate              | Jump to the function "greet"                    |
| Navigate              | Navigate back to the previous location          |
| Fold                  | Collapse all sections in the current JSON file  |
| Fold                  | Unfold all sections in the current JSON file    |
| **View**              |                                                 |
| Workspace             | Open a workspace folder in a new window         |
| Workspace             | Close current workspace folder                  |
| Sidebar               | Close the sidebar on the left                   |
| **Execution**         |                                                 |
| Breakpoint            | Set a breakpoint at line 50                     |
| Debug                 | Start debugging                                 |
| Debug                 | Run the file named "main.py"                    |
| **Remote Connection** |                                                 |
| Config                | Open the remote configuration file              |
| Connection            | Create a remote ssh server connection in vscode |
| **Extension**         |                                                 |
| Install               | Install the extension named "python"            |

## Documentation
[Documentation](https://alibaba.github.io/smart-vscode-extension) provides the comprehensive information on how to develop SmartVscode. You can refer to these documentations for an improved experience with SmartVscode.

## License
SmartVscode is released under Apache License 2.0.

