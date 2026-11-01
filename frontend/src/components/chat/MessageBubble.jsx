import React, { useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ msg }) => {
    const { user } = useContext(AuthContext);
    const isMe = msg.sender_id === user.user_id;

    const time = msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : '';

    return (
        <div className={`flex w-full mb-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`relative max-w-[65%] rounded-lg px-2 py-1.5 shadow-sm text-[15px]
        ${isMe ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' : 'bg-white text-[#111b21] rounded-tl-none'}`}
            >
                {/* Tail graphic could go here, omitting for simplicity */}
                <div className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    <span className="leading-snug">{msg.text}</span>
                    <span className="inline-block mt-[2px] ml-3 text-[11px] text-whatsapp-textSecondary float-right flex items-center gap-1 leading-none h-[15px]">
                        {time}
                        {isMe && (
                            msg.status === 'read' ? <CheckCheck size={14} className="text-[#53bdeb]" /> :
                                msg.status === 'delivered' ? <CheckCheck size={14} /> :
                                    <Check size={14} /> // 'sent'
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
