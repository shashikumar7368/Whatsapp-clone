import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                const userData = await authService.getMe();
                setUser(userData);
            }
        } catch (error) {
            console.log('Not authenticated');
            localStorage.removeItem('access_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const data = await authService.login(credentials);
        const userData = await authService.getMe();
        setUser(userData);
        return data;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, checkAuth, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
