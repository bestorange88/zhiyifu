import { chatStorage, type IChatStorage } from "./replit_integrations/chat/storage";

export interface IStorage extends IChatStorage {
  // Add other methods here if needed
}

export class DatabaseStorage implements IStorage {
    // Delegate to chatStorage
    getConversation = chatStorage.getConversation;
    getAllConversations = chatStorage.getAllConversations;
    createConversation = chatStorage.createConversation;
    deleteConversation = chatStorage.deleteConversation;
    getMessagesByConversation = chatStorage.getMessagesByConversation;
    createMessage = chatStorage.createMessage;
}

export const storage = new DatabaseStorage();
