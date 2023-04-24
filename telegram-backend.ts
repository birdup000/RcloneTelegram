import { Readable, Writable } from 'stream';
import { Telegraf } from 'telegraf';
import { Config } from 'rclone';
import express from 'express';
import fetch from 'node-fetch';

// This is a type annotation for the `config` parameter.
// It specifies that the `config` parameter must be an object
// with a property called `telegram`.
interface TelegramConfig {
  botToken: string;
  chatId: number;
}

class TelegramBackend {
  private config: TelegramConfig;
  private bot: Telegraf;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.bot = new Telegraf(this.config.botToken);
  }

  async Put(inputStream: Readable, out: Writable) {
    if (!inputStream.readable) {
      throw new Error('Input stream is not readable');
    }

    const chunks = [];
    for await (const chunk of inputStream) {
      chunks.push(chunk);
    }

    await Promise.all(chunks.map(async (chunk) => {
      await this.bot.telegram.sendDocument(this.config.chatId, { source: chunk });
    }));
  }

  async Get(outStream: Writable, inPath: string) {
    if (!outStream.writable) {
      throw new Error('Output stream is not writable');
    }

    const response = await fetch(`https://api.telegram.org/file/bot${this.config.botToken}/${inPath}`);
    const buffer = await response.buffer();
    await outStream.write(buffer);
  }

  async Delete(inPath: string) {
    await this.bot.telegram.deleteMessage(this.config.chatId, inPath);
  }

  // This is a function that starts listening for messages from Telegram.
  start() {
    this.bot.launch();
  }

  // This is a function that stops listening for messages from Telegram.
  async stop() {
    await this.bot.stop();
  }
}

// This is a function that starts the server.
async function startServer() {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.listen(3000, () => {
    console.log(`Server started on port ${3000}`);
  });
}

// This is the main function.
async function main() {
  // Get the Telegram config.
  const config = {
    botToken: process.env.BOT_TOKEN,
    chatId: Number(process.env.CHAT_ID),
  };

  // Create a TelegramBackend instance.
  const telegramBackend = new TelegramBackend(config);

  // Start the server.
  await startServer();

  // Start listening for messages from Telegram.
  telegramBackend.start();

  // Wait for the user to press `Ctrl`+`C` to exit.
  process.on('SIGINT', () => {
    // Stop the server.
    (async () => {
      await telegramBackend.stop();
      process.exit();
    })();
  });
}

// Run the main function.
main();
