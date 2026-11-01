import React, { useState, useContext, useRef, useCallback } from 'react';
import { Smile, Paperclip, Mic, Send } from 'lucide-react';
import { SocketContext } from '../../context/SocketContext';

const MessageInput = ({ chatId }) => {
    const [text, setText] = useState('');
    const { sendMessage, sendTyping } = useContext(SocketContext);

    // ── Own local speech recognition — completely separate from the SearchBar mic ──
    const [dictating, setDictating] = useState(false);
    const recognitionRef = useRef(null);

    const startDictation = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = false;

        rec.onstart = () => setDictating(true);

        rec.onresult = (event) => {
            const spoken = event.results[0][0].transcript.replace(/[.,!?;:]+$/, '').trim();
            setText(prev => prev + (prev ? ' ' : '') + spoken);
        };

        rec.onerror = () => setDictating(false);
        rec.onend = () => setDictating(false);

        recognitionRef.current = rec;
        rec.start();
    }, []);

    const stopDictation = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setDictating(false);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────────

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!text.trim()) return;
        const tempId = Date.now().toString();
        sendMessage(chatId, text.trim(), tempId);
        setText('');
        sendTyping(chatId, false);
    };

    const handleType = (e) => {
        setText(e.target.value);
        sendTyping(chatId, e.target.value.length > 0);
    };

    const handleMicClick = () => {
        if (dictating) stopDictation();
        else startDictation();
    };

    return (
        <div className="h-[62px] px-4 bg-whatsapp-bg flex items-center gap-3 w-full shrink-0">
            <Smile size={24} className="text-whatsapp-textSecondary cursor-pointer hover:text-whatsapp-textPrimary shrink-0" />
            <Paperclip size={24} className="text-whatsapp-textSecondary cursor-pointer hover:text-whatsapp-textPrimary shrink-0" />

            <form onSubmit={handleSend} className="flex-1 bg-white rounded-lg flex items-center px-4 h-11 shadow-sm border border-black/5">
                <input
                    type="text"
                    value={text}
                    onChange={handleType}
                    placeholder={dictating ? '🎙 Dictating...' : 'Type a message'}
                    className={`bg-transparent border-none outline-none w-full text-[15px]
                        ${dictating ? 'text-[#008069]' : 'text-[#111b21]'}`}
                />
            </form>

            <button
                onClick={text.trim() ? handleSend : handleMicClick}
                className="p-1.5 flex justify-center items-center text-whatsapp-textSecondary hover:text-whatsapp-textPrimary shrink-0 transition-all rounded-full"
                title={text.trim() ? 'Send' : dictating ? 'Stop dictation' : 'Dictate a message'}
            >
                {text.trim()
                    ? <Send size={24} />
                    : <Mic size={24} className={dictating ? 'text-[#008069] animate-pulse' : ''} />
                }
            </button>
        </div>
    );
};

export default MessageInput;
