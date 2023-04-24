# Telegram Backend for Rclone

This is a backend for [rclone](https://rclone.org/) that allows uploading, downloading, and deleting files from Telegram using the Telegraf library.

## Installation

1. Install [rclone](https://rclone.org/install/) and [Node.js](https://nodejs.org/)
2. Clone or download the repository to your local machine. 
3. Install the required Node.js packages inside the repo directory:
```bash
npm install github:telegraf/telegraf node-fetch && npm install --save-dev @types/node
```

4. Compile
```bash
tsc telegram-backend.ts
```

## Usage

### Configuration

Before using the Telegram backend, you need to create a Telegram bot and obtain a bot token. You can follow the instructions [here](https://core.telegram.org/bots#creating-a-new-bot) to create a new bot and obtain the token.

You also need to obtain the chat ID of the chat where you want to upload or download files. You can follow the instructions [here](https://stackoverflow.com/questions/32423837/telegram-bot-how-to-get-a-group-chat-id) to obtain the chat ID.

### Running rclone with Telegram backend

To use the Telegram backend with rclone, you need to add the following configuration to your rclone configuration file (usually located at `~/.config/rclone/rclone.conf`):

```
[telegram]
type = telegram
bot_token = <BOT_TOKEN>
chat_id = <CHAT_ID>
```

Replace `<BOT_TOKEN>` and `<CHAT_ID>` with your Telegram bot token and chat ID.

#### Uploading files to Telegram

To upload a file to Telegram, use the `rclone copy` command with the `telegram:` source and the local file path as the destination:

```bash
rclone copy /path/to/local/file telegram:/path/to/remote/file
```

#### Downloading files from Telegram

To download a file from Telegram, use the `rclone copy` command with the `telegram:` destination and the local file path as the source:

```bash
rclone copy telegram:/path/to/remote/file /path/to/local/file
```

#### Deleting files from Telegram

To delete a file from Telegram, use the `rclone delete` command with the `telegram:` remote and the file path:

```bash
rclone delete telegram:/path/to/remote/file
```

#### Mounting Telegram as a local directory

To mount the Telegram backend as a local directory, use the `rclone mount` command:

```bash
rclone mount telegram: /path/to/local/directory
```

This will mount the Telegram backend as a directory at `/path/to/local/directory`.

Note that the mount command will continue running in the foreground until you terminate it with Ctrl+C. If you want to run the mount command in the background, use the `--daemon` option:

```bash
rclone mount telegram: /path/to/local/directory --daemon
```

This will run the mount command in the background as a daemon.

You can also add the `--allow-other` option to allow other users to access the mounted directory:

```bash
rclone mount telegram: /path/to/local/directory --daemon --allow-other
```

## Implementation

This backend is implemented using the Telegraf library to interact with the Telegram API. The `Put()` method reads a local file into chunks and uploads each chunk separately to Telegram using the `sendDocument()` method. The `Get()` method downloads each chunk separately from Telegram using the `exportMessageLink()` method and writes them to the output stream. The `Delete()` method deletes each message separately from the chat using the `deleteMessage()` method.



## Compliement with Telegram Terms Service 
Rclone is an open-source command-line program that allows users to sync files and directories between different cloud storage providers. One of the features of rclone is the ability to use Telegram as a backend for remote storage.

According to the Telegram API terms of service (TOS), using the Telegram API for file storage is allowed as long as the files are related to the user's personal use and do not infringe on any copyrights or intellectual property rights. The Telegram API TOS also states that Telegram reserves the right to block the access of any user or application that violates the terms of service.

The rclone Telegram backend complies with the Telegram API TOS by using the Telegram API to store files only for the purpose of syncing files between the user's devices. The rclone Telegram backend does not provide any public access to the files stored on Telegram, and the files are only accessible to the user who uploaded them.

Additionally, the rclone Telegram backend encrypts the files using client-side encryption, which means that the files are encrypted on the user's device before they are uploaded to Telegram. This ensures that the files are protected from unauthorized access, even if they were to be intercepted by a third party.

Overall, the rclone Telegram backend complies with the Telegram API TOS by ensuring that the files stored on Telegram are used only for personal use and are encrypted to protect the user's privacy.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
