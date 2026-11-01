import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = ({ messages }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto px-16 py-4 whatsapp-bg-pattern custom-scroll flex flex-col">
            {/* Messages */}
            {messages.map((msg, i) => {
                // Simple day separator logic
                let showDate = false;
                if (i === 0) showDate = true;
                else {
                    const prevD = new Date(messages[i - 1].timestamp).toDateString();
                    const currD = new Date(msg.timestamp).toDateString();
                    if (prevD !== currD) showDate = true;
                }

                return (
                    <React.Fragment key={msg.message_id || i}>
                        {showDate && (
                            <div className="flex justify-center my-3">
                                <span className="bg-white text-whatsapp-textSecondary text-[12.5px] px-3 py-1 rounded-md shadow-sm border border-black/5">
                                    {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                        <MessageBubble msg={msg} />
                    </React.Fragment>
                );
            })}
            <div ref={bottomRef} className="h-4" />
        </div>
    );
};

export default MessageList;
