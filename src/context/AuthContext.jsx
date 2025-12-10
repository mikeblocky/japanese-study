import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get user profile from Firestore (with timeout to prevent hanging)
    const getUserProfile = async (uid) => {
        try {
            const docRef = doc(db, 'users', uid);
            // Add timeout to prevent hanging on offline
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Firestore timeout')), 5000)
            );
            const snapshot = await Promise.race([getDoc(docRef), timeoutPromise]);
            return snapshot.exists() ? snapshot.data() : null;
        } catch (err) {
            console.warn("Could not get user profile:", err.message);
            return null;
        }
    };

    // Create/update user profile in Firestore
    const createUserProfile = async (uid, data) => {
        try {
            const docRef = doc(db, 'users', uid);
            await setDoc(docRef, {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.warn("Could not save user profile:", err.message);
        }
    };

    // Handle redirect result (for Google Sign-In profile creation)
    useEffect(() => {
        getRedirectResult(auth).then(async (result) => {
            if (result?.user) {
                console.log('Redirect result received, user:', result.user.email);
                const profile = await getUserProfile(result.user.uid);
                if (!profile) {
                    await createUserProfile(result.user.uid, {
                        username: result.user.displayName || result.user.email?.split('@')[0],
                        email: result.user.email,
                        role: 'STUDENT'
                    });
                }
            }
        }).catch((err) => {
            console.warn('Redirect result error:', err.message);
        });
    }, []);

    // Listen for auth state changes - this is the main auth state handler
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser?.email || 'null');
            if (firebaseUser) {
                // Set user immediately from Firebase Auth (no waiting)
                const initialUser = {
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    username: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                    role: 'STUDENT'
                };
                console.log('Setting user:', initialUser.email);
                setUser(initialUser);
                setLoading(false);

                // Load Firestore profile in background (non-blocking)
                getUserProfile(firebaseUser.uid)
                    .then(profile => {
                        if (profile) {
                            console.log('Got Firestore profile, updating role:', profile.role);
                            setUser(prev => ({ ...prev, ...profile }));
                        }
                    })
                    .catch(err => console.warn('Firestore profile failed:', err.message));
            } else {
                console.log('No user');
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Email/Password Login
    const login = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (err) {
            console.error("Login error:", err);
            let message = 'Login failed';
            if (err.code === 'auth/user-not-found') message = 'User not found';
            if (err.code === 'auth/wrong-password') message = 'Incorrect password';
            if (err.code === 'auth/invalid-email') message = 'Invalid email address';
            if (err.code === 'auth/invalid-credential') message = 'Invalid email or password';
            return { success: false, message };
        }
    };

    // Email/Password Signup
    const signup = async (username, email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Create user profile in Firestore
            await createUserProfile(result.user.uid, {
                username,
                email,
                role: 'STUDENT'
            });
            return { success: true, user: result.user };
        } catch (err) {
            console.error("Signup error:", err);
            let message = 'Signup failed';
            if (err.code === 'auth/email-already-in-use') message = 'Email already in use';
            if (err.code === 'auth/weak-password') message = 'Password should be at least 6 characters';
            if (err.code === 'auth/invalid-email') message = 'Invalid email address';
            return { success: false, message };
        }
    };

    // Google Sign-In (using redirect to avoid COOP issues)
    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithRedirect(auth, provider);
            return { success: true };
        } catch (err) {
            console.error("Google login error:", err);
            return { success: false, message: err.message || 'Google login failed' };
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    // Update profile
    const updateProfile = async (updates) => {
        if (!user) return { success: false, message: 'Not logged in' };
        try {
            await createUserProfile(user.uid, updates);
            setUser(prev => ({ ...prev, ...updates }));
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        loginWithGoogle,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
