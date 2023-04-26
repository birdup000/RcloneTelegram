import { Readable, Writable } from 'stream';
import { Telegraf } from 'telegraf';
import { Config } from 'rclone.js';
import express from 'express';
import * as node_fetch from 'node-fetch';

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

    let chunks = [];
    for await (const chunk of inputStream) {
      chunks.push(chunk);
    }

    if (chunks.length > 2097152000) {
      // If the file is larger than 2GB, split it into chunks of 2GB
      const chunkSize = 2097152000;
      chunks = chunks.reduce((acc, chunk, i) => {
        if (i % chunkSize === 0) {
          acc.push(chunk);
        } else {
          acc[acc.length - 1] = Buffer.concat([acc[acc.length - 1], chunk]);
        }
        return acc;
      }, []);
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
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > 2097152000) {
      // If the file is larger than 2GB, merge the chunks into a single file
      const chunkSize = 2097152000;
      const chunks = [];
      let offset = 0;
      while (offset < buffer.byteLength) {
        chunks.push(buffer.slice(offset, offset + chunkSize));
        offset += chunkSize;
      }
      await Promise.all(chunks.map(async (chunk) => {
        await outStream.write(chunk);
      }));
    } else {
      await outStream.write(buffer);
    }
  }

  async Delete(inPath: string) {
    await this.bot.telegram.deleteMessage(this.config.chatId, Number(inPath));
  }

  // This is a function that starts listening for messages from Telegram.
  start() {
    this.bot.launch();
  }

  // This is a function that stops listening for messages from Telegram.
  async stop() {
    await this.bot.stop();
  }

  async upload(file: string, remote: string) {
    try {
      const client = new rclone.Client();
      await client.connect();
      await client.copy(file, remote, { chunkSize: 2097152000 });
    } catch (err) {
      console.log(err);
    }
  }
}

// This is a function that starts the server.
async function startServer() {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.post('/upload', async (req, res) => {
    const file = req.body.file;
    const remote = req.body.remote;

    try {
      const client = new rclone.Client();
      await client.connect();
      await client.copy(file, remote, { chunkSize: 2097152000 });
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  });

  app.listen(3000, () => {
    console.log('App listening on port 3000');
  });
}

startServer();
