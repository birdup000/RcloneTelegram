import stream from 'stream';
import { Telegraf, Context, Update } from 'telegraf';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { Config } from 'rclone';

class TelegramBackend {
  private config: any;
  private botToken: string;
  private bot: Telegraf<Context<Update>>['bot'];

  constructor(config: Config) {
    this.config = config.get('telegram');
    if (!this.config) {
      throw new Error('Invalid telegram config');
    }

    this.botToken = this.config.bot_token;
    if (!this.botToken) {
      throw new Error('Invalid telegram bot_token');
    }

    this.bot = new Telegraf(this.botToken).bot;
  }

  async Put(inputStream: Readable, out: any, options: any) {
    if (!inputStream.readable) {
      throw new Error('Input stream is not readable');
    }

    const chatId = this.config.chat_id;
    const msgIds: number[] = [];
    let size = 0;
    let part = 0;
    let checksum = '';

    const chunkSize = 2 * 1024 * 1024 * 1024; // 2GB
    const chunks = [];

    // Read the input stream into chunks of 2GB
    while (true) {
      const buffer = inputStream.read(chunkSize);
      if (!buffer) break;
      chunks.push(buffer);
    }

    // Upload each chunk separately to Telegram
    for (const chunk of chunks) {
      size += chunk.length;
      part++;
      checksum += crypto.createHash('sha256').update(chunk).digest('hex');

      const msg = await this.bot.sendDocument(chatId, { document: chunk });
      msgIds.push(msg.message_id);
    }

    return { checksum, size, msgIds };
  }

  async Get(outStream: Writable, inPath: string, options: any) {
    if (!outStream.writable) {
      throw new Error('Output stream is not writable');
    }

    const chatId = this.config.chat_id;
    const msgIds = options?.msgIds;
    if (!msgIds || !Array.isArray(msgIds)) {
      throw new Error('Invalid options');
    }

    // Download each chunk separately from Telegram and write to the output stream
    for (const msgId of msgIds) {
      const msg = await this.bot.exportMessageLink(chatId, msgId);
      const url = `https://api.telegram.org/file/bot${this.botToken}/${msg.document.file_name}`;
      const response = await fetch(url);
      const buffer = await response.buffer();
      outStream.write(buffer);
    }

    // Merge the downloaded chunks into a single file
    return { size: outStream.bytesWritten };
  }

  async Delete(inPath: string, options: any) {
    const chatId = this.config.chat_id;
    const msgIds = options?.msgIds;
    if (!msgIds || !Array.isArray(msgIds)) {
      throw new Error('Invalid options');
    }

    for (const msgId of msgIds) {
      try {
        await this.bot.deleteMessage(chatId, msgId);
      } catch (e) {
        console.log('Message deletion failed', e);
      }
    }

    return { size: 0 };
  }
}

export { TelegramBackend };