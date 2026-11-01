import React from 'react';
import { User, Users } from 'lucide-react';

/**
 * Avatar component with optional online indicator dot.
 * Props:
 *   src        - image URL
 *   name       - fallback name for icon fallback
 *   size       - pixel size (default 40)
 *   isGroup    - show group icon instead of user icon
 *   isOnline   - show green dot if true
 */
const Avatar = ({ src, name, size = 40, isGroup = false, isOnline = false }) => {
    const dotSize = Math.max(10, Math.round(size * 0.28));

    return (
        <div className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
            {/* Avatar circle */}
            <div
                className="rounded-full overflow-hidden bg-whatsapp-border flex items-center justify-center text-whatsapp-textSecondary w-full h-full"
            >
                {src ? (
                    <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                    isGroup ? <Users size={size * 0.55} /> : <User size={size * 0.55} />
                )}
            </div>

            {/* Online dot */}
            {isOnline && !isGroup && (
                <span
                    className="absolute bottom-0 right-0 rounded-full bg-[#25D366] border-2 border-white"
                    style={{ width: dotSize, height: dotSize }}
                />
            )}
        </div>
    );
};

export default Avatar;
