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
  async Put(in: fs.ReadStream, out: string, options: RClone.PutOptions) {
    const chatId = this.config.telegramChatId
    let msgIds: number[] = []
    
    let size = 0
    let part = 0
    while (true) {
      const buffer = in.read(2 * 1024 * 1024 * 1024) // 2GB chunk
      if (buffer.length == 0) break
      size += buffer.length
      part++
      const msg = await bot.sendDocument(chatId, { document: buffer })
      msgIds.push(msg.message_id)
    }
    
    return {
      checksum: '', 
      size,
      msgIds // Return message IDs of parts for downloading
    }
  }
  
  // Download file by merging 2GB parts
  async Get(out: fs.WriteStream, in: string, options: RClone.GetOptions) {
    const chatId = this.config.telegramChatId
    const msgIds = (options as any).msgIds // Get message IDs of parts from Put response
    
    for (const msgId of msgIds) {
      const msg = await bot.exportMessageLink(chatId, msgId)
      const url = `https://api.telegram.org/file/bot${bot.token}/${msg.document.file_path}`
      const response = await fetch(url)
      const buffer = await response.buffer()
      out.write(buffer)
    }
    
    return { size: out.bytesWritten }
  }
  
  // Delete uploaded 2GB parts
  async Delete(in: string, options: RClone.DeleteOptions) {
    const chatId = this.config.telegramChatId
    const msgIds = (options as any).msgIds // Get message IDs of parts from Put response
    
    for (const msgId of msgIds) {
      try {
        await bot.deleteMessage(chatId, msgId)
      } catch (e) {
        console.log('Message deletion failed', e)
      }
    }
  }
}

export { TelegramBackend } 
