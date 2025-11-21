import { ChatRequest, ChatResponse, ChatMessage } from '../types';
import { DEV_CONFIG } from '../config/dev';

interface ChatHistory {
  sessionId?: string;
  messages: ChatMessage[];
}

class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = DEV_CONFIG.API_BASE_URL;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    return response.json();
  }

  async getChatHistory(userId: string, siteId: string): Promise<ChatHistory> {
    const response = await fetch(`${this.baseUrl}/api/chat/history?userId=${userId}&siteId=${siteId}`);
    
    if (!response.ok) {
      // If no history found, return empty
      if (response.status === 404) {
        return { messages: [] };
      }
      throw new Error(`Chat history error: ${response.status}`);
    }

    const data = await response.json();
    
    // Convert timestamp strings back to Date objects
    const messages = data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));

    return {
      sessionId: data.sessionId,
      messages
    };
  }

  async clearChatHistory(userId: string, siteId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/chat/history`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, siteId }),
    });

    if (!response.ok) {
      throw new Error(`Clear chat error: ${response.status}`);
    }
  }
}

export const chatService = new ChatService();