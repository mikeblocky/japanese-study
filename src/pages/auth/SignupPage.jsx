import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, User, Mail, Lock } from 'lucide-react';
import InteractiveDotGrid from '@/components/ui/InteractiveDotGrid';

const SignupPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await signup(username, email, password);
        setLoading(false);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-slate-800 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Effects - Slightly different colors for differentiation */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] bg-purple-50/50 rounded-full blur-[120px] mix-blend-multiply opacity-60" />
                <div className="absolute top-[30%] -left-[10%] w-[60vw] h-[60vw] bg-pink-50/50 rounded-full blur-[120px] mix-blend-multiply opacity-60" />
            </div>

            {/* Interactive Dot Grid */}
            <InteractiveDotGrid />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/50 p-8 relative z-10"
            >
                <div className="text-left mb-8">
                    <div className="inline-flex p-2.5 rounded-xl bg-slate-50 mb-4 border border-slate-100 shadow-sm">
                        <UserPlus className="w-5 h-5 text-slate-700" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
                    <p className="text-slate-500 text-sm mt-1">Join us to start your learning journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-start"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 pl-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-slate-300"
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 pl-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-slate-300"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 pl-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 transition-all placeholder:text-slate-300"
                                    placeholder="Create a password"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-slate-900/20 active:translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : <>Sign up <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></>}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-400">or continue with</span>
                    </div>
                </div>

                {/* Google Sign In */}
                <button
                    onClick={async () => {
                        setError('');
                        setLoading(true);
                        const res = await loginWithGoogle();
                        setLoading(false);
                        if (!res.success && res.message) setError(res.message);
                    }}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="mt-6 text-left border-t border-slate-100 pt-6">
                    <p className="text-slate-400 text-xs">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition-all">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SignupPage;


