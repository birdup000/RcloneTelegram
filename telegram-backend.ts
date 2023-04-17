import { Readable, Writable } from 'stream';
import { Telegraf } from 'telegraf';
import crypto from 'crypto';
import fetch from 'node-fetch';

const telegram = new Telegraf('BOT_TOKEN');
const bot = telegram.bot;

interface TelegramBackendConfig {
telegramChatId: number;
// Add any other required properties here
}

class TelegramBackend {
private config: TelegramBackendConfig;

constructor(config: TelegramBackendConfig) {
this.config = config;
}

async Put(inputStream: Readable, out: any, options: any) {
if (!inputStream.readable) {
throw new Error('Input stream is not readable');
}

const chatId = this.config.telegramChatId;
const msgIds: number[] = [];
let size = 0;
let part = 0;
let checksum = '';

while (true) {
  const buffer = inputStream.read(2 * 1024 * 1024 * 1024); // 2GB chunk
  if (!buffer) break;

  size += buffer.length;
  part++;
  checksum += crypto.createHash('sha256').update(buffer).digest('hex');

  const msg = await bot.sendDocument(chatId, { document: buffer });
  msgIds.push(msg.message_id);
}

return { checksum, size, msgIds };
}

async Get(outStream: Writable, inPath: string, options: any) {
if (!outStream.writable) {
throw new Error('Output stream is not writable');
}

const chatId = this.config.telegramChatId;
const msgIds = options?.msgIds;
if (!msgIds || !Array.isArray(msgIds)) {
  throw new Error('Invalid options');
}

for (const msgId of msgIds) {
  const msg = await bot.exportMessageLink(chatId, msgId);
  const url = `https://api.telegram.org/file/bot${bot.token}/${msg.document.file_name}`;
  const response = await fetch(url);
  const buffer = await response.buffer();
  outStream.write(buffer);
}

return { size: outStream.bytesWritten };
}

async Delete(inPath: string, options: any) {
const chatId = this.config.telegramChatId;
const msgIds = options?.msgIds;
if (!msgIds || !Array.isArray(msgIds)) {
throw new Error('Invalid options');
}

for (const msgId of msgIds) {
  try {
    await bot.deleteMessage(chatId, msgId);
  } catch (e) {
    console.log('Message deletion failed', e);
  }
}

return { size: 0 };
}
}

export { TelegramBackend, TelegramBackendConfig };