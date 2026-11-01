import React, { createContext, useState, useEffect, useContext } from 'react';
import { chatService } from '../services/chatService';
import { SocketContext } from './SocketContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [contacts, setContacts] = useState([]);
    const { lastMessage } = useContext(SocketContext);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const chatData = await chatService.getChats();
            setChats(chatData);
            const contactData = await chatService.getContacts();
            setContacts(contactData);
        } catch (err) {
            console.error('Failed to load chats/contacts:', err);
        }
    };

    // Listen to WebSocket events to update chat list snippet / unread markers
    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'receive_message') {
                setChats(prev => {
                    let updated = [...prev];
                    const chatIdx = updated.findIndex(c => c.chat_id === lastMessage.chat_id);
                    if (chatIdx > -1) {
                        updated[chatIdx].last_message = {
                            text: lastMessage.text,
                            timestamp: lastMessage.timestamp,
                            sender_is_me: false,
                        };
                        if (activeChat?.chat_id !== lastMessage.chat_id) {
                            updated[chatIdx].unread_count += 1;
                        }
                        // Move to top
                        const [chat] = updated.splice(chatIdx, 1);
                        updated.unshift(chat);
                    } else {
                        // New chat arrived; reload chats
                        loadInitialData();
                    }
                    return updated;
                });
            } else if (lastMessage.type === 'message_sent_ack') {
                // Update timestamp to true sent time
                loadInitialData();
            }
        }
    }, [lastMessage, activeChat]);

    const selectChat = (chat) => {
        setActiveChat(chat);
        // Optimistically reset unread counts
        setChats(prev => prev.map(c => c.chat_id === chat.chat_id ? { ...c, unread_count: 0 } : c));
    };

    // Start a new 1-to-1 chat with a contact and auto-select it
    const startChat = async (contactUserId) => {
        try {
            const chatId = await chatService.startChat(contactUserId);
            // Reload to get the full chat object
            const chatData = await chatService.getChats();
            setChats(chatData);
            // Select the newly created chat
            const newChat = chatData.find(c => c.chat_id === chatId);
            if (newChat) setActiveChat(newChat);
            return chatId;
        } catch (err) {
            console.error('Failed to start chat:', err);
            throw err;
        }
    };

    return (
        <ChatContext.Provider value={{
            chats,
            activeChat,
            selectChat,
            startChat,
            contacts,
            refreshChats: loadInitialData
        }}>
            {children}
        </ChatContext.Provider>
    );
};
