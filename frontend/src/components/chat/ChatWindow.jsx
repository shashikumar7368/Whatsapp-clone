
import React, { useContext, useEffect, useState, useRef } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { SocketContext } from '../../context/SocketContext';
import { messageService } from '../../services/messageService';
import Avatar from '../common/Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import {
    Search,
    MoreVertical,
    Phone,
    Video,
    ArrowLeft
} from 'lucide-react';

const ChatWindow = () => {
    const { activeChat, refreshChats, selectChat } = useContext(ChatContext);

    const {
        messageQueue,
        typingUsers,
        onlineUsers,
        markRead
    } = useContext(SocketContext);

    const [messages, setMessages] = useState([]);
    const processedSeqsRef = useRef(new Set());

    // Load messages when a chat is selected
    useEffect(() => {
        if (activeChat) {
            processedSeqsRef.current = new Set();
            loadMessages();
            markRead(activeChat.chat_id);
            refreshChats();
        }
    }, [activeChat]);

    // Process incoming WebSocket messages
    useEffect(() => {
        if (!activeChat || !messageQueue.length) return;

        let didAppend = false;
        const newMessages = [];

        for (const event of messageQueue) {
            if (processedSeqsRef.current.has(event._seq)) continue;

            if (
                event.chat_id &&
                event.chat_id !== activeChat.chat_id
            ) continue;

            if (
                event.type !== 'receive_message' &&
                event.type !== 'message_sent_ack'
            ) continue;

            processedSeqsRef.current.add(event._seq);
            newMessages.push(event);
            didAppend = true;

            if (event.type === 'receive_message') {
                markRead(activeChat.chat_id);
            }
        }

        if (didAppend) {
            setMessages(prev => {
                let updated = [...prev];

                for (const msg of newMessages) {
                    const existingIndex = updated.findIndex(m =>
                        (m.message_id && m.message_id === msg.message_id) ||
                        (
                            m.client_temp_id &&
                            msg.client_temp_id &&
                            m.client_temp_id === msg.client_temp_id
                        )
                    );

                    if (existingIndex >= 0) {
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            ...msg
                        };
                    } else {
                        updated.push(msg);
                    }
                }

                return updated;
            });
        }
    }, [messageQueue, activeChat]);

    // Load messages from backend
    const loadMessages = async () => {
        try {
            const data = await messageService.getMessages(activeChat.chat_id);
            setMessages(data.messages);
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    };

    // Empty state when no chat is selected
    if (!activeChat) {
        return (
            <div className="hidden md:flex flex-1 min-w-0 bg-whatsapp-bg items-center justify-center flex-col shadow-inner relative overflow-hidden">
                <div className="flex gap-8 items-center max-w-2xl mx-auto">

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-[100px] h-[100px] bg-white rounded-3xl flex items-center justify-center shadow-sm border border-black/5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <span className="text-sm text-whatsapp-textSecondary">
                            Send document
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-[100px] h-[100px] bg-white rounded-3xl flex items-center justify-center shadow-sm border border-black/5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <line x1="20" y1="8" x2="20" y2="14" />
                                <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                        </div>
                        <span className="text-sm text-whatsapp-textSecondary">
                            Add contact
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <div className="w-[100px] h-[100px] bg-white rounded-3xl flex items-center justify-center shadow-sm border border-black/5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#0064e0]">
                                <circle cx="12" cy="12" r="8" />
                            </svg>
                        </div>
                        <span className="text-sm text-whatsapp-textSecondary">
                            Ask Meta AI
                        </span>
                    </div>

                </div>
            </div>
        );
    }

    const name = activeChat.chat_type === 'group'
        ? activeChat.group_name
        : activeChat.contact?.name;

    const avatarSrc = activeChat.contact?.profile_picture;
    const contactUserId = activeChat.contact?.user_id;

    const isOnline = contactUserId
        ? (
            onlineUsers[contactUserId] ??
            activeChat.contact?.is_online ??
            false
        )
        : false;

    const typingStatusMap = typingUsers[activeChat.chat_id] || {};

    const isSomeoneTyping = Object.values(typingStatusMap).some(
        status => status === true
    );

    return (
        <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full bg-whatsapp-chatBg relative">

            {/* Chat Header */}
            <div className="h-[60px] min-h-[60px] bg-whatsapp-panel px-2 sm:px-4 flex items-center justify-between border-b border-whatsapp-border shrink-0 z-10 shadow-sm">

                {/* Back Button and Contact Details */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">

                    {/* Back button - visible on desktop and mobile */}
                    <button
                        type="button"
                        onClick={() => selectChat(null)}
                        className="p-2 rounded-full hover:bg-whatsapp-bg text-whatsapp-textSecondary hover:text-[#008069] shrink-0 transition-colors"
                        aria-label="Back to chats"
                        title="Back to chats"
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <Avatar
                        src={avatarSrc}
                        name={name}
                        isGroup={activeChat.chat_type === 'group'}
                        size={40}
                        isOnline={isOnline}
                    />

                    <div className="flex flex-col min-w-0">
                        <span className="text-whatsapp-textPrimary font-medium text-[15px] sm:text-[16px] truncate">
                            {name}
                        </span>

                        {isSomeoneTyping ? (
                            <span className="text-[#008069] text-[12px] sm:text-[13px] font-medium">
                                typing...
                            </span>
                        ) : isOnline ? (
                            <span className="text-[#008069] text-[12px] sm:text-[13px] font-medium">
                                online
                            </span>
                        ) : (
                            <span className="text-whatsapp-textSecondary text-[12px] sm:text-[13px] truncate">
                                Click here for contact info
                            </span>
                        )}
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 sm:gap-5 text-whatsapp-textSecondary shrink-0">

                    <div className="px-2 sm:px-3 py-1.5 rounded-full border border-whatsapp-border flex gap-2 sm:gap-4 cursor-pointer hover:bg-whatsapp-searchBg">
                        <Video size={18} />
                        <span className="w-px h-5 bg-whatsapp-border"></span>
                        <Phone size={18} />
                    </div>

                    <Search
                        size={20}
                        className="cursor-pointer hover:text-whatsapp-textPrimary"
                    />

                    <MoreVertical
                        size={20}
                        className="cursor-pointer hover:text-whatsapp-textPrimary"
                    />
                </div>
            </div>

            {/* Message List */}
            <MessageList messages={messages} />

            {/* Message Input */}
            <MessageInput chatId={activeChat.chat_id} />

        </div>
    );
};

export default ChatWindow;
