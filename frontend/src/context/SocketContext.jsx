import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { WebSocketClient } from '../services/websocketClient';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [socketConnected, setSocketConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [messageQueue, setMessageQueue] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [onlineUsers, setOnlineUsers] = useState({}); // { userId: true/false }
    const clientRef = useRef(null);
    const queueCounterRef = useRef(0);

    useEffect(() => {
        if (user && !clientRef.current) {
            const token = localStorage.getItem('access_token');

            const onMessage = (data) => {
                if (data.type === 'connect') setSocketConnected(true);
                if (data.type === 'receive_message' || data.type === 'message_sent_ack') {
                    // Attach a unique sequence number so React always sees a new value
                    const event = { ...data, _seq: ++queueCounterRef.current };
                    setLastMessage(event);
                    setMessageQueue(prev => [...prev.slice(-50), event]); // keep last 50
                }
                if (data.type === 'typing_indicator') {
                    setTypingUsers(prev => ({
                        ...prev,
                        [data.chat_id]: {
                            ...prev[data.chat_id],
                            [data.user_id]: data.is_typing
                        }
                    }));
                }
                if (data.type === 'status_update') {
                    // Update the live online/offline map
                    if (data.user_id) {
                        setOnlineUsers(prev => ({
                            ...prev,
                            [data.user_id]: data.is_online ?? false
                        }));
                    }
                }
            };

            clientRef.current = new WebSocketClient(user.user_id, token, onMessage);
            clientRef.current.connect();
        }

        return () => {
            if (clientRef.current && (!user)) {
                clientRef.current.disconnect();
                clientRef.current = null;
                setSocketConnected(false);
            }
        };
    }, [user]);

    const sendMessage = (chatId, text, tempId) => {
        if (clientRef.current) {
            clientRef.current.sendMessage(chatId, text, tempId);

            // Add optimistic message to the local queue so it displays instantly
            const optimisticMsg = {
                _seq: ++queueCounterRef.current,
                type: 'receive_message', // treat as receive so ChatWindow processes it immediately
                chat_id: chatId,
                client_temp_id: tempId,
                text: text,
                sender_id: user.user_id,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            setLastMessage(optimisticMsg);
            setMessageQueue(prev => [...prev.slice(-50), optimisticMsg]);
        }
    };

    const sendTyping = (chatId, isTyping) => {
        if (clientRef.current) clientRef.current.sendTypingStatus(chatId, isTyping);
    };

    const markRead = (chatId) => {
        if (clientRef.current) clientRef.current.markMessagesRead(chatId);
    };

    return (
        <SocketContext.Provider value={{
            socketConnected,
            lastMessage,
            messageQueue,
            sendMessage,
            sendTyping,
            typingUsers,
            onlineUsers,
            markRead
        }}>
            {children}
        </SocketContext.Provider>
    );
};
