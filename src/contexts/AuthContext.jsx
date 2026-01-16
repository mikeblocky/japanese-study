import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const userData = response.data;
            const userObj = {
                uid: userData.id,
                displayName: userData.username,
                accessToken: userData.accessToken,
                role: 'USER'
            };
            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);
            return { success: true, user: userObj };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            return { success: false, message };
        }
    };

    const signup = async (username, password) => {
        try {
            await api.post('/auth/register', { username, password });
            return { success: true, message: 'Account created! Please log in.' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Signup failed';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
