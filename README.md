# Telegram Backend for RClone (Still Under Development) *Broken at the moment*

This is a backend for [RClone](https://rclone.org/) that allows you to use Telegram as a remote storage service.

## Installation

To use this backend, you need to have RClone installed. You can download the latest version of RClone from their [official website](https://rclone.org/downloads/).

To use this backend, you also need to have a Telegram bot and chat ID. You can create a bot and obtain the chat ID by following the instructions in [Telegram's Bot API documentation](https://core.telegram.org/bots#creating-a-new-bot).

Once you have RClone and a Telegram bot set up, you can install this backend by running the following command:

```
go install github.com/greengeckowizard/RcloneTelegram@latest
```

## Configuration

To use this backend, you need to add it to your RClone configuration file. You can do this by running the following command:

```
rclone config
```

Then, follow the prompts to configure the backend. You will need to provide your Telegram bot token and chat ID.

Here's an example configuration:

```
[mytelegram]
type = telegram
token = <your-telegram-bot-token>
chat_id = <your-telegram-chat-id>
```

You can replace "mytelegram" with any name you like.

## How to Test

Since this code is still in development, it is recommended that you test it thoroughly before using it for production purposes.

To test the backend, you can try running the following RClone commands:

```
rclone lsf mytelegram:/
```

This should list the contents of your Telegram chat.

```
rclone copy /path/to/local/file mytelegram:/remote/path
```

This should upload the local file to your Telegram chat.

```
rclone copy mytelegram:/remote/path /path/to/local/file
```

This should download the remote file from your Telegram chat to the local file system.

Note that the Telegram backend only supports files up to 2GB in size.

## Community
[Discord Server](https://discord.gg/H7Qud9Y2eJ)

