import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, User, Lock } from 'lucide-react';
import InteractiveDotGrid from '@/components/ui/InteractiveDotGrid';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(username, password);
        setLoading(false);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] text-slate-800 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                {/* Subtle gradient blobs for depth */}
                <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-indigo-50/50 rounded-full blur-[120px] mix-blend-multiply opacity-60" />
                <div className="absolute top-[30%] -right-[10%] w-[60vw] h-[60vw] bg-purple-50/50 rounded-full blur-[120px] mix-blend-multiply opacity-60" />
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
                        <LogIn className="w-5 h-5 text-slate-700" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
                    <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
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
                                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 pl-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
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
                        {loading ? 'Signing in...' : <>Sign in <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></>}
                    </button>
                </form>

                <div className="mt-6 text-left border-t border-slate-100 pt-6">
                    <p className="text-slate-400 text-xs">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-all">
                            Create one
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
