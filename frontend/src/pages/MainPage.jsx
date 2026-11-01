import React, { useContext } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { SocketProvider } from '../context/SocketContext';
import { ChatProvider } from '../context/ChatContext';
import { VoiceProvider } from '../context/VoiceContext';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import LeftRail from '../components/sidebar/LeftRail';

const MainPage = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-whatsapp-darkBg text-whatsapp-lightTeal">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <SocketProvider>
            <ChatProvider>
                <VoiceProvider>
                    <div className="h-screen w-screen flex bg-whatsapp-bg overflow-hidden text-whatsapp-textPrimary">
                        <LeftRail />
                        <Sidebar />
                        <ChatWindow />
                    </div>
                </VoiceProvider>
            </ChatProvider>
        </SocketProvider>
    );
};

export default MainPage;
