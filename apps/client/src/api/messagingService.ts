import apiClient from './apiClient';

export interface ChatContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// NOU — participantul dintr-un sumar de conversație include și lastReadAt,
// folosit ca să calculăm indicatorul "Văzut"
export interface ConversationParticipantInfo extends ChatContact {
  lastReadAt?: string | null;
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name?: string | null;
  participants: ConversationParticipantInfo[];
  lastMessage: { id: string; content: string; createdAt: string; senderId: string } | null;
  lastActivityAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string };
}

export const messagingService = {
  listContacts: () => apiClient.get<ChatContact[]>('/messaging/contacts').then((r) => r.data),
  createConversation: (data: { participantIds: string[]; name?: string }) =>
    apiClient.post('/messaging/conversations', data).then((r) => r.data),
  listConversations: () => apiClient.get<ConversationSummary[]>('/messaging/conversations').then((r) => r.data),
  getMessages: (conversationId: string, after?: string) =>
    apiClient
      .get<ChatMessage[]>(`/messaging/conversations/${conversationId}/messages`, { params: after ? { after } : {} })
      .then((r) => r.data),
  sendMessage: (conversationId: string, content: string) =>
    apiClient.post<ChatMessage>(`/messaging/conversations/${conversationId}/messages`, { content }).then((r) => r.data),
  markAsRead: (conversationId: string) => apiClient.post(`/messaging/conversations/${conversationId}/read`),
};