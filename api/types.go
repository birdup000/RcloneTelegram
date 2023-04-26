export namespace Api {
  export type InputPeer = {
    _: 'inputPeer'
    user_id: number
    access_hash: string
  }

  export type InputUser = {
    _: 'inputUser'
    user_id: number
    access_hash: string
  }

  export type InputChannel = {
    _: 'inputChannel'
    channel_id: number
    access_hash: string
  }

  export type InputMessageID = {
    _: 'inputMessageID'
    id: number
  }

  export type MessagesGetMessages = {
    _: 'messages.getMessages'
    id: InputMessageID[]
  }

  export type MessagesGetMessagesResponse = {
    messages: Message[]
  }

  export type Message = {
    _: 'message'
    id: number
    media: Media
  }

  export type Media = {
    _: 'messageMediaDocument'
    document: Document
  }

  export type Document = {
    _: 'document'
    id: string
    access_hash: string
    size: number
    mime_type: string
    file_reference: Uint8Array
  }
}
