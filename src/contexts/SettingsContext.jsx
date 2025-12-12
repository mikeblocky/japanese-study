import React, { createContext, useContext, useState, useEffect } from 'react';

// Settings Context
const SettingsContext = createContext();

// Default settings
const defaultSettings = {
    // Study Preferences
    showFurigana: true,
    autoAdvance: false,
    autoAdvanceDelay: 3, // seconds

    // Display Preferences
    cardAnimations: true,
    // Global UI animations (menus, page transitions, backgrounds)
    uiAnimations: false,
    fontSize: 'medium', // 'small', 'medium', 'large'

    // Study Session
    defaultSessionDuration: 20, // minutes
    showTimer: true,
    playSound: false,
};

export const SettingsProvider = ({ children }) => {
    // Load settings from localStorage or use defaults
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('studySettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });

    // Save to localStorage whenever settings change
    useEffect(() => {
        localStorage.setItem('studySettings', JSON.stringify(settings));
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('studySettings');
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

// Hook to use settings
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};


