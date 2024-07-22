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

## How to develop

This extension project is divided into two parts:

- **Frontend** is responsible for the user interaction interface, communication with the backend service, and executing the API calls returned by the backend service.

- **Backend** utilizes large language models (LLMs) to orchestrate the optimal API calls to fulfill user requirements based on [App-Controller](https://github.com/alibaba/app-controller) framework.

When you only need to develop the frontend of the extension, you can install the frontend from source code and start your own backend service from a container for testing and development.

### Install the extension frontend from source code
- Before you start, ensure that you have `Node.js` and `npm` installed on your system.
- Clone the [repository](https://github.com/alibaba/smart-vscode-extension.git) to your local machine
- Install the `Yarn` package manager by running `npm install --global yarn`
- On the root directory, run `yarn` command to install the dependencies listed in `package.json`
- Within VS Code - run the project by simply hitting `F5`

### Start your own backend service from a container
- Download the `Dockerfile` from the link by running 
    ```bash
    wget https://raw.githubusercontent.com/alibaba/pilotscope/master/Dockerfile
    ``` 
- Build a Docker image named `llm4api` locally by running:
    ```bash
    docker build -t llm4api:latest \
    --build-arg OPENAI_BASE_URL='https://api.openai.com' \
    --build-arg OPENAI_API_KEY='your_api_key' \
    --build-arg SERVER_PORT='your_server_port_number_in_contain' \
    .
    ```
    Replace `your_api_key` and `your-server-port-number-in-contain` with your own settings.

    - `OPENAI_BASE_URL` is the base URL for the OpenAI API. It specifies the endpoint for API calls. The default value is `'https://api.openai.com'`. Modify it only if you are using a different endpoint. If you customize it, please make sure you have the same format. e.g. starts with `https://` without a trailing slash. The completions endpoint suffix is added internally, e.g. for reference: `${apiBaseUrl}/v1/completions`
    - `OPENAI_API_KEY` is your unique API key for authenticating requests to the OpenAI API. Replace `your_api_key` with your actual API key obtained from [OpenAI](https://beta.openai.com/account/api-keys).
    - `SERVER_PORT` (optional) specifies the port number inside the container where the service will start. The default setting is 5000. You can modify it based on your preference or requirements.

- Start a Docker container by running:
    ```bash
    docker run -it  --name llm4api_test  --shm-size 5gb  --cap-add sys_ptrace  -p your_server_port_number_in_host:your_server_port_number_in_contain -p 5022:22 -d llm4api /bin/bash
    ```
    This command boots up a container named `llm4api_test`. `your_server_port_number_in_host` and `your_server_port_number_in_contain` should be replaced with your own settings. Port mappings are configured as follows:

    - The container’s port `your_server_port_number_in_contain` is mapped to host machine’s port `your_server_port_number_in_host` (5000 is recommended), allowing starting the backend service via host port `your_server_port_number_in_host`. 
    - (Recommended) The container’s port 22 (SSH) is mapped to host machine’s port 5022, enabling SSH access to the container from the host via port 5022.

### Configure Frontend to Communicate with Backend
- Ensure that the frontend can correctly access the backend service. Modify `llm4apisServiceBaseUrl` in the `src/Common/Config.ts` file of the frontend project to set the backend service URL. Ensure that the `IP address` and the `port number` correspond to the **host machine** where the service is deployed. 

## License
SmartVscode is released under Apache License 2.0.

