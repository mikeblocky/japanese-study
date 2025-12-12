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
        // Check local storage for user
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const userData = response.data;

            // Map backend response to frontend user object
            // Backend: { token, id, username, roles }
            // Frontend expects role to be a string or check role logic
            const userObj = {
                uid: userData.id,
                email: userData.username, // Using username as email for display if needed, or update backend to return email
                displayName: userData.username,
                accessToken: userData.accessToken,
                role: userData.roles && userData.roles.length > 0 ? userData.roles[0].replace('ROLE_', '') : 'USER'
            };

            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);
            return { success: true, user: userObj };
        } catch (error) {
            console.error("Login error", error);

            // Render (free tier) + browser CORS/preflight issues often show up as a generic network error.
            // Retry once after a short delay to handle "waking up" instances.
            const isNetwork = error?.code === 'ERR_NETWORK' || String(error?.message || '').toLowerCase().includes('network');
            if (isNetwork) {
                try {
                    await new Promise((r) => setTimeout(r, 1200));
                    const retry = await api.post('/auth/login', { username, password });
                    const userData = retry.data;

                    const userObj = {
                        uid: userData.id,
                        email: userData.username,
                        displayName: userData.username,
                        accessToken: userData.accessToken,
                        role: userData.roles && userData.roles.length > 0 ? userData.roles[0].replace('ROLE_', '') : 'USER'
                    };

                    localStorage.setItem('user', JSON.stringify(userObj));
                    setUser(userObj);
                    return { success: true, user: userObj };
                } catch (retryError) {
                    console.error('Login retry failed', retryError);
                }
            }

            const message = error.response?.data?.message || error.message || 'Login failed';
            return { success: false, message };
        }
    };

    const signup = async (username, password) => {
        try {
            await api.post('/auth/register', {
                username: username,
                password: password
            });
            return { success: true, message: 'Account created successfully! Please log in.' };
        } catch (error) {
            console.error("Signup error", error);
            const message = error.response?.data?.message || error.message || 'Signup failed';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateProfile = async (userId, data) => {
        try {
            const res = await api.put(`/users/${userId}`, data);
            if (res.status === 200) {
                const updatedUser = { ...user, ...data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error("Update profile failed", error);
            return { success: false, error };
        }
    };

    const value = {
        user,
        login,
        signup,
        logout,
        updateProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
