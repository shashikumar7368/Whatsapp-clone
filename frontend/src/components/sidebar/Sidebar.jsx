
import React, { useState, useContext, useEffect, useRef } from 'react';
import SearchBar from './SearchBar';
import ChatList from './ChatList';
import { AuthContext } from '../../context/AuthContext';
import { VoiceContext } from '../../context/VoiceContext';
import { ChatContext } from '../../context/ChatContext';
import { chatService } from '../../services/chatService';
import Avatar from '../common/Avatar';
import {
    PlusSquare,
    MoreVertical,
    AlertCircle,
    CheckCircle,
    X,
    ArrowLeft,
    UserPlus,
    Check
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useContext(AuthContext);
    const { feedback, clearFeedback } = useContext(VoiceContext);

    const {
        contacts,
        startChat,
        refreshChats,
        activeChat
    } = useContext(ChatContext);

    // Sidebar panel state
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);

    // New Chat panel state
    const [panelQuery, setPanelQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [addingContact, setAddingContact] = useState(null);
    const [addedContacts, setAddedContacts] = useState(new Set());
    const [startingChat, setStartingChat] = useState(null);

    const debounceRef = useRef(null);

    // Reset panel when closed
    useEffect(() => {
        if (!showNewChat) {
            setPanelQuery('');
            setUserResults([]);
        }
    }, [showNewChat]);

    // Debounced user search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (panelQuery.trim().length < 1) {
            setUserResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true);

            try {
                const results = await chatService.searchUsers(panelQuery.trim());
                setUserResults(results || []);
            } catch {
                setUserResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [panelQuery]);

    // Track existing contacts
    const existingContactUserIds = new Set(
        contacts.map(c => c.user_id)
    );

    // Add contact
    const handleAddContact = async (user) => {
        setAddingContact(user.user_id);

        try {
            await chatService.addContact(user.user_id);

            setAddedContacts(prev =>
                new Set([...prev, user.user_id])
            );

            await refreshChats();
        } catch (err) {
            console.error('Failed to add contact', err);
        } finally {
            setAddingContact(null);
        }
    };

    // Start chat
    const handleStartChat = async (user) => {
        setStartingChat(user.user_id);

        try {
            await startChat(user.user_id);
            setShowNewChat(false);
        } catch (err) {
            console.error('Failed to start chat', err);
        } finally {
            setStartingChat(null);
        }
    };

    // Filter contacts
    const filteredContacts = contacts.filter(c =>
        !panelQuery ||
        c.name?.toLowerCase().includes(panelQuery.toLowerCase()) ||
        c.phone?.includes(panelQuery)
    );

    // Filter users not already in contacts
    const newUserResults = userResults.filter(
        u =>
            !existingContactUserIds.has(u.user_id) &&
            !addedContacts.has(u.user_id)
    );

    return (
        <div
            className={`
                ${activeChat && !showNewChat
                    ? 'hidden md:flex'
                    : 'flex'
                }
                w-full md:w-[340px]
                md:min-w-[340px]
                md:max-w-[420px]
                min-w-0
                h-full
                flex-col
                border-r
                border-whatsapp-border
                bg-whatsapp-darkBg
                z-10
                shrink-0
            `}
        >

            {/* HEADER */}
            {!showNewChat ? (
                <div className="pt-5 pb-2 px-5 flex items-center justify-between flex-shrink-0">

                    <h1 className="text-[22px] font-bold text-whatsapp-textPrimary tracking-tight">
                        Whatsapp
                    </h1>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => setShowNewChat(true)}
                            className="p-1.5 rounded-full hover:bg-whatsapp-bg transition-colors"
                            title="New chat"
                        >
                            <PlusSquare
                                size={20}
                                className="text-whatsapp-textPrimary"
                            />
                        </button>

                        <button
                            onClick={logout}
                            title="Logout"
                            className="p-1.5 rounded-full hover:bg-whatsapp-bg transition-colors"
                        >
                            <MoreVertical
                                size={20}
                                className="text-whatsapp-textPrimary"
                            />
                        </button>

                    </div>
                </div>
            ) : (
                <div className="pt-5 pb-2 px-4 flex items-center gap-3 flex-shrink-0">

                    <button
                        onClick={() => setShowNewChat(false)}
                        className="text-whatsapp-textSecondary hover:text-whatsapp-textPrimary p-1 rounded-full hover:bg-whatsapp-bg transition-colors"
                    >
                        <ArrowLeft size={22} />
                    </button>

                    <h1 className="text-[20px] font-bold text-whatsapp-textPrimary">
                        New Chat
                    </h1>

                </div>
            )}

            {/* SEARCH BAR */}
            <div className="px-3 pb-2">

                {!showNewChat ? (
                    <SearchBar onSearch={setSearchQuery} />
                ) : (
                    <div className="bg-whatsapp-bg rounded-full flex items-center px-4 h-9">

                        <span className="text-whatsapp-textSecondary mr-3">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </span>

                        <input
                            type="text"
                            placeholder="Search name, email or phone"
                            className="bg-transparent border-none outline-none text-whatsapp-textPrimary w-full text-[14px] placeholder:text-whatsapp-textSecondary"
                            value={panelQuery}
                            onChange={e => setPanelQuery(e.target.value)}
                            autoFocus
                        />

                        {panelQuery && (
                            <button
                                onClick={() => setPanelQuery('')}
                                className="text-whatsapp-textSecondary hover:text-whatsapp-textPrimary"
                            >
                                <X size={15} />
                            </button>
                        )}

                    </div>
                )}
            </div>

            {/* VOICE FEEDBACK */}
            {feedback && (
                <div
                    className={`mx-3 mb-2 px-3 py-1.5 rounded-lg text-sm flex justify-between items-center shadow-sm
                    ${feedback.type === 'error'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : feedback.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                >

                    <div className="flex items-center gap-2">

                        {feedback.type === 'error' && (
                            <AlertCircle size={16} />
                        )}

                        {feedback.type === 'success' && (
                            <CheckCircle size={16} />
                        )}

                        <span className="truncate">
                            {feedback.message}
                        </span>

                    </div>

                    <button
                        onClick={clearFeedback}
                        className="ml-2 hover:opacity-70 text-lg leading-none"
                    >
                        &times;
                    </button>

                </div>
            )}

            {/* CHAT LIST */}
            {!showNewChat && (
                <>

                    <div className="px-4 py-1 flex gap-2 mb-1 overflow-x-auto">

                        <span className="bg-[#dcf8c6] text-[#008069] px-3 py-1 rounded-full text-sm font-medium cursor-pointer whitespace-nowrap">
                            All
                        </span>

                        <span className="bg-whatsapp-bg text-whatsapp-textSecondary hover:bg-gray-200 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors whitespace-nowrap">
                            Unread
                        </span>

                        <span className="bg-whatsapp-bg text-whatsapp-textSecondary hover:bg-gray-200 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors whitespace-nowrap">
                            Favorites
                        </span>

                    </div>

                    <ChatList searchQuery={searchQuery} />

                </>
            )}

            {/* NEW CHAT PANEL */}
            {showNewChat && (
                <div className="flex-1 min-h-0 overflow-y-auto">

                    {/* EXISTING CONTACTS */}
                    {filteredContacts.length > 0 && (
                        <>

                            <p className="text-[12px] text-[#008069] font-semibold px-5 pt-3 pb-1 uppercase tracking-wider">
                                Your Contacts ({filteredContacts.length})
                            </p>

                            {filteredContacts.map(contact => (
                                <button
                                    key={contact.user_id}
                                    onClick={() => handleStartChat(contact)}
                                    disabled={startingChat === contact.user_id}
                                    className="w-full flex items-center px-3 py-2.5 hover:bg-whatsapp-bg transition-colors text-left"
                                >

                                    <div className="pr-3 shrink-0">
                                        <Avatar
                                            src={contact.profile_picture}
                                            name={contact.name}
                                            size={48}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0 border-b border-whatsapp-border pb-2 pt-1 overflow-hidden">

                                        <div className="text-whatsapp-textPrimary text-[16px] truncate font-medium">
                                            {contact.name}
                                        </div>

                                        <div className="text-whatsapp-textSecondary text-[13px] truncate">
                                            {contact.is_online
                                                ? <span className="text-[#008069]">online</span>
                                                : contact.phone
                                            }
                                        </div>

                                    </div>

                                    {startingChat === contact.user_id && (
                                        <span className="text-[12px] text-whatsapp-textSecondary ml-2 animate-pulse">
                                            Opening…
                                        </span>
                                    )}

                                </button>
                            ))}

                        </>
                    )}

                    {/* SEARCH RESULTS */}
                    {panelQuery.length > 0 && (
                        <>

                            {searching && (
                                <p className="text-[13px] text-whatsapp-textSecondary px-5 py-3 animate-pulse">
                                    Searching…
                                </p>
                            )}

                            {!searching && newUserResults.length > 0 && (
                                <>

                                    <p className="text-[12px] text-[#008069] font-semibold px-5 pt-3 pb-1 uppercase tracking-wider">
                                        Add to Contacts
                                    </p>

                                    {newUserResults.map(user => (
                                        <div
                                            key={user.user_id}
                                            className="flex items-center px-3 py-2.5 hover:bg-whatsapp-bg transition-colors"
                                        >

                                            <div className="pr-3 shrink-0">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    name={user.name}
                                                    size={48}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 border-b border-whatsapp-border pb-2 pt-1 overflow-hidden">

                                                <div className="text-whatsapp-textPrimary text-[16px] truncate font-medium">
                                                    {user.name}
                                                </div>

                                                <div className="text-whatsapp-textSecondary text-[13px] truncate">
                                                    {user.phone}
                                                </div>

                                            </div>

                                            <button
                                                onClick={() => handleAddContact(user)}
                                                disabled={addingContact === user.user_id}
                                                className={`ml-2 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors
                                                ${addingContact === user.user_id
                                                    ? 'opacity-50 cursor-wait'
                                                    : 'hover:bg-[#008069]/10'
                                                } text-[#008069]`}
                                                title="Add contact"
                                            >
                                                <UserPlus size={15} />
                                                <span>Add</span>
                                            </button>

                                        </div>
                                    ))}

                                </>
                            )}

                            {/* JUST ADDED USERS */}
                            {!searching &&
                                userResults
                                    .filter(u => addedContacts.has(u.user_id))
                                    .map(user => (
                                        <div
                                            key={`added-${user.user_id}`}
                                            className="flex items-center px-3 py-2.5 hover:bg-whatsapp-bg transition-colors"
                                        >

                                            <div className="pr-3 shrink-0">
                                                <Avatar
                                                    src={user.profile_picture}
                                                    name={user.name}
                                                    size={48}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 border-b border-whatsapp-border pb-2 pt-1 overflow-hidden">

                                                <div className="text-whatsapp-textPrimary text-[16px] truncate font-medium">
                                                    {user.name}
                                                </div>

                                                <div className="text-[#008069] text-[13px] flex items-center gap-1">
                                                    <Check size={13} />
                                                    Added
                                                </div>

                                            </div>

                                            <button
                                                onClick={() => handleStartChat(user)}
                                                className="ml-2 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white bg-[#008069] hover:bg-[#00a884] transition-colors"
                                            >
                                                Message
                                            </button>

                                        </div>
                                    ))
                            }

                            {!searching && userResults.length === 0 && (
                                <p className="text-[13px] text-whatsapp-textSecondary text-center px-6 py-4">
                                    No users found for <b>"{panelQuery}"</b>.
                                    <br />
                                    <span className="text-[12px]">
                                        Try their exact name, email, or phone number.
                                    </span>
                                </p>
                            )}

                        </>
                    )}

                    {/* EMPTY CONTACT STATE */}
                    {panelQuery.length === 0 && filteredContacts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-whatsapp-textSecondary text-sm px-6 text-center gap-2">

                            <UserPlus size={40} className="text-whatsapp-border mb-1" />

                            <p>
                                Search for someone by name, email, or phone number to add them as a contact.
                            </p>

                        </div>
                    )}

                </div>
            )}

        </div>
    );
};

export default Sidebar;
