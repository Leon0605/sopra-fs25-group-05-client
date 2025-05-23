# Habla!: A multilingual ChatApp

## Introduction
Our primary goal for this project was to create a chat app, that would enable users that don't speak the same language to effortlessly chat with each other by integrating a translation service into the chat itself thus allowing to overcome language barriers.
Our secondary goal was to utilize the chats for language learning by providing a flashcards that can be created from real messages sent. In this way, users are able to directly target their language learning towards phrases and areas of interest they are likely to encounter in the real world.

## Technologies
- Vercel for deployment
- SpringBoot/REST for API
- WebSockets for real time chatting

## High-level Components
- The Navbar (app/components/Navbar.tsx) is a navigation component which site across all pages for a logged in user. It's functions are to provide consistent navigation across all pages and to provide almost real time notifications (friend requests and incoming messages). The Navbar takes a prop of notificationsEnabled which helps configure 'real-time' notifications for users. Friend requests and incoming messages can be retrieved through the bell and envelope icons, which provide drop-downs for each category.
The notificationsEnabled status on the Navbar can only be set on the /users/[id] page for the logged-in user. The toggle allows users to choose if they want to receive pop-up friend requests and message notifications - these settings also flow through to other pages (such as /main, /flashcards). 

- The context for the alert is derived from ./alertContext.tsx. This sets the alert formatting, positioning and timing for the alert messages across subsequent pages. There are two categories of alerts: 'success' messages are displayed with a light pink background and 'danger' messages (representing errors in processing) are shown with a red background. 

- Formatting for the chats and chats/[id] page is implemented through .chats/layout.tsx. This provides the layout which is a function of the components /components/ChatSummary.tsx and /components/ChatDetail.tsx. The ChatSummary.tsx component provides an efficient mechanism for navigating to prior chats with other users. By simply clicking on the desired chat, the entire chat message history (and translations if applicable) are loaded in the ChatDetails.tsx pane.

- ChatDetail.tsx is critical for the functioning of the exchange of real-time messages which are implemented through a websocket interface, sockjs.

- The ChatDetail.tsx page implements a real-time chat interface for users. It features:

*WebSocket Integration:* Using SockJS and STOMP for real-time message delivery and updates, subscribing to chat topics based on user language and chat ID.
*Message Display:* Shows a scrollable list of chat messages, including sender profile pictures, usernames, original and translated messages (if the users are messaging in different languages), timestamps, and message status (sent/read).
*Message Input:* Provides a form for sending new messages, which are published to the server via WebSocket.
*Flashcard Integration:* Allows users to add chat messages as flashcards to their study sets via a modal dialog, supporting selection of flashcard sets and front/back content editing.
*Usability:* Automatically scrolls to the newest message, and provides feedback for actions like adding flashcards.

The flashcards and training pages provide components which allow users of Habla! to create flashcards either manually or directly from within chats (using specific chat messages and translations). 



### Set-Up


#### MacOS, Linux and WSL

If you are using MacOS, Linux or WSL(Windows-Subsystem-Linux), you can skip
directly to the
[installation part](#installation)

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
   [youtube tutorial](https://youtu.be/GIYOoMDfmkM).

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

> **Important:** certain features (like uploading a profile picture) only work when using the deployed Server


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


### Launch & Deployment
Within the Linux subsystem, run the following commands on your computer.
1. Clone the Repository:
```shell
   git clone https://github.com/Leon0605/sopra-fs25-group-05-client.git
   cd sopra-fs25-group-05-client
   ```

2. Install node.js and npm:
```shell 
   sudo apt update
   sudo apt install nodejs npm
   ```

3. Install dependencies:
```shell
   npm install
   ```

4. Configuration of backend domain:
The domain.ts file requires different endpoints for development and production. The /utils/domain.ts file provides the configuration between the production and development backend addresses as:
   const prodUrl = process.env.NEXT_PUBLIC_PROD_API_URL ||
   "https://sopra-fs25-group-05-server.oa.r.appspot.com/"; 
   const devUrl = "http://localhost:8080/";

5. Run the application in the applicable mode. Running in development mode can be achieved through:
```shell
   npm run dev
   ```
This will run the application locally on http://localhost:3000
Alternatively, building in a production environment can be done through: 
```shell
   npm run build
   ```
Following this, running the production build can be done via:
```shell
   npm run start
   ```

6. Automatic / Manual Deployment
Pushing updated code to the main branch automatically triggers a deployment to Vercel via GitHub actions. If, for some reason, you would like to ignore errors and warnings prior to automatic deployment, this can be achieved by setting the configuration of the next.config.ts file as below:

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

We recommend building the code locally using 
```shell
   npm run build
   ``` 
   and addressing any errors or warnings (by ensuring your code passes all tests) prior to deployment. 

## Illustrations

## Roadmap

## Authors and acknowledgments
### Authors

- Christopher Robert Traill: Team Leader, Frontend Developer
- Nikola Pavlovic: Backend Developer
- Andy de Vantéry: Frontend Developer
- Leon Matteo Schwager: Backend Developer

### Acknowledgments
This project was developed as part of the [Software Engineering Lab FS25](https://hasel.dev/teachings/fs25-sopra/) at the University of Zurich.

Special thanks to our teaching assistant Ambros Eberhard for his continuous feedback and guidance throughout the project.
## License

This project is licensed under the Apache License 2.0.
You are free to use, modify, and distribute this software, provided that proper attribution is given and all conditions of the license are met.
For more information, see the [LICENSE](https://github.com/Leon0605/sopra-fs25-group-05-server/blob/main/LICENSE) file.
