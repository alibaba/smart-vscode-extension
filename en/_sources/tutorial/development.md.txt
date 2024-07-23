(development-en)=

# How to develop

This extension project is divided into two parts:

- **SmartVscode Side (Frontend)**: It is responsible for the user interaction interface, communication with the backend service, and executing the API calls returned by the backend service.

- **App-Controller Side （Backend）**: It utilizes large language models (LLMs) to orchestrate the optimal API calls to fulfill user requirements based on [App-Controller](https://github.com/alibaba/app-controller) framework.

When you need to develop the SmartVscode extension, you need to install the frontend from source code and start your own backend service for testing and development.


## Step 1: Start your own backend service
- Install the backend (i.e. App-Controller) by following the [docs](https://alibaba.github.io/app-controller/en/tutorial/installation.html).

- Configure the service by following the [docs](https://alibaba.github.io/app-controller/en/tutorial/deploy.html#step3-configuration-your-app-controller).

- Start your own backend service by following the [docs](https://alibaba.github.io/app-controller/en/tutorial/deploy.html#step4-start-the-service).


## Step 2: Install and run the SmartVscode extension
- Before you start, ensure that you have `Node.js` and `npm` installed on your system.
- Clone the [repository](https://github.com/alibaba/smart-vscode-extension.git) to your local machine
    ```shell
    git clone git@github.com:alibaba/smart-vscode-extension.git
    ```
- Install the `Yarn` package manager by running `npm install --global yarn`
- On the root directory, run `yarn` command to install the dependencies listed in `package.json`
    ```shell
    yarn install 
    ```
- Configure the URL and Port of http communication  between `SmartVscode extension` with `App-Controller Side （Backend）`  by modifying `llm4apisServiceBaseUrl` in the `src/Common/Config.ts` file. Ensure that the `llm4apisServiceBaseUrl` correspond to the service to be deployed. 
- Within VS Code - run the project by simply hitting `F5`



## Step3: Start to develop

- You can expand the functionality of SmartVscode by providing more API knowledge, specifically referring to: [Data Preparation](https://alibaba.github.io/app-controller/en/tutorial/deploy.html#step1-data-preparation).

- You can expand more interactions between SmartVscode (fontend) and App-Controller (backend) by referring to:
[Communication Interface Implementation](https://alibaba.github.io/app-controller/en/tutorial/deploy.html#step2-communication-interface-implementation).
