import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    User as UserIcon,
    LogOut,
    Save,
    X,
    Mail,
    Shield,
    Sparkles,
    Sliders
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/ui/page';

export default function SettingsPage() {
    const { settings, updateSetting } = useSettings();
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [editingProfile, setEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileSave = async () => {
        if (!user?.id) return;
        const result = await updateProfile(user.id, profileForm);
        if (result.success) {
            setEditingProfile(false);
        }
    };

    return (
        <PageShell>
            <PageHeader 
                title="Settings" 
                description="Customize your account and study preferences"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card - Featured */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="relative flex-shrink-0">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-3xl sm:text-4xl font-bold">
                                        {user?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                        <h2 className="text-xl sm:text-2xl font-bold">{user?.username || 'Guest'}</h2>
                                        <Badge variant="secondary" className="h-6">
                                            <Shield className="mr-1 h-3 w-3" />
                                            {user?.role || 'STUDENT'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="text-sm break-all">{user?.email || 'No email set'}</span>
                                    </div>
                                </div>
                                {!editingProfile && (
                                    <Button variant="outline" onClick={() => setEditingProfile(true)} className="flex-shrink-0 w-full sm:w-auto">
                                        Edit profile
                                    </Button>
                                )}
                            </div>

                            {editingProfile && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="space-y-4 max-w-md">
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4" />
                                                Username
                                            </Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                value={profileForm.username}
                                                onChange={(e) => setProfileForm(p => ({ ...p, username: e.target.value }))}
                                                placeholder="Enter username"
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))}
                                                placeholder="your@email.com"
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                            <Button onClick={handleProfileSave} className="w-full sm:w-auto">
                                                <Save className="mr-2 h-4 w-4" />
                                                Save changes
                                            </Button>
                                            <Button variant="outline" onClick={() => setEditingProfile(false)} className="w-full sm:w-auto">
                                                <X className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Study Preferences */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Sliders className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Study Preferences</CardTitle>
                                    <CardDescription>Customize your learning experience</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="furigana" className="flex flex-col space-y-1 cursor-pointer">
                                    <span className="font-semibold">Show furigana</span>
                                    <span className="font-normal text-sm text-muted-foreground">Display readings above kanji characters</span>
                                </Label>
                                <Switch 
                                    id="furigana" 
                                    checked={settings.showFurigana} 
                                    onCheckedChange={(v) => updateSetting('showFurigana', v)} 
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="autoAdvance" className="flex flex-col space-y-1 cursor-pointer">
                                    <span className="font-semibold">Auto-advance cards</span>
                                    <span className="font-normal text-sm text-muted-foreground">Automatically move to the next card</span>
                                </Label>
                                <Switch 
                                    id="autoAdvance" 
                                    checked={settings.autoAdvance} 
                                    onCheckedChange={(v) => updateSetting('autoAdvance', v)} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Appearance */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>Visual preferences</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="cardAnim" className="flex flex-col space-y-1 cursor-pointer">
                                    <span className="font-semibold text-sm">Card animations</span>
                                    <span className="font-normal text-xs text-muted-foreground">Flip effects</span>
                                </Label>
                                <Switch 
                                    id="cardAnim" 
                                    checked={settings.cardAnimations} 
                                    onCheckedChange={(v) => updateSetting('cardAnimations', v)} 
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="uiAnim" className="flex flex-col space-y-1 cursor-pointer">
                                    <span className="font-semibold text-sm">UI animations</span>
                                    <span className="font-normal text-xs text-muted-foreground">Transitions</span>
                                </Label>
                                <Switch 
                                    id="uiAnim" 
                                    checked={settings.uiAnimations === true} 
                                    onCheckedChange={(v) => updateSetting('uiAnimations', v)} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sign Out */}
                <div className="lg:col-span-3">
                    <Card className="border-destructive/50">
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="font-semibold">Sign out of your account</p>
                                    <p className="text-sm text-muted-foreground">You'll need to log in again to access your data</p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleLogout}
                                    className="w-full sm:w-auto flex-shrink-0"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageShell>
    );
}


