import { useContext } from 'react';
import { VoiceContext } from '../context/VoiceContext';

export const useVoiceAssistant = () => {
    const context = useContext(VoiceContext);
    if (!context) {
        throw new Error('useVoiceAssistant must be used within a VoiceProvider');
    }
    return context;
};
