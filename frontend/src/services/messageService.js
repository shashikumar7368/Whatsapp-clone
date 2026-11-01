import api from './api';

export const messageService = {
    getMessages: async (chatId, beforeCursor = null) => {
        let url = `/messages/${chatId}?limit=50`;
        if (beforeCursor) url += `&before=${encodeURIComponent(beforeCursor)}`;
        const response = await api.get(url);
        return response.data;
    },
    sendRestMessage: async (chatId, text, messageType = 'text', replyTo = null) => {
        const data = {
            chat_id: chatId,
            message_type: messageType,
            text: text,
            reply_to_message_id: replyTo
        };
        const response = await api.post('/messages', data);
        return response.data;
    }
};
