import * as path from 'path'
import * as fs from 'fs'
import { Telegraf } from 'telegraf'
import * as RClone from 'rclone/lib/index.js'
 const telegram = new Telegraf('BOT_TOKEN')
const bot = telegram.bot
const DELETED_MESSAGE_ID = -1
 class TelegramBackend {
  constructor(config) {
    this.config = config
  }
   // Upload file by splitting into 2GB parts
  async Put(inputStream: fs.ReadStream, out: string, options: RClone.PutOptions) {
    const chatId = this.config.telegramChatId
    let msgIds: number[] = []
     let size = 0
    let part = 0
    let checksum = ''
    while (true) {
      const buffer = inputStream.read(2 * 1024 * 1024 * 1024) // 2GB chunk
      if (!buffer) break
      size += buffer.length
      part++
      checksum += crypto.createHash('sha256').update(buffer).digest('hex')
      const msg = await bot.sendDocument(chatId, { document: buffer })
      msgIds.push(msg.message_id)
    }
     return { checksum, size, msgIds }
  }
   // Download file by merging 2GB parts
  async Get(outStream: fs.WriteStream, in: string, options: RClone.GetOptions) {
    const chatId = this.config.telegramChatId
    const msgIds = (options as any).msgIds
     for (const msgId of msgIds) {
      const msg = await bot.exportMessageLink(chatId, msgId)
      const url = `https://api.telegram.org/file/bot${bot.token}/${msg.document.file_path}`
      const response = await fetch(url)
      const buffer = await response.buffer()
      outStream.write(buffer)
    }
     return { size: outStream.bytesWritten }
  }
   // Delete uploaded 2GB parts
  async Delete(in: string, options: RClone.DeleteOptions) {
    const chatId = this.config.telegramChatId
    const msgIds = (options as any).msgIds
     for (const msgId of msgIds) {
      try {
        await bot.deleteMessage(chatId, msgId)
      } catch (e) {
        console.log('Message deletion failed', e)
      }
    }
     return { size: 0 }
  }
}
 export { TelegramBackend }
