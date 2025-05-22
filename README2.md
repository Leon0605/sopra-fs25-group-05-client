# Habla!: A multilingual ChatApp

## Introduction
Our primary goal for this project was to create a chat app, that would enable users that don't speak the same language to effortlessly chat with each other by integrating a translation service into the chat itself thus allowing to overcome language barriers.
Our secondary goal was to utilize the chats for language learning by providing a flashcards that can be created from real messages sent.


## Technologies
- Vercel for deployment
- SpringBoot/REST for API
- WebSockets for real time chatting

## High-level Components


## Launch & Deployment
### Set-Up


#### MacOS, Linux and WSL

If you are using MacOS, Linux or WSL(Windows-Subsystem-Linux), you can skip
directly to the
[installation part](https://github.com/Leon0605/sopra-fs25-group-05-client/blob/main/README.md#installation)

#### Windows

If you are using Windows, you first need to install
WSL(Windows-Subsystem-Linux). You might need to reboot your computer for the
installation, therefore, save and close all your other work and programs

1. Download the following [powershell script](./windows.ps1)\
   ![downloadWindowsScript](https://github.com/user-attachments/assets/1ed16c0d-ed8a-42d5-a5d7-7bab1ac277ab)

---
2. Open a new powershell terminal **with admin privileges** and run the following command and follow the instructions. Make sure that you open the powershell terminal at the path where you have downloaded the powershell script, otherwise the command will not work because it can not find the script. You can list currently accessible files in the powershell terminal with ```dir``` and you can use ```cd``` to navigate between directories
   ```shell
   C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File .\windows.ps1
   ```
---

3. If you experience any issues, try re-running the script a couple of times. If
   the installation remains unsuccessful, follow this
   [youtube tutorial](https://youtu.be/GIYOoMDfmkM) or post your question in the
   OLAT forum

---
4. After successful installation, you can open WSL/Ubuntu. You will need to choose a username and password, although no characters will be shown on the screen when typing the password but the system recognizes your input, no worries :) After these four steps your setup should look similar to this
   ![initialUbuntuScreen](https://github.com/user-attachments/assets/a2b1511f-943b-468e-a726-b7a9dc46ea2c)
   <br>
   <br>
   <br>
### Installation
1. Open a new MacOS, Linux or WSL(Windows-Subsystem-Linux) terminal. Make sure you have git installed, you can check that by running
   ```shell
   git --version
   ```
   The output should be something similar to ```git version X.XX.X```, if not, try to install git in one of the following ways
   #### MacOS
   ```shell
   brew install --formulae git
   ```
   #### Linux/WSL
   ```shell
   sudo apt-get install git
   ```
   If you are not using Ubuntu, you will need to install git with your package manager of choice
---

2. Clone the repository with git using the following command
   ```shell
   git clone https://github.com/YOUR_USERNAME/YOUR-CLIENT-REPO
   ```

---
3. Navigate to the cloned directory in the terminal, in example with ```cd sopra-fs25-student-client```
---

4. Inside the repository folder (with `ls` you can list files) there is a bash
   script _setup.sh_ that will install everything you need, according to the
   system you are using. Run the following command and follow the instructions
   ```shell
   source setup.sh
   ```

The screenshot below shows an example of how this looks
![sourceScript](https://github.com/user-attachments/assets/2560320a-93ec-4086-994d-f3a0eed53c7b)

The installation script _setup.sh_ can take a few minutes, please be patient and
do not abort the process. If you encounter any issues, please close the terminal
and open a new one and try to run the command again
<br>
<br>
<br>
### Troubleshooting the installation

If the four steps above did not work for you and re-running the setup.sh script
a couple of times did not help, try running the following steps manually

1. Open a new MacOS, Linux or WSL(Windows-Subsystem-Linux) terminal and navigate
   to the repository with `cd`. Then ensure that curl is installed
   ```shell
   curl --version
   ```
   The output should be something similar to `curl X.X.X`, if not, try to
   install curl in one of the following ways
   #### MacOS
   ```shell
   brew install --formulae curl
   ```
   #### Linux/WSL
   ```shell
   sudo apt-get install curl
   ```
   If you are not using Ubuntu, you will need to install curl with your package
   manager of choice

---
2. Download Determinate Nix
   ```shell
   curl --proto '=https' --tlsv1.2 -ssf --progress-bar -L https://install.determinate.systems/nix -o install-nix.sh
   ```
---

3. Install Determinate Nix
   ```shell
   sh install-nix.sh install --determinate --no-confirm --verbose
   ```

---
4. Install direnv using nix
   ```shell
   nix profile install nixpkgs#direnv
   ```
   If you encounter a permission error, try running with sudo
   ```shell
   sudo nix profile install nixpkgs#direnv
   ```
---

5. Find out what shell you are using
   ```shell
   echo $SHELL
   ```

---
6. Hook direnv into your shell according to [this guide](https://github.com/direnv/direnv/blob/master/docs/hook.md)
---

7. Allow direnv to access the repository
   ```shell
   direnv allow
   ```

If all troubleshooting steps above still did not work for you, try the following
as a **last resort**: Open a new terminal and navigate to the client repository
with `cd`. Run the command. Close the terminal again and do this for each of the
six commands above, running each one in its own terminal, one after the other.
<br>
<br>
<br>
### Additional Dependencies

To run the front end code a new developer would also have to install additional dependencies using:
>npm install {package}

The packages include:
- react-datepicker
- stomp
- bootstrap
- react-use-websocket
- sockjs-client
- bootstrap-icons

#### Server
Depending on if you want to use the deployed server or server running local you would have to update [this file](https://github.com/Leon0605/sopra-fs25-group-05-client/blob/main/app/utils/domain.ts):
> prodUrl = "http://localhost:8080" : if server is running locally\
> prodUrl = "https://sopra-fs25-group-05-server.oa.r.appspot.com/" : if using deployed server

Analog for devUrl if using developement mode

Important: certain features (like uploading a profile picture) only work when using the deployed Server


#### Browser
The application is intended to be run using Google Chrome
### Commands

#### Development Mode
To run the code in developer mode locally a new developer would have to use the command:
> npm run dev \
> deno task dev

#### Building & Running
To build the product:
> npm run build\
> deno task build

And to run the code locally:
> npm run start\
> deno task start

### Testing
The best way to test the frontend is to run it locally and manually test the wanted feature. 
To test the WebSockets on a single device it is recommended to use a standard and a incognito browser tab.

### Deployment
To deploy a new version you have to commit fully functional code (without errors) to the main branch on github. This will automatically try to deploy the newest commit to vercel.
If there are any compiler errors the deployment will fail, therefore you should build the product first locally to account for possible errors and avoid deployment failure. This is configured in the [github workflow files](https://github.com/Leon0605/sopra-fs25-group-05-client/tree/main/.github/workflows)

## Illustrations

## Roadmap

## Authors and acknowledgements

## License