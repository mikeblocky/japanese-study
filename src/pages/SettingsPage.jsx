import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Settings as SettingsIcon,
    User,
    LogOut,
    Type,
    Clock,
    Bell,
    Shield,
    Palette,
    ChevronRight,
    Save,
    Check,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { settings, updateSetting, resetSettings } = useSettings();
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('preferences');
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [saveStatus, setSaveStatus] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileSave = async () => {
        if (!user?.id) return;
        const result = await updateProfile(user.id, profileForm);
        if (result.success) {
            setSaveStatus('success');
            setEditingProfile(false);
            setTimeout(() => setSaveStatus(null), 2000);
        } else {
            setSaveStatus('error');
        }
    };

    const tabs = [
        { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
        { id: 'account', label: 'Account', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const SettingCard = ({ title, description, children }) => (
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-5 space-y-4">
            <div>
                <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            {children}
        </div>
    );

    const Toggle = ({ checked, onChange, disabled }) => (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={cn(
                "relative w-11 h-6 rounded-full transition-all duration-200",
                checked ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <motion.div
                animate={{ x: checked ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
        </button>
    );

    return (
        <div className="pb-20 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 mb-10"
                >
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground/90">Settings</h1>
                    <p className="text-lg md:text-xl text-muted-foreground/80 font-light">Manage your account and preferences</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-2 sticky top-4">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                                        activeTab === tab.id
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    )}
                                </button>
                            ))}

                            {/* Logout Button */}
                            <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-3 space-y-6"
                    >
                        <AnimatePresence mode="wait">
                            {/* Preferences Tab */}
                            {activeTab === 'preferences' && (
                                <motion.div
                                    key="preferences"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <SettingCard title="Study preferences" description="Customize how you study">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Show furigana</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Display reading above kanji</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.showFurigana}
                                                    onChange={(v) => updateSetting('showFurigana', v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Auto-advance cards</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Automatically move to next card</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.autoAdvance}
                                                    onChange={(v) => updateSetting('autoAdvance', v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Card animations</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Enable flip animations</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.cardAnimations}
                                                    onChange={(v) => updateSetting('cardAnimations', v)}
                                                />
                                            </div>
                                        </div>
                                    </SettingCard>

                                    <SettingCard title="Session settings" description="Configure study sessions">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Default duration</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Minutes per session</div>
                                                </div>
                                                <input
                                                    type="number"
                                                    min={5}
                                                    max={120}
                                                    value={settings.defaultSessionDuration || 30}
                                                    onChange={(e) => updateSetting('defaultSessionDuration', parseInt(e.target.value))}
                                                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Show timer</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Display elapsed time</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.showTimer}
                                                    onChange={(v) => updateSetting('showTimer', v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Sound effects</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Play sounds for answers</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.playSound}
                                                    onChange={(v) => updateSetting('playSound', v)}
                                                />
                                            </div>
                                        </div>
                                    </SettingCard>
                                </motion.div>
                            )}

                            {/* Account Tab */}
                            {activeTab === 'account' && (
                                <motion.div
                                    key="account"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <SettingCard title="Profile information" description="Update your account details">
                                        <div className="space-y-4">
                                            {/* Avatar */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
                                                    {user?.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white">{user?.username}</div>
                                                    <div className="text-sm text-slate-500">{user?.email}</div>
                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                        {user?.role || 'STUDENT'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Edit Form */}
                                            {editingProfile ? (
                                                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Username</label>
                                                        <input
                                                            type="text"
                                                            value={profileForm.username}
                                                            onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value }))}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-slate-500 block mb-1">Email</label>
                                                        <input
                                                            type="email"
                                                            value={profileForm.email}
                                                            onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={handleProfileSave}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Save changes
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingProfile(false)}
                                                            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingProfile(true)}
                                                    className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                                >
                                                    Edit profile
                                                </button>
                                            )}
                                        </div>
                                    </SettingCard>

                                    <SettingCard title="Security" description="Manage your account security">
                                        <div className="space-y-4">
                                            <button className="flex items-center justify-between w-full py-2 text-left group">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">Change password</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Update your password</div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button className="flex items-center justify-between w-full py-2 text-left group">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">Two-factor authentication</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Add an extra layer of security</div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">Coming soon</span>
                                            </button>
                                        </div>
                                    </SettingCard>

                                    <SettingCard title="Danger zone" description="Irreversible actions">
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <X className="w-4 h-4" />
                                            Delete account
                                        </button>
                                    </SettingCard>
                                </motion.div>
                            )}

                            {/* Appearance Tab */}
                            {activeTab === 'appearance' && (
                                <motion.div
                                    key="appearance"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <SettingCard title="Display settings" description="Customize how the app looks">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Font size</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Adjust text size</div>
                                                </div>
                                                <select
                                                    value={settings.fontSize || 'medium'}
                                                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                                >
                                                    <option value="small">Small</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="large">Large</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Theme</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Choose your preferred theme</div>
                                                </div>
                                                <select
                                                    value={settings.theme || 'system'}
                                                    onChange={(e) => updateSetting('theme', e.target.value)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                                                >
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                    <option value="system">System</option>
                                                </select>
                                            </div>
                                        </div>
                                    </SettingCard>
                                </motion.div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <SettingCard title="Push notifications" description="Manage notification preferences">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Study reminders</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Get reminded to study</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.studyReminders || false}
                                                    onChange={(v) => updateSetting('studyReminders', v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Streak alerts</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Don't lose your streak</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.streakAlerts || false}
                                                    onChange={(v) => updateSetting('streakAlerts', v)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm text-slate-700 dark:text-slate-200">Achievement notifications</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">Celebrate your progress</div>
                                                </div>
                                                <Toggle
                                                    checked={settings.achievementNotifications !== false}
                                                    onChange={(v) => updateSetting('achievementNotifications', v)}
                                                />
                                            </div>
                                        </div>
                                    </SettingCard>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reset Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={resetSettings}
                                className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Reset all settings
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
