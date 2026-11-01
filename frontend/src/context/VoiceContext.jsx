import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { ChatContext } from './ChatContext';
import { SocketContext } from './SocketContext';

export const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState(null); // { message: '', type: 'info'|'success'|'error' }
    const [recognition, setRecognition] = useState(null);

    const { contacts, chats, selectChat } = useContext(ChatContext);
    const { sendMessage } = useContext(SocketContext);

    useEffect(() => {
        // Check speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = false; // stop automatically after a phrase
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                processIntent(text);
            };

            rec.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setFeedback({ message: `Error: ${event.error}`, type: 'error' });
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            setRecognition(rec);
        } else {
            console.warn('Speech Recognition API not supported in this browser.');
            setFeedback({ message: 'Voice Assistant not supported in this browser', type: 'error' });
        }
    }, [contacts, chats, selectChat]);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            setTranscript('');
            setFeedback({ message: 'Listening...', type: 'info' });
            recognition.start();
            setIsListening(true);
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
            setIsListening(false);
            setFeedback(null);
        }
    }, [recognition, isListening]);

    const playChime = () => {
        // Optional: Add a short beep using Web Audio API when executing a command
    };

    const processIntent = (text) => {
        // Strip trailing punctuation speech recognition adds (. ! ? , etc.)
        const cleaned = text.replace(/[.,!?;:]+$/, '').trim();
        const lowerText = cleaned.toLowerCase();

        // 1. OPEN CHAT: "Open chat with [Name]"
        if (lowerText.includes('open chat with')) {
            const name = lowerText.replace('open chat with', '').trim();
            const contact = contacts.find(c => c.name.toLowerCase().includes(name));
            if (contact) {
                const chat = chats.find(c => c.chat_type === 'private' && c.contact?.name.toLowerCase() === contact.name.toLowerCase());
                setFeedback({ message: `Opening chat with ${contact.name}...`, type: 'success' });
                if (chat) {
                    selectChat(chat);
                } else {
                    selectChat({
                        chat_id: 'temp-' + contact.contact_id,
                        chat_type: 'private',
                        contact: contact
                    });
                }
            } else {
                setFeedback({ message: `Contact '${name}' not found.`, type: 'error' });
            }
            return;
        }

        // 2. SEND MESSAGE: "Send message to [Name] [Message]"
        const sendMatch = lowerText.match(/send message to (\S+)\s+(.+)/);
        if (sendMatch) {
            const name = sendMatch[1].trim();
            const messageBody = sendMatch[2].trim();
            const contact = contacts.find(c => c.name.toLowerCase().includes(name));

            if (contact) {
                const chat = chats.find(c => c.chat_type === 'private' && c.contact?.name.toLowerCase() === contact.name.toLowerCase());

                if (chat) {
                    sendMessage(chat.chat_id, messageBody, Date.now().toString());
                    setFeedback({ message: `Message sent to ${contact.name}!`, type: 'success' });
                } else {
                    setFeedback({ message: `No active chat found for ${contact.name}.`, type: 'error' });
                }
            } else {
                setFeedback({ message: `Contact '${name}' not found.`, type: 'error' });
            }
            return;
        }

        // 3. Plain word/phrase — treated as a search query by SearchBar.
        //    Do NOT show an error here; just clear any previous feedback silently.
        setFeedback(null);
    };

    return (
        <VoiceContext.Provider value={{
            isListening,
            startListening,
            stopListening,
            transcript,
            feedback,
            clearFeedback: () => setFeedback(null)
        }}>
            {children}
        </VoiceContext.Provider>
    );
};
