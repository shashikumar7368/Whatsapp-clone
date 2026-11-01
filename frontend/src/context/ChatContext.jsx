
import React, { createContext, useState, useEffect, useContext } from 'react';
import { chatService } from '../services/chatService';
import { SocketContext } from './SocketContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [contacts, setContacts] = useState([]);

    const { lastMessage } = useContext(SocketContext);

    // Load chats and contacts
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

    // Listen to WebSocket events
    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'receive_message') {
                setChats(prev => {
                    const updated = [...prev];

                    const chatIdx = updated.findIndex(
                        c => c.chat_id === lastMessage.chat_id
                    );

                    if (chatIdx > -1) {
                        updated[chatIdx] = {
                            ...updated[chatIdx],
                            last_message: {
                                text: lastMessage.text,
                                timestamp: lastMessage.timestamp,
                                sender_is_me: false,
                            },
                            unread_count:
                                activeChat?.chat_id !== lastMessage.chat_id
                                    ? (updated[chatIdx].unread_count || 0) + 1
                                    : 0,
                        };

                        // Move updated chat to the top
                        const [chat] = updated.splice(chatIdx, 1);
                        updated.unshift(chat);
                    } else {
                        // Reload if a new chat arrives
                        loadInitialData();
                    }

                    return updated;
                });
            } else if (lastMessage.type === 'message_sent_ack') {
                loadInitialData();
            }
        }
    }, [lastMessage, activeChat]);

    // Select a chat or clear selection for mobile back navigation
    const selectChat = (chat) => {
        setActiveChat(chat);

        // If chat is null, return to the chat list
        if (!chat) {
            return;
        }

        // Reset unread count when opening a conversation
        setChats(prev =>
            prev.map(c =>
                c.chat_id === chat.chat_id
                    ? { ...c, unread_count: 0 }
                    : c
            )
        );
    };

    // Start a new chat
    const startChat = async (contactUserId) => {
        try {
            const chatId = await chatService.startChat(contactUserId);

            // Reload chats to get the complete chat object
            const chatData = await chatService.getChats();
            setChats(chatData);

            // Automatically open the new conversation
            const newChat = chatData.find(
                c => c.chat_id === chatId
            );

            if (newChat) {
                selectChat(newChat);
            }

            return chatId;
        } catch (err) {
            console.error('Failed to start chat:', err);
            throw err;
        }
    };

    return (
        <ChatContext.Provider
            value={{
                chats,
                activeChat,
                selectChat,
                startChat,
                contacts,
                refreshChats: loadInitialData,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;
