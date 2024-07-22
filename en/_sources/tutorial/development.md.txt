(development-en)=

# How to develop

This extension project is divided into two parts:

- **Frontend** is responsible for the user interaction interface, communication with the backend service, and executing the API calls returned by the backend service.

- **Backend** utilizes large language models (LLMs) to orchestrate the optimal API calls to fulfill user requirements based on [App-Controller](https://github.com/alibaba/app-controller) framework.

When you only need to develop the frontend of the extension, you can install the frontend from source code and start your own backend service from a container for testing and development.

## Install the extension frontend from source code
- Before you start, ensure that you have `Node.js` and `npm` installed on your system.
- Clone the [repository](https://github.com/alibaba/smart-vscode-extension.git) to your local machine
- Install the `Yarn` package manager by running `npm install --global yarn`
- On the root directory, run `yarn` command to install the dependencies listed in `package.json`
- Within VS Code - run the project by simply hitting `F5`

## Start your own backend service from a container
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

## Configure Frontend to Communicate with Backend
- Ensure that the frontend can correctly access the backend service. Modify `llm4apisServiceBaseUrl` in the `src/Common/Config.ts` file of the frontend project to set the backend service URL. Ensure that the `IP address` and the `port number` correspond to the **host machine** where the service is deployed. 
