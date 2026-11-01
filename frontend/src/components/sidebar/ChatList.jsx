import React, { useContext } from 'react';
import Avatar from '../common/Avatar';
import { ChatContext } from '../../context/ChatContext';
import { SocketContext } from '../../context/SocketContext';
import { format } from 'date-fns';
import { CheckCheck } from 'lucide-react';

const ChatList = ({ searchQuery = '' }) => {
    const { chats, activeChat, selectChat } = useContext(ChatContext);
    const { onlineUsers } = useContext(SocketContext);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            const today = new Date();
            if (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
            ) {
                return format(date, 'HH:mm');
            }
            return format(date, 'dd/MM/yy');
        } catch {
            return '';
        }
    };

    // Filter chats based on searchQuery
    const filteredChats = chats.filter(chat => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = chat.chat_type === 'group'
            ? chat.group_name?.toLowerCase()
            : chat.contact?.name?.toLowerCase();
        const lastMsg = chat.last_message?.text?.toLowerCase() || '';
        return name?.includes(q) || lastMsg.includes(q);
    });

    if (filteredChats.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-whatsapp-textSecondary text-sm px-6 text-center">
                {searchQuery
                    ? `No chats match "${searchQuery}"`
                    : (
                        <span>
                            No chats yet.{' '}
                            <span className="text-[#008069]">Click the <b>+</b> button above</span> to start a conversation with a contact.
                        </span>
                    )
                }
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-whatsapp-darkBg h-full">
            {filteredChats.map((chat) => {
                const isActive = activeChat?.chat_id === chat.chat_id;
                const name = chat.chat_type === 'group' ? chat.group_name : chat.contact?.name;
                const avatarSrc = chat.contact?.profile_picture;
                const contactUserId = chat.contact?.user_id;
                const lastMsg = chat.last_message?.text || '';
                const time = formatTime(chat.last_message?.timestamp);
                const unread = chat.unread_count > 0;
                const isSelfSent = chat.last_message?.sender_is_me;
                // Online status: real-time map first, fall back to initial data
                const isOnline = contactUserId
                    ? (onlineUsers[contactUserId] ?? chat.contact?.is_online ?? false)
                    : false;

                return (
                    <div
                        key={chat.chat_id}
                        onClick={() => selectChat(chat)}
                        className={`flex items-center px-3 py-2.5 cursor-pointer hover:bg-whatsapp-bg transition-colors mx-2 rounded-xl mb-0.5
                            ${isActive ? 'bg-whatsapp-bg' : ''}`}
                    >
                        <div className="pr-3">
                            <Avatar
                                src={avatarSrc}
                                name={name}
                                isGroup={chat.chat_type === 'group'}
                                size={48}
                                isOnline={isOnline}
                            />
                        </div>

                        <div className="flex-1 border-b border-whatsapp-border pb-3 pt-1 h-full flex flex-col justify-center overflow-hidden">
                            <div className="flex justify-between items-center w-full">
                                <span className="text-whatsapp-textPrimary text-[16px] truncate font-medium">{name}</span>
                                <span className={`text-[12px] flex-shrink-0 ml-1 ${unread ? 'text-[#008069] font-semibold' : 'text-whatsapp-textSecondary'}`}>
                                    {time}
                                </span>
                            </div>

                            <div className="flex justify-between items-center w-full mt-0.5">
                                <div className="flex items-center text-[14px] text-whatsapp-textSecondary truncate">
                                    {isSelfSent && (
                                        <CheckCheck
                                            size={16}
                                            className={`${chat.last_message?.status === 'read' ? 'text-[#53bdeb]' : 'text-whatsapp-textSecondary'} mr-1 shrink-0`}
                                        />
                                    )}
                                    <span className="truncate">{lastMsg || <span className="italic opacity-60">No messages yet</span>}</span>
                                </div>
                                {unread && (
                                    <div className="bg-[#25D366] text-white text-[11px] font-bold rounded-full h-[20px] min-w-[20px] px-1.5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {chat.unread_count}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatList;
