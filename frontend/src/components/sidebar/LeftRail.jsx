import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, Phone, Disc, Users, Settings, CircleDashed } from 'lucide-react';
import Avatar from '../common/Avatar';

const LeftRail = () => {
    const { user } = useContext(AuthContext);

    return (
        <div className="w-[64px] min-w-[64px] h-full flex flex-col items-center py-4 bg-whatsapp-leftRail border-r border-whatsapp-border z-20 shrink-0">

            {/* Top Icons */}
            <div className="flex flex-col gap-6 items-center flex-1 w-full">
                {/* Chat / Messages */}
                <div className="p-2 cursor-pointer text-whatsapp-textPrimary bg-whatsapp-border/50 rounded-lg relative">
                    <MessageSquare size={24} fill="currentColor" strokeWidth={1} />
                    <div className="absolute top-1 right-1 bg-whatsapp-lightTeal text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                        22
                    </div>
                </div>

                {/* Calls */}
                <div className="p-2 cursor-pointer text-whatsapp-textSecondary hover:text-whatsapp-textPrimary hover:bg-black/5 rounded-lg transition-colors">
                    <Phone size={24} />
                </div>

                {/* Status */}
                <div className="p-2 cursor-pointer text-whatsapp-textSecondary hover:text-whatsapp-textPrimary hover:bg-black/5 rounded-lg transition-colors relative">
                    <CircleDashed size={24} />
                    <div className="absolute top-1 right-1 bg-whatsapp-lightTeal w-2 h-2 rounded-full border border-white"></div>
                </div>

                {/* Channels */}
                <div className="p-2 cursor-pointer text-whatsapp-textSecondary hover:text-whatsapp-textPrimary hover:bg-black/5 rounded-lg transition-colors relative">
                    <Disc size={24} />
                    <div className="absolute top-1 right-1 bg-whatsapp-lightTeal w-2 h-2 rounded-full border border-white"></div>
                </div>

                {/* Community */}
                <div className="p-2 cursor-pointer text-whatsapp-textSecondary hover:text-whatsapp-textPrimary hover:bg-black/5 rounded-lg transition-colors">
                    <Users size={24} />
                </div>
            </div>

            {/* Bottom Icons */}
            <div className="flex flex-col gap-4 items-center w-full">
                {/* Meta AI placeholder */}
                <div className="p-2 cursor-pointer text-[#0064e0] hover:bg-black/5 rounded-lg transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500">
                        <circle cx="12" cy="12" r="8" />
                    </svg>
                </div>

                {/* Settings */}
                <div className="p-2 cursor-pointer text-whatsapp-textSecondary hover:text-whatsapp-textPrimary hover:bg-black/5 rounded-lg transition-colors">
                    <Settings size={24} />
                </div>

                {/* Profile */}
                <div className="mt-2 mb-2 cursor-pointer ring-2 ring-transparent hover:ring-whatsapp-border rounded-full p-0.5 transition-all">
                    <Avatar src={user?.profile_picture} name={user?.name} size={32} />
                </div>
            </div>

        </div>
    );
};

export default LeftRail;
