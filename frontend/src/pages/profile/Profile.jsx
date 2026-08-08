import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 px-4 flex items-center justify-center relative overflow-hidden">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full relative z-10"
            >
                <motion.button
                    whileHover={{ x: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center cursor-pointer gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 font-medium transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 w-fit"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </motion.button>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="bg-white rounded-3xl shadow-lg p-8"
                >
                    <div className="flex flex-col items-center text-center mb-8 relative">
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4 border-4 border-white shadow-sm"
                        >
                            <User size={40} className="text-gray-400" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            {user?.name || 'User'}
                        </h1>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
                            Member Profile
                        </span>
                    </div>

                    <div className="space-y-4 mb-8">
                        <motion.div 
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center gap-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-4 transition-colors hover:bg-gray-100"
                        >
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                                <Mail size={20} className="text-gray-400" />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-xs text-gray-400 font-semibold mb-0.5 uppercase tracking-wider">Email Address</span>
                                <span className="font-medium text-gray-700 truncate w-full text-base">{user?.email || 'No email found'}</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 bg-[#F4C430] hover:bg-[#e0b428] text-white font-semibold py-3 px-8 rounded-2xl transition-all shadow-sm"
                        >
                            <LogOut size={18} />
                            Logout from account
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default Profile;