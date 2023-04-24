import { Readable, Writable } from 'stream';
import { Telegraf } from 'telegraf';
import { Config } from 'rclone';

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

    const chatId = this.config.chatId;
    const chunkSize = 2 * 1024 * 1024; // 2MB
    const chunks = [];

    // Read the input stream into chunks of 2MB
    for await (const chunk of inputStream) {
      chunks.push(chunk);
    }

    // Upload each chunk separately to Telegram
    for (const chunk of chunks) {
      await this.bot.telegram.sendDocument(chatId, { source: chunk });
    }
  }

  async Get(outStream: Writable, inPath: string) {
    if (!outStream.writable) {
      throw new Error('Output stream is not writable');
    }

    const msg = await this.bot.telegram.getFile(this.config.chatId, inPath);
    const url = `https://api.telegram.org/file/bot${this.config.botToken}/${msg.file_path}`;
    const response = await fetch(url);
    const buffer = await response.buffer();
    await outStream.write(buffer);
  }

  async Delete(inPath: string) {
    await this.bot.telegram.deleteMessage(this.config.chatId, inPath);
  }
}

export { TelegramBackend };

// This is a function that starts the server.
async function startServer() {
  const port = 3000;
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

// This is the main function.
async function main() {
  // Start the server.
  await startServer();

  // Create a TelegramBackend instance.
  const telegramBackend = new TelegramBackend({
    botToken: 'YOUR_BOT_TOKEN',
    chatId: 'YOUR_CHAT_ID',
  });

  // Start listening for messages from Telegram.
  telegramBackend.start();

  // Wait for the user to press `Ctrl`+`C` to exit.
  process.on('SIGINT', () => {
    telegramBackend.stop();
    process.exit();
  });
}

// Run the main function.
main();
