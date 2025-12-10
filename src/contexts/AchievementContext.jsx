import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';

const AchievementContext = createContext();

export const AchievementProvider = ({ children }) => {
    const [achievements, setAchievements] = useState([]);

    const showAchievement = (achievement) => {
        const id = Date.now();
        setAchievements(prev => [...prev, { ...achievement, id }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            dismissAchievement(id);
        }, 5000);
    };

    const dismissAchievement = (id) => {
        setAchievements(prev => prev.filter(a => a.id !== id));
    };

    return (
        <AchievementContext.Provider value={{ showAchievement }}>
            {children}
            <AchievementNotifications achievements={achievements} onDismiss={dismissAchievement} />
        </AchievementContext.Provider>
    );
};

export const useAchievement = () => {
    const context = useContext(AchievementContext);
    if (!context) {
        throw new Error('useAchievement must be used within AchievementProvider');
    }
    return context;
};

function AchievementNotifications({ achievements, onDismiss }) {
    return (
        <div className="fixed top-20 right-4 z-50 space-y-4 pointer-events-none">
            <AnimatePresence>
                {achievements.map((achievement) => (
                    <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        className="glass-panel rounded-2xl p-4 shadow-float pointer-events-auto max-w-sm"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-500">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-sm">{achievement.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {achievement.description}
                                </div>
                            </div>
                            <button
                                onClick={() => onDismiss(achievement.id)}
                                className="p-1 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
