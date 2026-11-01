import React, { useState, useContext, useEffect, useRef } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { VoiceContext } from '../../context/VoiceContext';

// Strip trailing punctuation that speech recognition adds (. , ! ? etc.)
const cleanTranscript = (text) => text.replace(/[.,!?;:]+$/, '').trim();

const SearchBar = ({ onSearch }) => {
    const { isListening, startListening, stopListening, transcript } = useContext(VoiceContext);
    const [inputValue, setInputValue] = useState('');
    const prevTranscriptRef = useRef('');

    const handleMicClick = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (onSearch) onSearch(val);
    };

    const handleClear = () => {
        setInputValue('');
        if (onSearch) onSearch('');
    };

    // When transcript arrives, decide what to do with it
    useEffect(() => {
        if (!transcript || transcript === prevTranscriptRef.current) return;
        prevTranscriptRef.current = transcript;

        const lower = transcript.toLowerCase();

        // These are commands handled by VoiceContext.processIntent — don't touch search bar
        const isCommand =
            lower.startsWith('open chat with') ||
            lower.startsWith('send message to') ||
            lower.startsWith('search messages');

        if (!isCommand) {
            // Plain spoken word/name → treat as a search query
            // Clean off trailing punctuation before using
            const cleaned = cleanTranscript(transcript);
            setInputValue(cleaned);
            if (onSearch) onSearch(cleaned);
        }
    }, [transcript]);

    return (
        <div className="w-full bg-whatsapp-darkBg flex items-center gap-2">
            <div className="flex-1 bg-whatsapp-bg rounded-full flex items-center px-4 h-9">
                <Search size={18} className="text-whatsapp-textSecondary mr-3 shrink-0" />
                <input
                    type="text"
                    placeholder={isListening ? '🎙 Listening...' : 'Search or start a new chat'}
                    className={`bg-transparent border-none outline-none w-full text-[14px] placeholder:text-whatsapp-textSecondary
                        ${isListening
                            ? 'text-[#008069] placeholder:text-[#008069]'
                            : 'text-whatsapp-textPrimary'}`}
                    onChange={handleChange}
                    value={inputValue}
                    readOnly={isListening}
                />
                {inputValue && !isListening && (
                    <button onClick={handleClear} className="text-whatsapp-textSecondary hover:text-whatsapp-textPrimary ml-1 shrink-0">
                        <X size={15} />
                    </button>
                )}
            </div>
            <button
                onClick={handleMicClick}
                className={`p-2 rounded-full transition-all flex-shrink-0
                    ${isListening
                        ? 'bg-[#008069] text-white shadow-lg scale-110 animate-pulse'
                        : 'text-whatsapp-textSecondary hover:bg-whatsapp-bg'}`}
                title={isListening
                    ? 'Listening — say a name to search, or "Open chat with [Name]"'
                    : 'Search by voice — say a name or "Open chat with [Name]"'}
            >
                <Mic size={20} />
            </button>
        </div>
    );
};

export default SearchBar;
