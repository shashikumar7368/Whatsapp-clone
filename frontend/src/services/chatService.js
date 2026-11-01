import api from './api';

export const chatService = {
    getChats: async () => {
        const response = await api.get('/chats');
        return response.data.chats;
    },
    startChat: async (recipientUserId) => {
        const response = await api.post('/chats', { recipient_user_id: recipientUserId });
        return response.data.chat_id;
    },
    searchUsers: async (query) => {
        const response = await api.get(`/users?query=${encodeURIComponent(query)}`);
        return response.data.users;
    },
    getContacts: async () => {
        const response = await api.get('/contacts');
        return response.data.contacts;
    },
    addContact: async (contactUserId, nickname = '') => {
        const response = await api.post('/contacts', { contact_user_id: contactUserId, nickname });
        return response.data;
    }
};
