import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User, BookOpen, School, GraduationCap } from 'lucide-react';

// FIX: Defined outside the main component to prevent focus loss on re-render
const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative group">
      <Icon className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
      <input 
          {...props}
          className="w-full bg-[#0F172A]/60 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
      />
  </div>
);

const Auth = () => {
  const location = useLocation();
  // Determine mode based on URL path
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', college: '', university: '', course: '' 
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sync state if user navigates directly
  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location]);

  const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/login' : '/api/signup';
    
    try {
      const { data } = await axios.post(`http://localhost:5000${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        alert("Account created! Please login.");
        setIsLogin(true); // Switch to login view
        navigate('/login');
      }
    } catch (error) {
      alert(error.response?.data?.error || "An error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white py-10 px-4">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
        
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/20">
                {isLogin ? <Lock className="text-white" size={20} /> : <User className="text-white" size={20} />}
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
                {isLogin ? "Welcome Back" : "Join CollegeHub"}
            </h2>
            <p className="text-slate-400 text-sm">
                {isLogin ? "Enter your credentials to access your dashboard." : "Start your AI-powered academic journey today."}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-4 animate-fadeIn">
                <InputField icon={User} name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
                
                <div className="grid grid-cols-2 gap-4">
                    <InputField icon={BookOpen} name="course" value={formData.course} onChange={handleChange} placeholder="Course" required />
                    <InputField icon={School} name="college" value={formData.college} onChange={handleChange} placeholder="College" required />
                </div>
                
                <InputField icon={GraduationCap} name="university" value={formData.university} onChange={handleChange} placeholder="University" required />
            </div>
          )}
          
          <InputField icon={Mail} name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required />
          <InputField icon={Lock} name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required />

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2"
          >
            {loading ? <span className="animate-pulse">Processing...</span> : <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-slate-400 text-sm">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={() => {
                        const target = isLogin ? '/signup' : '/login';
                        setIsLogin(!isLogin);
                        navigate(target);
                    }} 
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                >
                    {isLogin ? "Create one" : "Log in"}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;