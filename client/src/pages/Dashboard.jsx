import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';


import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

// --- MASTER ICON IMPORT (Contains everything for Roadmap, Settings, & CV) ---
import {
    BookOpen, TrendingUp, TrendingDown, Cpu, MessageSquare, Settings, Search, Bell,
    ThumbsUp, Send, PlayCircle, Lightbulb, Briefcase, FileText, Download, Plus,
    Trash2, LogOut, Sun, Moon, Zap, Heart, Trophy, Star, CheckCircle, AlertCircle,
    X, ChevronDown, ChevronUp, ChevronRight, Award, Target, User, Sparkles, Hexagon,
    Leaf, Cloud, Flame, Shield, Timer, HelpCircle, Activity, Crosshair, GraduationCap,
    DollarSign, BrainCircuit, Rocket, Layers, Map, Flag, TreeDeciduous, Sprout,
    ArrowRight, Check, Medal, ZapOff, Youtube, Quote, RefreshCw, Globe,
    ArrowLeft, Compass, Edit2, Mail, Printer, LayoutTemplate,
    Save   // ✅ ADD THIS LINE
} from 'lucide-react';

// --- Utility: Clean AI Text ---
const formatText = (text) => text ? text.replace(/\*\*/g, '').replace(/\*/g, '-') : "";

// =================================================================================
//  5. ROADMAP SECTION (DORA STYLE ADVENTURE MAP - FINAL)
// =================================================================================

// --- Utility: Safe Text Converter (Unique Name to avoid conflicts) ---
const roadmapSafeText = (val, fallback = "") => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(item => typeof item === 'object' ? JSON.stringify(item) : String(item)).join(', ');
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

// --- Sub-component: Video Player (Renamed to avoid conflicts) ---
const RoadmapVideoPlayer = ({ query, isDark }) => {
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchVideo = async () => {
            setLoading(true);
            try {
                const safeQuery = typeof query === 'string' ? query : 'technology tutorial';
                const res = await axios.get(`http://localhost:5000/api/videos?topic=${encodeURIComponent(safeQuery)}`);
                if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setVideo(res.data[0]);
                }
            } catch (e) { console.error("YT Error", e); }
            finally { if (isMounted) setLoading(false); }
        };
        if (query) fetchVideo();
        return () => { isMounted = false; };
    }, [query]);

    if (loading) return <div className={`w-full aspect-video animate-pulse rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}></div>;
    if (!video || !video.id) return <div className={`w-full aspect-video rounded-xl flex items-center justify-center text-sm border ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>No tutorial found.</div>;

    const videoId = typeof video.id === 'object' ? video.id.videoId : video.id;
    if (!videoId) return <div className="w-full aspect-video rounded-xl flex items-center justify-center text-slate-400">Video error.</div>;

    return (
        <div className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <iframe className="w-full aspect-video" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube Video" frameBorder="0" allowFullScreen></iframe>
        </div>
    );
};

// --- Main Roadmap Component ---
const RoadmapSection = ({ t, isDark, user }) => {
    const [viewMode, setViewMode] = useState('overview');
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [moduleDetails, setModuleDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const syllabus = (user && Array.isArray(user.syllabus)) ? user.syllabus : [];

    const handleSemesterClick = (semData) => {
        if (!semData) return;
        setSelectedSemester(semData);
        setViewMode('semester');
    };

    const handleModuleClick = async (moduleData) => {
        if (!moduleData) return;
        setSelectedModule(moduleData);
        setViewMode('module');
        setLoadingDetails(true);
        setModuleDetails([]);

        try {
            const res = await axios.post('http://localhost:5000/api/roadmap/details', {
                course: user?.course || "Course",
                moduleTitle: roadmapSafeText(moduleData.title, "Module"),
                topicsSummary: roadmapSafeText(moduleData.topicsSummary, "Topics")
            });
            let parsedDetails = res.data;
            // Fix common AI JSON mistakes (returning object instead of array)
            if (parsedDetails && typeof parsedDetails === 'object' && !Array.isArray(parsedDetails)) {
                const possibleArrayKey = Object.keys(parsedDetails).find(key => Array.isArray(parsedDetails[key]));
                if (possibleArrayKey) parsedDetails = parsedDetails[possibleArrayKey];
            }
            setModuleDetails(Array.isArray(parsedDetails) ? parsedDetails : []);
        } catch (e) {
            console.error("Failed to fetch module details", e);
            setModuleDetails([]);
        }
        setLoadingDetails(false);
    };

    const goBack = () => {
        if (viewMode === 'module') setViewMode('semester');
        else if (viewMode === 'semester') setViewMode('overview');
    };

    if (!user) return <div className="p-8 text-center">Loading user data...</div>;

    return (
        <div className="animate-fadeIn pb-20">
            {/* --- Header --- */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className={`text-2xl font-bold flex items-center gap-3 ${t.text}`}>
                        <Map className={t.accentText} size={28} />
                        Academic Adventure
                    </h2>
                    <p className={`text-sm mt-1 ${t.textSec}`}>
                        {viewMode === 'overview' && "Chart your course through the academic universe."}
                        {viewMode === 'semester' && `Exploration: Semester ${selectedSemester?.semester || ''}`}
                        {viewMode === 'module' && `Discovery: ${roadmapSafeText(selectedModule?.title)}`}
                    </p>
                </div>
                {viewMode !== 'overview' && (
                    <button onClick={goBack} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border shadow-sm ${t.card} hover:scale-[1.02] active:scale-95`}>
                        <ArrowLeft size={16} /> Back Map
                    </button>
                )}
            </div>

            {/* ================= VIEW 1: THE DORA MAP (Winding SVG Path) ================= */}
            {viewMode === 'overview' && (
                <div className="max-w-4xl mx-auto px-4 relative">
                    {syllabus.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                            <Layers size={48} className={`mb-4 opacity-40 ${t.textSec}`} />
                            <h3 className={`text-xl font-bold mb-2 ${t.text}`}>Map Not Found</h3>
                            <p className={`text-sm ${t.textSec}`}>Start your journey by creating a new account to generate the map.</p>
                        </div>
                    ) : (
                        <div className="relative pt-10 pb-32">
                            {/* --- MOBILE: Simple Vertical Line --- */}
                            <div className="absolute left-8 top-12 bottom-0 w-1 bg-indigo-200 dark:bg-slate-800 md:hidden"></div>

                            {syllabus.map((sem, i) => {
                                const isEven = i % 2 === 0; // Even: Left Side, Odd: Right Side
                                const isLast = i === syllabus.length - 1;

                                return (
                                    <div key={i} className={`relative flex items-center mb-32 md:mb-40 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                                        {/* --- DESKTOP: THE CURVED SVG PATH --- */}
                                        {!isLast && (
                                            <div className={`hidden md:block absolute top-[60%] ${isEven ? 'left-[50%]' : 'right-[50%]'} w-[50%] h-[160px] -z-10 pointer-events-none`}>
                                                {/* This SVG creates the S-Curve connecting the center points */}
                                                <svg className="w-full h-full" viewBox="0 0 200 160" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id={`grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                                                            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
                                                        </linearGradient>
                                                    </defs>
                                                    <motion.path
                                                        d={isEven
                                                            ? "M 0,0 C 100,0 100,160 200,160" // Left-to-Right S-Curve
                                                            : "M 200,0 C 100,0 100,160 0,160" // Right-to-Left S-Curve
                                                        }
                                                        fill="none"
                                                        stroke={`url(#grad-${i})`}
                                                        strokeWidth="4"
                                                        strokeDasharray="10 5" // Dashed line for map effect
                                                        initial={{ pathLength: 0 }}
                                                        whileInView={{ pathLength: 1 }}
                                                        viewport={{ once: true, margin: "-100px" }}
                                                        transition={{ duration: 1.5, ease: "easeInOut" }}
                                                        style={{
                                                            filter: 'drop-shadow(0px 0px 4px rgba(99, 102, 241, 0.5))'
                                                        }}
                                                    />
                                                </svg>
                                            </div>
                                        )}

                                        {/* --- CENTER MAP PIN --- */}
                                        <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-[6px] border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)] z-20 flex items-center justify-center">
                                            {isLast && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>}
                                        </div>

                                        {/* --- CONTENT CARD (The "Island") --- */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8, x: isEven ? -50 : 50 }}
                                            whileInView={{ opacity: 1, scale: 1, x: 0 }}
                                            viewport={{ once: true, margin: "-50px" }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className={`w-full md:w-[40%] pl-20 md:pl-0 ${isEven ? 'md:mr-auto md:text-right' : 'md:ml-auto md:text-left'}`}
                                        >
                                            <button
                                                onClick={() => handleSemesterClick(sem)}
                                                className={`relative group w-full p-8 rounded-[2rem] border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2
                                                ${isDark
                                                        ? 'bg-[#1e293b]/80 border-indigo-500/30 hover:border-indigo-400 hover:bg-[#1e293b]'
                                                        : 'bg-white border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/30'}
                                                flex flex-col ${isEven ? 'md:items-end' : 'md:items-start'}`}
                                            >
                                                {/* Floating Icon Badge */}
                                                <div className={`absolute -top-6 ${isEven ? 'right-8' : 'left-8'} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 group-hover:rotate-0 transition-all duration-300
                                                    ${isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>
                                                    {i === 0 ? <Flag size={24} /> : <Compass size={24} />}
                                                </div>

                                                <h3 className={`text-3xl font-black mt-4 mb-2 ${t.text}`}>
                                                    Semester {roadmapSafeText(sem?.semester) || i + 1}
                                                </h3>
                                                <p className={`text-base font-medium opacity-80 ${t.textSec} mb-6`}>
                                                    {roadmapSafeText(sem?.title) || `${Array.isArray(sem?.modules) ? sem.modules.length : 0} Adventures`}
                                                </p>

                                                <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                                    ${isDark ? 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white' : 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                                    Start Journey <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </button>
                                        </motion.div>
                                    </div>
                                );
                            })}

                            {/* Finish Line Flag at bottom */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                <div className="h-12 w-1 bg-gradient-to-b from-indigo-500 to-transparent opacity-50"></div>
                                <Flag size={32} className="text-indigo-500 animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= VIEW 2: MODULE LIST (Vertical Timeline) ================= */}
            {viewMode === 'semester' && (
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="relative pl-8 border-l-2 border-dashed border-indigo-200 dark:border-indigo-800 space-y-10 py-2">
                        {Array.isArray(selectedSemester?.modules) && selectedSemester.modules.map((mod, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute -left-[37px] top-6 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-500 transition-colors group-hover:border-purple-500"></div>
                                <button onClick={() => handleModuleClick(mod)} className={`w-full text-left p-6 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-lg ${t.card} ${isDark ? 'hover:border-indigo-500/30' : 'hover:border-indigo-300'}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3 inline-block ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {roadmapSafeText(mod?.code, `MOD ${i + 1}`)}
                                            </span>
                                            <h4 className={`text-xl font-bold mb-2 ${t.text}`}>{roadmapSafeText(mod?.title, 'Module')}</h4>
                                            <p className={`text-sm ${t.textSec} line-clamp-2`}>{roadmapSafeText(mod?.topicsSummary)}</p>
                                        </div>
                                        <ChevronRight className={`opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${t.accentText}`} />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ================= VIEW 3: MODULE DETAILS ================= */}
            {viewMode === 'module' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {loadingDetails ? (
                        <div className={`flex flex-col items-center justify-center py-32 rounded-[2rem] border ${t.card}`}>
                            <RefreshCw size={40} className={`animate-spin mb-6 ${t.accentText}`} />
                            <h3 className={`text-xl font-bold mb-2 ${t.text}`}>Charting Content</h3>
                            <p className={`text-sm ${t.textSec}`}>AI is searching for the best tutorials...</p>
                        </div>
                    ) : moduleDetails.length > 0 ? (
                        <div className="space-y-8">
                            <div className={`p-8 rounded-[2rem] border shadow-sm ${t.card}`}>
                                <h2 className={`text-3xl font-black mb-4 ${t.text}`}>{roadmapSafeText(selectedModule?.title)}</h2>
                                <p className={`text-lg font-medium ${t.textSec}`}>{roadmapSafeText(selectedModule?.topicsSummary)}</p>
                            </div>

                            <div className="grid gap-6">
                                {moduleDetails.map((subtopic, index) => {
                                    if (!subtopic) return null;
                                    return (
                                        <div key={index} className={`p-6 rounded-[2rem] border shadow-sm flex flex-col lg:flex-row gap-8 ${t.card}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300`}>{index + 1}</div>
                                                    <h3 className={`text-xl font-bold ${t.text}`}>{roadmapSafeText(subtopic?.title, 'Topic')}</h3>
                                                </div>
                                                <p className={`text-base leading-relaxed ${t.textSec} mb-6`}>{roadmapSafeText(subtopic?.description)}</p>
                                            </div>
                                            <div className="lg:w-[400px] shrink-0">
                                                <RoadmapVideoPlayer query={roadmapSafeText(subtopic?.youtubeQuery) || roadmapSafeText(subtopic?.title)} isDark={isDark} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className={`text-center py-20 rounded-[2rem] border ${t.card}`}>
                            <AlertCircle size={40} className={`mx-auto mb-4 text-red-400`} />
                            <h3 className={`text-xl font-bold mb-2 ${t.text}`}>Content Unavailable</h3>
                            <p className={t.textSec}>We couldn't retrieve the details for this module.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
// =================================================================================
//  2. ANALYTICS SECTION
// =================================================================================
const AnalyticsSection = ({ user, setUser, t, isDark, isGhibli, addXp }) => {
    const [showModal, setShowModal] = useState(false);
    const [semInput, setSemInput] = useState('');
    const [subInput, setSubInput] = useState([{ name: '', mark: '' }]);
    const [expandedSem, setExpandedSem] = useState(null);
    const [careerAdvice, setCareerAdvice] = useState('');
    const [careerLoading, setCareerLoading] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [chatHistory, setChatHistory] = useState([{ role: 'ai', text: `Hi ${user.name}! I'm ready to help.` }]);
    const [aiData, setAiData] = useState(null);

    const stats = useMemo(() => {
        if (!user.academicHistory.length) return null;
        const totalGPA = user.academicHistory.reduce((acc, curr) => acc + curr.gpa, 0);
        const cgpa = (totalGPA / user.academicHistory.length).toFixed(2);
        let trend = 0;
        if (user.academicHistory.length >= 2) {
            const last = user.academicHistory[user.academicHistory.length - 1].gpa;
            const prev = user.academicHistory[user.academicHistory.length - 2].gpa;
            trend = (last - prev).toFixed(2);
        }
        return { cgpa, trend };
    }, [user.academicHistory]);

    const handleAddSubject = () => setSubInput([...subInput, { name: '', mark: '' }]);
    const handleSubChange = (i, f, v) => {
        const n = [...subInput];
        n[i][f] = v;
        setSubInput(n);
    };

    const saveMarks = async () => {
        if (!semInput) return;
        const validSubjects = subInput.filter(s => s.name.trim() && s.mark !== '');
        if (validSubjects.length === 0) return alert("Add subjects");

        let finalSubjects = [...validSubjects];
        const existingSemester = user.academicHistory.find(h => h.semester == semInput);
        if (existingSemester) {
            const subjectMap = new Map();
            existingSemester.subjects.forEach(s => subjectMap.set(s.name.toLowerCase().trim(), { name: s.name, mark: s.mark }));
            validSubjects.forEach(s => subjectMap.set(s.name.toLowerCase().trim(), { name: s.name, mark: s.mark }));
            finalSubjects = Array.from(subjectMap.values());
        }

        const token = localStorage.getItem('token');
        try {
            const { data } = await axios.post('http://localhost:5000/api/add-marks',
                { userId: user._id, semester: semInput, subjects: finalSubjects },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(data); setShowModal(false); addXp(50); setSemInput(''); setSubInput([{ name: '', mark: '' }]);
        } catch (e) { alert("Error"); }
    };

    const getCareerAnalysis = async () => {
        setCareerLoading(true);
        try {
            const prompt = `Analyze: ${JSON.stringify(user.academicHistory)}. 1. Weakest subjects & 3 tips. 2. 3 career roles based on strengths with salary. Return JSON: { "tips": [], "careers": [{ "role": "", "description": "", "package": "", "skills": [] }] }`;
            const { data } = await axios.post('http://localhost:5000/api/ai-chat', { prompt, systemPrompt: "JSON bot." });
            const jsonStr = data.reply.substring(data.reply.indexOf('{'), data.reply.lastIndexOf('}') + 1);
            setAiData(JSON.parse(jsonStr));
        } catch (e) { alert("AI Error"); }
        setCareerLoading(false);
    };

    const sendChat = async () => {
        if (!chatMsg) return;
        const newHist = [...chatHistory, { role: 'user', text: chatMsg }];
        setChatHistory(newHist); setChatMsg('');
        try {
            const { data } = await axios.post('http://localhost:5000/api/ai-chat', { prompt: chatMsg, systemPrompt: "Academic advisor." });
            setChatHistory([...newHist, { role: 'ai', text: formatText(data.reply) }]);
        } catch (e) { }
    };

    return (
        <div className="animate-fadeIn pb-10 relative space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className={`p-6 flex flex-col justify-center relative overflow-hidden group ${t.card}`}>
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-2">
                                    <div className={`p-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'} backdrop-blur-md`}><Trophy className={t.accentText} size={24} /></div>
                                    {stats && <span className={`text-xs font-bold ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>{stats.trend >= 0 ? '+' : ''}{stats.trend}</span>}
                                </div>
                                <h3 className={`text-5xl font-black tracking-tighter ${t.text}`}>{stats ? stats.cgpa : "0.0"}</h3>
                                <p className={`text-xs font-bold uppercase tracking-widest ${t.textSec} mt-1`}>Current CGPA</p>
                            </div>
                        </div>
                        <button onClick={() => setShowModal(true)} className={`group relative p-6 border-2 border-dashed flex flex-col items-center justify-center transition-all hover:scale-[1.02] active:scale-95 ${t.card} ${isDark ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-300 hover:border-indigo-500'}`}>
                            <Plus size={24} className={`mb-2 ${t.textSec} group-hover:${t.accentText}`} /><p className={`font-bold ${t.text}`}>Add Grades</p>
                        </button>
                    </div>
                    <div className={`p-8 ${t.card} min-h-[350px]`}>
                        <h3 className={`text-xl font-bold mb-6 ${t.text}`}>Trajectory</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={user.academicHistory}>
                                <defs><linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={t.chartFill} stopOpacity={0.4} /><stop offset="95%" stopColor={t.chartFill} stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="semester" stroke={isDark ? '#94a3b8' : '#64748b'} tickFormatter={(val) => `S${val}`} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 10]} stroke={isDark ? '#94a3b8' : '#64748b'} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#000' : '#fff', borderRadius: '12px', border: 'none' }} itemStyle={{ color: t.chartFill }} />
                                <Area type="monotone" dataKey="gpa" stroke={t.chartStroke} strokeWidth={4} fill="url(#colorGpa)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 h-full">
                    <div className={`h-full ${t.card} flex flex-col overflow-hidden max-h-[600px]`}>
                        <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center`}><h3 className={`font-bold ${t.text}`}>Ledger</h3></div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {user.academicHistory.map((sem, i) => (
                                <div key={i} className={`rounded-2xl transition-all border ${expandedSem === i ? (isDark ? 'bg-white/5 border-white/20' : 'bg-white border-indigo-200 shadow-md') : (isDark ? 'bg-transparent border-gray-800' : 'bg-slate-50 border-transparent hover:bg-white')}`}>
                                    <div onClick={() => setExpandedSem(expandedSem === i ? null : i)} className="p-4 flex justify-between items-center cursor-pointer">
                                        <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${sem.gpa >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`}>{sem.gpa}</div><div><h4 className={`font-bold text-sm ${t.text}`}>Sem {sem.semester}</h4><p className={`text-xs ${t.textSec}`}>{sem.subjects.length} Subjects</p></div></div>
                                        {expandedSem === i ? <ChevronUp size={16} className={t.textSec} /> : <ChevronDown size={16} className={t.textSec} />}
                                    </div>
                                    {expandedSem === i && (<div className={`px-4 pb-4 pt-0 space-y-2`}>{sem.subjects.map((sub, j) => (<div key={j} className="flex justify-between text-xs items-center p-2 rounded-lg bg-black/5 dark:bg-white/5"><span className={`font-medium ${t.text}`}>{sub.name}</span><span className={`font-bold ${t.accentText}`}>{sub.mark}</span></div>))}</div>)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`p-6 ${t.card} min-h-[400px]`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className={`font-bold text-xl flex items-center gap-2 ${t.text}`}><Briefcase size={20} className={t.accentText} /> AI Intelligence</h3>
                            <button onClick={getCareerAnalysis} disabled={careerLoading} className={`px-6 py-2 rounded-xl font-bold text-sm shadow-lg ${t.primary} ${careerLoading ? 'opacity-70' : ''}`}>{careerLoading ? "Thinking..." : "Analyze Profile"}</button>
                        </div>
                        {!aiData ? (<div className={`text-center py-20 rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-800' : 'border-gray-200'}`}><BrainCircuit size={48} className={`mx-auto mb-4 opacity-20 ${t.textSec}`} /><p className={`text-sm ${t.textSec}`}>Click analyze for insights.</p></div>) : (
                            <div className="space-y-8 animate-fadeIn">
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}><h4 className={`font-bold text-sm mb-3 text-yellow-500`}>Study Doctor</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{aiData.tips.map((tip, i) => (<div key={i} className="text-xs leading-relaxed opacity-90">• {tip}</div>))}</div></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{aiData.careers.map((card, i) => (<div key={i} className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}><h4 className={`font-bold text-lg mb-1 ${t.text}`}>{card.role}</h4><div className={`text-xs font-bold mb-3 text-green-500`}>{card.package}</div><p className={`text-xs opacity-70 mb-4 ${t.textSec}`}>{card.description}</p><div className="flex flex-wrap gap-2">{card.skills?.map((s, j) => (<span key={j} className={`px-2 py-1 rounded text-[10px] font-bold ${isDark ? 'bg-white/10' : 'bg-white border'}`}>{s}</span>))}</div></div>))}</div>
                            </div>
                        )}
                    </div>
                </div>
                <div className={`lg:col-span-1 p-4 ${t.card} h-[400px] flex flex-col`}>
                    <div className={`flex items-center gap-3 mb-3 pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}><MessageSquare size={18} className={t.accentText} /><h3 className={`font-bold text-sm ${t.text}`}>Career Coach</h3></div>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 custom-scrollbar">{chatHistory.map((msg, i) => (<div key={i} className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? `${t.primary} ml-auto max-w-[90%]` : `${isDark ? 'bg-white/10' : 'bg-slate-100'} ${t.text} mr-auto max-w-[90%]`}`}>{msg.text}</div>))}</div>
                    <div className={`flex gap-2 p-1 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}><input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a message..." onKeyPress={(e) => e.key === 'Enter' && sendChat()} className={`flex-1 p-2 text-xs bg-transparent outline-none ${t.text}`} /><button onClick={sendChat} className={`p-2 rounded-lg ${t.primary}`}><Send size={14} /></button></div>
                </div>
            </div>

            {showModal && (<div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? 'bg-black/70' : 'bg-black/40'}`}><div className={`w-full max-w-lg p-8 shadow-2xl relative ${t.card} ${isDark ? 'bg-[#050505]' : 'bg-white'}`}><button onClick={() => setShowModal(false)} className={`absolute top-6 right-6 hover:text-red-500 transition-colors ${t.textSec}`}><X size={24} /></button><h3 className={`text-3xl font-bold mb-2 ${t.text}`}>Record Grades</h3><div className="mb-6"><label className={`text-xs font-bold uppercase ml-1 ${t.textSec}`}>Semester</label><input type="number" placeholder="e.g. 4" value={semInput} onChange={e => setSemInput(e.target.value)} className={`w-full p-4 mt-1 font-bold outline-none transition-all ${t.input}`} /></div><div className="max-h-60 overflow-y-auto space-y-3 mb-8 pr-2 custom-scrollbar">{subInput.map((s, i) => (<div key={i} className="flex gap-3"><input placeholder="Subject Name" value={s.name} onChange={e => handleSubChange(i, 'name', e.target.value)} className={`flex-1 p-3 outline-none ${t.input}`} /><input type="number" placeholder="Mark" value={s.mark} onChange={e => handleSubChange(i, 'mark', e.target.value)} className={`w-24 p-3 outline-none ${t.input}`} /></div>))}</div><div className="flex gap-4"><button onClick={handleAddSubject} className={`px-6 py-3 rounded-xl border-2 border-dashed font-bold transition-all ${isDark ? 'border-white/20' : 'border-slate-300'}`}>+ Add Subject</button><button onClick={saveMarks} className={`flex-1 py-3 rounded-xl font-bold shadow-lg ${t.primary}`}>Save & Calculate</button></div></div></div>)}
        </div>
    );
};

// =================================================================================
//  3. INTERVIEW SECTION (AI-GENERATED + RANDOM)
// =================================================================================
const InterviewSection = ({ t, isDark, isGhibli, addXp, user }) => {
    // Persistent Stats
    const [stats, setStats] = useState({
        sets: 0,
        xp: 0,
        accuracy: 0
    });

    useEffect(() => {

        const loadStats = async () => {

            try {

                const res = await axios.get(
                    `http://localhost:5000/api/quiz-stats/${user._id}`
                );

                setStats(res.data);

            }
            catch (err) {

                console.error("Failed to load quiz stats", err);

            }

        };

        if (user?._id) loadStats();

    }, [user]);



    const [gameState, setGameState] = useState('intro');
    const [currentSet, setCurrentSet] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedbackState, setFeedbackState] = useState('none');
    const [sessionScore, setSessionScore] = useState(0);
    const [loading, setLoading] = useState(false);

    // AI Generation Logic
    const startSession = async () => {
        setLoading(true);
        setGameState('loading');
        try {
            const course = user?.course || "General Knowledge";
            const prompt = `Generate 4 multiple-choice questions for a ${course} student.
            Mix: 1 Aptitude, 1 GK, 2 Core ${course} technical questions.
            Format: strictly JSON array of objects:
            [{ "q": "Question?", "options": ["A","B","C","D"], "ans": 0, "explanation": "Why?" }]`;

            const { data } = await axios.post('http://localhost:5000/api/ai-chat', {
                prompt,
                systemPrompt: "You are a quiz API. Output only valid JSON."
            });

            let jsonString = data.reply.trim();
            // Clean up markdown if present
            const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
            if (jsonMatch) jsonString = jsonMatch[0];

            const newQuestions = JSON.parse(jsonString);

            if (newQuestions && newQuestions.length > 0) {
                setCurrentSet(newQuestions);
                setCurrentQIndex(0);
                setSessionScore(0);
                setFeedbackState('none');
                setSelectedOption(null);
                setGameState('playing');
            } else {
                throw new Error("Empty response");
            }
        } catch (e) {
            console.error("Quiz Gen Error:", e);
            alert("Mission generation failed. Please try again.");
            setGameState('intro');
        }
        setLoading(false);
    };

    const handleCheck = () => {
        if (selectedOption === null) return;
        const isCorrect = selectedOption === currentSet[currentQIndex].ans;
        if (isCorrect) setSessionScore(s => s + 1);
        setFeedbackState(isCorrect ? 'correct' : 'incorrect');
    };

    const handleContinue = async () => {

        if (currentQIndex + 1 < currentSet.length) {

            setCurrentQIndex(i => i + 1);
            setSelectedOption(null);
            setFeedbackState('none');

        }
        else {

            const newSets = stats.sets + 1;
            const newXP = stats.xp + (sessionScore * 20);

            const prevTotalQs = stats.sets * 4;
            const currentTotalQs = prevTotalQs + 4;
            const prevCorrect = (stats.accuracy / 100) * prevTotalQs;
            const totalCorrect = prevCorrect + sessionScore;

            const newAcc =
                currentTotalQs > 0
                    ? Math.round((totalCorrect / currentTotalQs) * 100)
                    : 0;

            const newStats = {
                sets: newSets,
                xp: newXP,
                accuracy: newAcc
            };

            // update frontend instantly
            setStats(newStats);

            // save to database
            try {

                await axios.put(
                    `http://localhost:5000/api/quiz-stats/${user._id}`,
                    newStats
                );

            }
            catch (err) {

                console.error("Failed to save quiz stats", err);

            }

            addXp(sessionScore * 20);

            setGameState('summary');

        }
    };

    const getRank = (score) => {
        const percentage = (score / 4) * 100;
        if (percentage === 100) return "Legendary";
        if (percentage >= 75) return "Master";
        if (percentage >= 50) return "Apprentice";
        return "Novice";
    };

    if (gameState === 'intro' || gameState === 'loading') {
        return (
            <div className="space-y-8 animate-fadeIn pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-[2rem] flex items-center gap-4 ${t.card}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Layers size={24} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${t.textSec}`}>Sets Completed</p>
                            <h3 className={`text-2xl font-black ${t.text}`}>{stats.sets}</h3>
                        </div>
                    </div>
                    <div className={`p-6 rounded-[2rem] flex items-center gap-4 ${t.card}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${t.textSec}`}>Total XP</p>
                            <h3 className={`text-2xl font-black ${t.text}`}>{stats.xp}</h3>
                        </div>
                    </div>
                    <div className={`p-6 rounded-[2rem] flex items-center gap-4 ${t.card}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                            <Target size={24} />
                        </div>
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider ${t.textSec}`}>Accuracy</p>
                            <h3 className={`text-2xl font-black ${t.text}`}>{stats.accuracy}%</h3>
                        </div>
                    </div>
                </div>

                <div className={`max-w-2xl mx-auto ${t.card} p-12 text-center min-h-[500px] flex flex-col items-center justify-center animate-fadeIn`}>
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce ${isGhibli ? 'bg-[#558B2F]' : 'bg-gradient-to-tr from-green-400 to-green-600'}`}>
                        <BrainCircuit size={64} className="text-white" />
                    </div>
                    <h2 className={`text-4xl font-black mb-4 ${t.text}`}>
                        {gameState === 'loading' ? 'Generating Mission...' : `Ready for Set #${stats.sets + 1}?`}
                    </h2>
                    <p className={`text-lg mb-10 max-w-md ${t.textSec}`}>
                        {gameState === 'loading'
                            ? `Calibrating difficulty based on ${user?.course}...`
                            : `Generates a unique mix of Aptitude, GK, and ${user?.course || "General"} questions.`}
                    </p>
                    <button onClick={startSession} disabled={loading} className={`px-16 py-5 rounded-2xl font-bold text-xl shadow-xl transition-transform hover:scale-105 ${isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'} ${loading ? 'opacity-50' : ''}`}>
                        Start Mission
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'playing' && currentSet.length > 0) {
        const q = currentSet[currentQIndex];
        const progress = ((currentQIndex) / 4) * 100;
        return (
            <div className={`max-w-3xl mx-auto ${t.card} min-h-[600px] flex flex-col relative overflow-hidden animate-fadeIn`}>
                <div className="p-6 flex items-center gap-6">
                    <X className={`cursor-pointer hover:text-red-500 transition-colors ${t.textSec}`} onClick={() => setGameState('intro')} />
                    <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="flex-1 p-8 flex flex-col justify-center">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentQIndex}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className={`text-2xl md:text-3xl font-bold mb-10 leading-tight ${t.text}`}>{q.q}</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {q.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => feedbackState === 'none' && setSelectedOption(i)}
                                        disabled={feedbackState !== 'none'}
                                        className={`p-6 text-left rounded-2xl border-2 border-b-4 active:border-b-2 active:translate-y-0.5 font-bold text-lg transition-all 
                                          ${selectedOption === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : `${isDark ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'} ${t.text}`}
                                          ${feedbackState !== 'none' && i === q.ans ? 'border-green-500 bg-green-50 dark:bg-green-900/20 !text-green-600' : ''}
                                          ${feedbackState === 'incorrect' && selectedOption === i ? 'border-red-500 bg-red-50 dark:bg-red-900/20 !text-red-600' : ''}
                                      `}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className={`p-6 border-t ${feedbackState === 'correct' ? 'bg-green-100 dark:bg-green-900/20 border-green-500' : (feedbackState === 'incorrect' ? 'bg-red-100 dark:bg-red-900/20 border-red-500' : `${isDark ? 'border-gray-800' : 'border-gray-100'}`)}`}>
                    {feedbackState === 'none' ? (
                        <button
                            onClick={handleCheck}
                            disabled={selectedOption === null}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all border-b-4 active:border-b-0 active:translate-y-1 ${selectedOption !== null ? 'bg-green-500 border-green-600 text-white shadow-lg hover:bg-green-600' : 'bg-gray-300 border-gray-400 dark:bg-gray-700 dark:border-gray-600 text-gray-500 cursor-not-allowed'}`}
                        >
                            Check Answer
                        </button>
                    ) : (
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-5">
                            <div className="flex-1">
                                <div className={`font-bold text-xl mb-1 flex items-center gap-2 ${feedbackState === 'correct' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {feedbackState === 'correct' ? <CheckCircle size={24} /> : <X size={24} />}
                                    {feedbackState === 'correct' ? "Nicely done!" : "Incorrect"}
                                </div>
                                <p className={`text-sm ${feedbackState === 'correct' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                    {feedbackState === 'incorrect' && `Correct Answer: ${q.options[q.ans]}. `}
                                    {q.explanation}
                                </p>
                            </div>
                            <button onClick={handleContinue} className={`w-full md:w-auto px-10 py-3 rounded-2xl font-bold text-white shadow-lg border-b-4 active:border-b-0 active:translate-y-1 ${feedbackState === 'correct' ? 'bg-green-500 border-green-600 hover:bg-green-600' : 'bg-red-500 border-red-600 hover:bg-red-600'}`}>
                                Continue
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'summary') {
        return (
            <div className={`max-w-xl mx-auto ${t.card} p-10 text-center animate-popUp`}>
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-2">SESSION CLEARED</h2>
                    <div className="flex justify-center gap-2 mb-6">
                        {[...Array(3)].map((_, i) => (
                            <Star key={i} size={40} className={`${i < Math.floor((sessionScore / 4) * 3) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} animate-bounce`} style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>
                    <h3 className={`text-4xl font-black ${t.text}`}>{getRank(sessionScore)}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className="text-xs font-bold uppercase text-gray-500">Accuracy</p>
                        <p className={`text-2xl font-black ${t.accentText}`}>{Math.round((sessionScore / 4) * 100)}%</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className="text-xs font-bold uppercase text-gray-500">XP Gained</p>
                        <p className="text-2xl font-black text-yellow-500">+{sessionScore * 20}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={startSession} className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg border-b-4 active:border-b-0 active:translate-y-1 ${t.primary}`}>Start Next Set</button>
                    <button onClick={() => setGameState('intro')} className={`px-6 py-4 rounded-2xl border font-bold uppercase tracking-widest text-sm border-b-4 active:border-b-2 active:translate-y-0.5 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Exit</button>
                </div>
            </div>
        );
    }
};

/// =================================================================================
//  4. FEED SECTION (RANDOMIZED NEWS ROTATION)
// =================================================================================

// --- Utility: Randomize Array Order ---
const shuffleArray = (array) => {
    if (!array || array.length === 0) return [];
    // Create a copy to avoid mutating original state
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const FeedSection = ({ t, isDark, user }) => {
    const [activeSubTab, setActiveSubTab] = useState('discover');

    // --- Feed States ---
    const [loadingFeed, setLoadingFeed] = useState(false);
    const [newsData, setNewsData] = useState([]);
    const [youtubeData, setYoutubeData] = useState([]);
    const [aiQuote, setAiQuote] = useState(null);
    const [refreshKey, setRefreshKey] = useState(Math.random());

    // Report & Community States
    const [loadingReport, setLoadingReport] = useState(false);
    const [report, setReport] = useState(null);
    const [newPost, setNewPost] = useState("");
    const [posts, setPosts] = useState([]);

    // --- HELPER 1: Smart Topic Mapping for NEWS ---
    const getNewsSearchTopic = (courseName) => {
        if (!courseName || typeof courseName !== 'string') return "Technology Trends";
        const normalized = courseName.toLowerCase().replace(/\./g, '').trim();
        const domainMap = {
            'bca': 'Computer Science Technology', 'mca': 'Software Engineering Trends', 'bsc cs': 'Computer Science breakthroughs', 'cse': 'Computer Science Engineering News', 'it': 'Information Technology Trends',
            'bba': 'Business News and Economy', 'mba': 'Global Finance and Management', 'bcom': 'Financial Markets News',
            'btech': 'Emerging Engineering Technology', 'be': 'Engineering innovations', 'mech': 'Mechanical Engineering news'
        };
        return domainMap[normalized] || `${courseName} industry trends`;
    };

    // --- HELPER 2: Smart Topic Mapping for YOUTUBE TUTORIALS ---
    const getYouTubeSearchTopic = (courseName) => {
        if (!courseName || typeof courseName !== 'string') return "Technology crash course for beginners";
        const normalized = courseName.toLowerCase().replace(/\./g, '').trim();
        const topicMap = {
            'bca': 'Data Structures and Algorithms for beginners', 'mca': 'Full Stack Web Development Course', 'bsc cs': 'Python Programming Full Course for Beginners', 'cse': 'Introduction to Computer Science Engineering course', 'it': 'Web Development Roadmap and tutorial',
            'bba': 'Business Management Fundamentals course', 'mba': 'Finance and Accounting for beginners', 'bcom': 'Financial Accounting Full Course',
            'btech': 'Engineering Mathematics tutorial', 'mech': 'Mechanical Engineering basics',
        };
        return topicMap[normalized] || `${courseName} full course for beginners`;
    };

    // --- 1. FETCH DATA (PARALLEL CALLS) ---
    useEffect(() => {
        const fetchData = async () => {
            setLoadingFeed(true);
            const courseRaw = user.course || "Technology";

            // CALL A: Real News (Fetch 10 -> Shuffle -> Show 3)
            const newsTopic = getNewsSearchTopic(courseRaw);
            axios.get(`http://localhost:5000/api/news?topic=${encodeURIComponent(newsTopic)}&_t=${refreshKey}`)
                .then(res => {
                    const allArticles = res.data || [];
                    // This creates the "Fresh" feeling by picking 3 random ones from the pool of 10
                    const randomThree = shuffleArray(allArticles).slice(0, 3);
                    setNewsData(randomThree);
                })
                .catch(e => { console.error("News error:", e); setNewsData([]); });

            // CALL B: Real YouTube Videos (Fetch 4 -> Shuffle -> Show 4 in random order)
            const ytTopic = getYouTubeSearchTopic(courseRaw);
            axios.get(`http://localhost:5000/api/videos?topic=${encodeURIComponent(ytTopic)}&_t=${refreshKey}`)
                .then(res => {
                    const allVideos = res.data || [];
                    // Shuffle videos too so the grid looks different
                    setYoutubeData(shuffleArray(allVideos));
                })
                .catch(e => { console.error("YouTube error:", e); setYoutubeData([]); });

            // CALL C: AI Quote
            const prompt = `Generate JSON for a ${courseRaw} student: { "quote": { "text": "Inspirational quote", "author": "Leader Name" } }`;
            const systemPrompt = `JSON API Only. Seed: ${refreshKey}`;
            axios.post('http://localhost:5000/api/ai-chat', { prompt, systemPrompt })
                .then(res => {
                    const jsonMatch = res.data.reply.match(/\{[\s\S]*\}/);
                    const parsedAi = JSON.parse(jsonMatch ? jsonMatch[0] : res.data.reply);
                    setAiQuote(parsedAi.quote);
                })
                .catch(e => console.error("AI quote error", e));

            setLoadingFeed(false);
        };
        fetchData();
    }, [refreshKey, user.course]);

    // --- Report & Community Functions ---
    const generateReport = async () => {
        setLoadingReport(true);
        try {
            const historyStr = user.academicHistory.length > 0 ? JSON.stringify(user.academicHistory) : "No grades recorded yet.";
            const prompt = `Act as an academic advisor. Analyze: ${user.name}, Course: ${user.course}. History: ${historyStr}. Return STRICT JSON: { "summary": "...", "strengths": ["..."], "weaknesses": ["..."], "plan": ["..."] }`;
            const { data } = await axios.post('http://localhost:5000/api/ai-chat', { prompt, systemPrompt: "JSON Academic Advisor" });
            const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
            setReport(JSON.parse(jsonMatch ? jsonMatch[0] : data.reply));
        } catch (e) { alert("Report generation failed."); }
        setLoadingReport(false);
    };
    const handlePost = () => { if (!newPost.trim()) return; setPosts([{ id: Date.now(), author: user.name, role: "Student", content: newPost, likes: 0, liked: false }, ...posts]); setNewPost(""); };
    const toggleLike = (id) => setPosts(posts.map(p => p.id === id ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked } : p));

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className={`p-1 rounded-full flex gap-1 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                    <button onClick={() => setActiveSubTab('discover')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeSubTab === 'discover' ? t.primary : 'text-gray-500 hover:text-gray-700'}`}>Discover & Community</button>
                    <button onClick={() => setActiveSubTab('report')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeSubTab === 'report' ? t.primary : 'text-gray-500 hover:text-gray-700'}`}>My Progress Report</button>
                </div>
                {activeSubTab === 'discover' && (
                    <button onClick={() => setRefreshKey(Math.random())} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs border transition-all ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-300 hover:bg-slate-100'} ${loadingFeed ? 'opacity-50' : ''}`}>
                        <RefreshCw size={14} className={loadingFeed ? "animate-spin" : ""} /> {loadingFeed ? "Updating..." : "Refresh Feed"}
                    </button>
                )}
            </div>

            {/* TAB 1: DISCOVER */}
            {activeSubTab === 'discover' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: News & Video (2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* REAL News Section */}
                        <div>
                            <h3 className={`font-bold text-xl mb-6 flex items-center gap-2 ${t.text}`}>
                                <Globe size={20} className="text-indigo-500" /> Latest News: {user.course}
                            </h3>
                            {loadingFeed && newsData.length === 0 ? (
                                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className={`h-40 rounded-3xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}></div>)}</div>
                            ) : (
                                <div className="space-y-6">
                                    {newsData.length > 0 ? newsData.map((n, i) => (
                                        <div key={i} className={`flex flex-col md:flex-row gap-6 p-5 rounded-3xl border transition-all hover:shadow-xl ${t.card} ${isDark ? 'border-white/5' : 'border-slate-100/50'}`}>
                                            <div className="w-full md:w-48 h-48 md:h-auto rounded-2xl overflow-hidden shrink-0 relative">
                                                <img src={n.image} alt="news" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" onError={(e) => { e.target.src = 'https://picsum.photos/400/400?grayscale&blur=2' }} />
                                                <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md`}>{n.source.name}</div>
                                            </div>
                                            <div className="flex-1 flex flex-col py-2">
                                                <h4 className={`text-xl font-bold mb-3 leading-tight ${t.text}`}>{n.title}</h4>
                                                <p className={`text-sm leading-relaxed mb-4 opacity-80 line-clamp-3 ${t.textSec}`}>{n.description}</p>
                                                <div className="mt-auto"><a href={n.url} target="_blank" rel="noopener noreferrer" className={`text-xs font-bold flex items-center gap-1 ${t.accentText} hover:underline w-fit`}>Read Full Story at Source <ArrowRight size={14} /></a></div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className={`p-8 rounded-3xl text-center border-2 border-dashed ${isDark ? 'border-white/10' : 'border-slate-200'}`}><Globe size={40} className={`mx-auto mb-4 opacity-30 ${t.textSec}`} /><p className={`font-bold ${t.text}`}>No specific news found for "{user.course}".</p></div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* --- REAL YouTube Recommendations --- */}
                        {youtubeData.length > 0 && (
                            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-white border-slate-100'}`}>
                                <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${t.text}`}>
                                    <Youtube size={20} className="text-red-500" /> Recommended Tutorials
                                </h3>
                                {/* 2x2 Grid Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {youtubeData.map((item, i) => {
                                        const videoId = item.id.videoId;
                                        const snippet = item.snippet;
                                        return (
                                            <a
                                                key={i}
                                                href={`https://www.youtube.com/watch?v=${videoId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group cursor-pointer p-3 rounded-2xl transition-all hover:bg-black/5 dark:hover:bg-white/5 block"
                                            >
                                                <div className="w-full h-36 rounded-xl overflow-hidden relative bg-black mb-3 shadow-md">
                                                    <img src={snippet.thumbnails.medium.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt={snippet.title} />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <PlayCircle className="text-white drop-shadow-lg group-hover:scale-110 transition-transform" size={48} />
                                                    </div>
                                                </div>
                                                <h4 className={`font-bold text-sm line-clamp-2 leading-tight ${t.text} group-hover:${t.accentText}`} dangerouslySetInnerHTML={{ __html: snippet.title }}></h4>
                                                <p className={`text-xs mt-1 font-medium ${t.textSec}`}>{snippet.channelTitle}</p>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {loadingFeed && youtubeData.length === 0 && (
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className={`h-48 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}></div>)}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Community & Quote */}
                    <div className="space-y-8">
                        {aiQuote && (
                            <div className={`p-8 rounded-[2.5rem] text-center relative overflow-hidden shadow-lg ${isDark ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-50'}`}>
                                <Quote size={32} className={`mx-auto mb-4 opacity-40 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`} />
                                <p className={`text-lg font-serif italic mb-4 leading-relaxed ${t.text}`}>"{aiQuote.text}"</p>
                                <div className="inline-block border-t pt-2 border-indigo-200 dark:border-indigo-800">
                                    <p className={`text-xs font-bold uppercase tracking-widest ${t.textSec}`}>{aiQuote.author}</p>
                                </div>
                            </div>
                        )}
                        <div className={`p-6 rounded-3xl border flex flex-col h-[600px] ${t.card} ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                            <div className="mb-6"><h3 className={`font-bold mb-1 flex items-center gap-2 ${t.text}`}><MessageSquare size={18} className="text-green-500" /> Community Insights</h3><p className={`text-xs ${t.textSec}`}>Share tips with {user.course} peers</p></div>
                            <div className="flex gap-2 mb-6"><input value={newPost} onChange={(e) => setNewPost(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePost()} placeholder="Type your insight..." className={`flex-1 bg-transparent border rounded-xl px-4 py-3 text-sm outline-none transition-all ${isDark ? 'border-white/10 focus:border-indigo-500 text-white' : 'border-slate-200 focus:border-indigo-500 text-slate-800'}`} /><button onClick={handlePost} className={`p-3 rounded-xl shadow-md transition-transform active:scale-95 ${t.primary}`} disabled={!newPost.trim()}><Send size={18} /></button></div>
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">{posts.length === 0 ? (<div className="h-full flex flex-col items-center justify-center opacity-50 text-center"><MessageSquare size={40} className={`mb-2 ${t.textSec}`} /><p className={`text-sm font-bold ${t.text}`}>No insights yet.</p></div>) : (posts.map(post => (<div key={post.id} className={`p-4 rounded-2xl border transition-all hover:shadow-sm ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm bg-gradient-to-br from-purple-500 to-indigo-500`}>{post.author[0].toUpperCase()}</div><div><p className={`text-sm font-bold ${t.text}`}>{post.author}</p><p className={`text-[10px] font-medium uppercase tracking-wider opacity-60 ${t.textSec}`}>{post.role}</p></div></div></div><p className={`text-sm mb-4 leading-relaxed ${t.textSec}`}>{post.content}</p><button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-xs font-bold transition-colors p-1 rounded-md ${post.liked ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}><Heart size={16} fill={post.liked ? "currentColor" : "none"} /> <span>{post.likes > 0 ? post.likes : 'Like'}</span></button></div>)))}</div>
                        </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'report' && (<div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-5">{!report ? (<div className={`p-12 text-center rounded-[3rem] border-2 border-dashed transition-all hover:border-indigo-300 ${isDark ? 'border-gray-800 hover:bg-white/5' : 'border-gray-200 hover:bg-slate-50'}`}><FileText size={64} className={`mx-auto mb-6 opacity-20 ${t.textSec}`} /><h3 className={`text-2xl font-bold mb-2 ${t.text}`}>Generate Your Monthly Report</h3><p className={`text-sm mb-8 max-w-md mx-auto ${t.textSec}`}>AI analysis of your grades, quiz performance, and skills to summarize your progress.</p><button onClick={generateReport} disabled={loadingReport} className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-transform active:scale-95 flex items-center gap-3 mx-auto ${t.primary} ${loadingReport ? 'opacity-70 cursor-not-allowed' : ''}`}>{loadingReport ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}{loadingReport ? "Analyzing Data..." : "Generate Report"}</button></div>) : (<div className={`p-10 rounded-[2.5rem] space-y-10 shadow-2xl relative overflow-hidden ${t.card}`}><div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full`}></div><div><h3 className={`text-3xl font-black mb-4 ${t.text}`}>Executive Summary</h3><p className={`leading-relaxed text-lg ${t.textSec}`}>{report.summary}</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className={`p-6 rounded-3xl border ${isDark ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50/50 border-green-100'}`}><h4 className="font-bold text-lg text-green-600 dark:text-green-400 mb-4 flex items-center gap-2"><CheckCircle size={20} /> Key Strengths</h4><ul className="space-y-3">{report.strengths.map((s, i) => (<li key={i} className="flex items-start gap-2 text-sm font-medium text-green-800 dark:text-green-200"><Check size={16} className="mt-0.5 shrink-0 opacity-60" /> {s}</li>))}</ul></div><div className={`p-6 rounded-3xl border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50/50 border-red-100'}`}><h4 className="font-bold text-lg text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><AlertCircle size={20} /> Focus Areas</h4><ul className="space-y-3">{report.weaknesses.map((w, i) => (<li key={i} className="flex items-start gap-2 text-sm font-medium text-red-800 dark:text-red-200"><X size={16} className="mt-0.5 shrink-0 opacity-60" /> {w}</li>))}</ul></div></div><div><h4 className={`font-bold text-xl mb-6 flex items-center gap-2 ${t.text}`}><Target size={20} className={t.accentText} /> 3-Step Action Plan</h4><div className="space-y-4">{report.plan.map((step, i) => (<div key={i} className={`flex gap-4 items-center p-5 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}><div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm ${t.primary}`}>{i + 1}</div><p className={`text-base font-medium leading-snug ${t.text}`}>{step}</p></div>))}</div></div><button onClick={() => setReport(null)} className={`mx-auto block mt-8 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity ${t.textSec}`}>Generate New Report</button></div>)}</div>)}
        </div>
    );
};
// =================================================================================
//  7. ULTIMATE CV ARCHITECT (CRASH-PROOF AI)
// =================================================================================

// --- Helper: Safe Text (Prevents Object Crash) ---
const safeText = (val) => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    // If AI returns an object (like the error you saw), try to find a text field or stringify it
    if (typeof val === 'object') {
        return val.objective || val.summary || val.description || JSON.stringify(val);
    }
    return String(val);
};



// --- Helpers: Input Fields ---
const InputField = ({ label, value, onChange, placeholder, isDark, t }) => (
    <div className="mb-4">
        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${t.textSec}`}>{label}</label>
        <input
            value={safeText(value)}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full p-3 rounded-xl border outline-none font-medium transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
        />
    </div>
);

const TextAreaField = ({ label, value, onChange, placeholder, isDark, t }) => (
    <div className="mb-4">
        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${t.textSec}`}>{label}</label>
        <textarea
            value={safeText(value)}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full p-3 h-24 rounded-xl border outline-none font-medium text-sm resize-none transition-all ${isDark ? 'bg-white/5 border-white/10 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`}
        />
    </div>
);



const CVBuilderSection = ({ t, isDark, user }) => {

    // --- State Management ---
    const defaultResumeData = {
        fullName: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        summary: "",

        education: [
            {
                school: "",
                degree: "",
                year: "",
                grade: ""
            }
        ],

        experience: [],

        projects: [
            {
                title: "",
                tech: "",
                desc: ""
            }
        ],

        certifications: [],
        achievements: [],

        skills: {
            languages: "",
            frameworks: "",
            tools: "",
            spoken: ""
        }
    };

    const [resumeData, setResumeData] = useState(defaultResumeData);

    const [cvList, setCvList] = useState([]);

    const [currentCVId, setCurrentCVId] = useState(null);

    const [activeTemplate, setActiveTemplate] = useState('harvard');
    const [atsResult, setAtsResult] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeSection, setActiveSection] = useState('personal');


    // =========================
    // Load CV List
    // =========================

    useEffect(() => {

        const loadCVList = async () => {

            try {

                if (!user?._id) return;

                const res = await axios.get(
                    `http://localhost:5000/api/cv/user/${user._id}`
                );

                setCvList(res.data || []);

            }
            catch (err) {

                console.error("Failed to load CV list", err);

            }

        };

        loadCVList();

    }, [user]);


    // =========================
    // Load Single CV
    // =========================

    const loadCV = async (cvId) => {

        try {

            const res = await axios.get(
                `http://localhost:5000/api/cv/${cvId}`
            );

            if (!res.data?.resumeData) return;

            const data = res.data.resumeData;

            setResumeData({

                fullName: data.fullName || "",
                email: data.email || "",
                phone: data.phone || "",
                linkedin: data.linkedin || "",
                github: data.github || "",
                summary: data.summary || "",

                education: data.education || [
                    { school: "", degree: "", year: "", grade: "" }
                ],

                experience: data.experience || [],

                projects: data.projects || [
                    { title: "", tech: "", desc: "" }
                ],

                certifications: data.certifications || [],
                achievements: data.achievements || [],

                skills: {
                    languages: data.skills?.languages || "",
                    frameworks: data.skills?.frameworks || "",
                    tools: data.skills?.tools || "",
                    spoken: data.skills?.spoken || ""
                }

            });

        }
        catch (err) {

            console.error("Failed to load CV", err);

        }

    };


    // =========================
    // Save CV (Create OR Update)
    // =========================

    const handleSaveCV = async () => {

        try {

            if (!user?._id) {

                alert("User not loaded yet");
                return;

            }

            if (currentCVId) {

                await axios.put(

                    `http://localhost:5000/api/cv/${currentCVId}`,

                    {
                        resumeData
                    }

                );

            }
            else {

                const res = await axios.post(

                    "http://localhost:5000/api/cv",

                    {
                        userId: user._id,
                        title: resumeData.fullName || "Untitled CV",
                        resumeData
                    }

                );

                setCurrentCVId(res.data._id);

            }

            alert("CV saved successfully");

            // reload list

            const list = await axios.get(
                `http://localhost:5000/api/cv/user/${user._id}`
            );

            setCvList(list.data || []);

        }
        catch (err) {

            console.error(err);
            alert("Save failed");

        }

    };


    // =========================
    // Handlers
    // =========================

    const handleArrayChange = (section, index, field, value) => {

        const updated = [...resumeData[section]];

        updated[index][field] = value;

        setResumeData({
            ...resumeData,
            [section]: updated
        });

    };


    const addItem = (section, template) => {

        setResumeData({

            ...resumeData,

            [section]: [
                ...resumeData[section],
                template
            ]

        });

    };


    const removeItem = (section, index) => {

        const updated = resumeData[section].filter(

            (_, i) => i !== index

        );

        setResumeData({

            ...resumeData,

            [section]: updated

        });

    };


    // =========================
    // AI Autofill
    // =========================

    const handleAIAutofill = async () => {

        setIsGenerating(true);

        try {

            const prompt = `Act as a professional resume writer for a ${user?.course || 'student'}. 
Generate JSON:
{
"summary":"text",
"skills":{"languages":"","frameworks":"","tools":"","spoken":""},
"projects":[{"title":"","tech":"","desc":""}],
"achievements":[""]
}`;

            const res = await axios.post(

                'http://localhost:5000/api/ai-chat',

                {
                    prompt,
                    systemPrompt: "JSON Resume Writer"
                }

            );

            const jsonMatch = res.data.reply.match(/\{[\s\S]*\}/);

            const data = JSON.parse(

                jsonMatch
                    ? jsonMatch[0]
                    : res.data.reply

            );

            setResumeData(prev => ({

                ...prev,

                summary:
                    typeof data.summary === "string"
                        ? data.summary
                        : prev.summary,

                skills: {
                    ...prev.skills,
                    ...(data.skills || {})
                },

                projects:
                    data.projects?.length
                        ? data.projects
                        : prev.projects,

                achievements:
                    data.achievements?.length
                        ? data.achievements
                        : prev.achievements

            }));

        }
        catch (err) {

            console.error(err);
            alert("AI failed");

        }

        setIsGenerating(false);

    };


    // =========================
    // ATS Scan
    // =========================

    const handleATSScan = async () => {

        setIsScanning(true);

        try {

            const prompt = `Analyze this resume JSON and return score JSON: ${JSON.stringify(resumeData)}`;

            const res = await axios.post(

                "http://localhost:5000/api/ai-chat",

                {
                    prompt,
                    systemPrompt: "ATS Scanner"
                }

            );

            const jsonMatch = res.data.reply.match(/\{[\s\S]*\}/);

            const data = JSON.parse(

                jsonMatch
                    ? jsonMatch[0]
                    : res.data.reply

            );

            setAtsResult(data);

        }
        catch (err) {

            alert("ATS failed");

        }

        setIsScanning(false);

    };


    // =========================
    // Download PDF
    // =========================

    const handleDownloadPDF = async () => {

        setIsDownloading(true);

        try {

            const input = document.getElementById("resume-preview");

            const canvas = await html2canvas(input, { scale: 2 });

            const img = canvas.toDataURL("image/png");

            const pdf = new jsPDF();

            pdf.addImage(img, "PNG", 0, 0);

            pdf.save("Resume.pdf");

        }
        catch (err) {

            alert("Download failed");

        }

        setIsDownloading(false);

    };



    return (
        <div className="animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div>
                    <h2 className={`text-3xl font-bold flex items-center gap-3 ${t.text}`}>
                        <FileText className={t.accentText} size={32} />
                        Ultimate CV Architect
                    </h2>
                    <p className={`mt-1 ${t.textSec}`}>ATS-optimized templates designed for students.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSaveCV}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all active:scale-95`}
                    >
                        <Save size={16} />
                        Save CV
                    </button>
                    <button onClick={handleAIAutofill} disabled={isGenerating} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95`}>
                        {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {isGenerating ? "AI Auto-Fill" : "Auto-Fill Data"}
                    </button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm transition-all ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-100'}`}>
                        {isDownloading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                        {isDownloading ? "Saving..." : "Download PDF"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* --- LEFT: EDITOR --- */}
                <div className="xl:col-span-5 space-y-6">

                    {/* SAVED CVS LIST */}
                    <div className={`p-6 rounded-3xl border shadow-sm ${t.card}`}>

                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${t.textSec}`}>
                            Your Saved CVs
                        </h3>

                        {cvList.length === 0 ? (
                            <p className="text-sm opacity-60">No saved CVs yet</p>
                        ) : (
                            <div className="space-y-2">

                                {cvList.map(cv => (

                                    <button
                                        key={cv._id}
                                        onClick={() => loadCV(cv._id)}
                                        className={`w-full text-left px-4 py-2 rounded-xl border text-sm font-medium transition-all
                        ${isDark
                                                ? 'border-white/10 hover:bg-white/5'
                                                : 'border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        {cv.title}

                                    </button>

                                ))}

                            </div>
                        )}

                    </div>


                    {/* Template Selection */}
                    <div className={`p-6 rounded-3xl border shadow-sm ${t.card}`}>
                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${t.textSec}`}><LayoutTemplate size={14} /> Select Template</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[{ id: 'harvard', label: 'Harvard (ATS)' }, { id: 'modern', label: 'Modern Clean' }, { id: 'tech', label: 'Tech Minimal' }].map((temp) => (
                                <button key={temp.id} onClick={() => setActiveTemplate(temp.id)} className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${activeTemplate === temp.id ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' : 'border-transparent bg-gray-100 dark:bg-white/5 opacity-70 hover:opacity-100'}`}>
                                    {temp.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accordion Editor */}
                    <div className={`rounded-3xl border shadow-sm overflow-hidden ${t.card}`}>
                        {/* 1. Personal */}
                        <div className="border-b border-gray-100 dark:border-gray-800">
                            <button onClick={() => setActiveSection('personal')} className="w-full flex items-center justify-between p-4 font-bold text-left hover:bg-gray-50 dark:hover:bg-white/5"><span className="flex items-center gap-2 text-sm"><User size={16} /> Personal Info</span>{activeSection === 'personal' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                            {activeSection === 'personal' && (
                                <div className="p-5 pt-0 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                    <div className="col-span-2"><InputField label="Full Name" value={resumeData.fullName} onChange={e => setResumeData({ ...resumeData, fullName: e.target.value })} isDark={isDark} t={t} /></div>
                                    <InputField label="Email" value={resumeData.email} onChange={e => setResumeData({ ...resumeData, email: e.target.value })} isDark={isDark} t={t} />
                                    <InputField label="Phone" value={resumeData.phone} onChange={e => setResumeData({ ...resumeData, phone: e.target.value })} isDark={isDark} t={t} />
                                    <div className="col-span-2"><InputField label="Links (LinkedIn / GitHub)" value={resumeData.linkedin} onChange={e => setResumeData({ ...resumeData, linkedin: e.target.value })} isDark={isDark} t={t} /></div>
                                    <div className="col-span-2"><TextAreaField label="Professional Summary" value={resumeData.summary} onChange={e => setResumeData({ ...resumeData, summary: e.target.value })} isDark={isDark} t={t} /></div>
                                </div>
                            )}
                        </div>

                        {/* 2. Education */}
                        <div className="border-b border-gray-100 dark:border-gray-800">
                            <button onClick={() => setActiveSection('education')} className="w-full flex items-center justify-between p-4 font-bold text-left hover:bg-gray-50 dark:hover:bg-white/5"><span className="flex items-center gap-2 text-sm"><GraduationCap size={16} /> Education</span>{activeSection === 'education' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                            {activeSection === 'education' && (
                                <div className="p-5 pt-0">
                                    {resumeData.education.map((edu, i) => (
                                        <div key={i} className="mb-4 pb-4 border-b border-dashed border-gray-200 dark:border-gray-700 last:border-0 relative">
                                            <button onClick={() => removeItem('education', i)} className="absolute top-0 right-0 text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                                            <InputField label="School / University" value={edu.school} onChange={e => handleArrayChange('education', i, 'school', e.target.value)} isDark={isDark} t={t} />
                                            <InputField label="Degree / Class" value={edu.degree} onChange={e => handleArrayChange('education', i, 'degree', e.target.value)} isDark={isDark} t={t} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Year" value={edu.year} onChange={e => handleArrayChange('education', i, 'year', e.target.value)} isDark={isDark} t={t} />
                                                <InputField label="Grade / CGPA" value={edu.grade} onChange={e => handleArrayChange('education', i, 'grade', e.target.value)} isDark={isDark} t={t} />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => addItem('education', { school: "", degree: "", year: "", grade: "" })} className="w-full py-2 border border-dashed rounded-xl text-xs font-bold opacity-60 hover:opacity-100">+ Add Education</button>
                                </div>
                            )}
                        </div>

                        {/* 3. Experience */}
                        <div className="border-b border-gray-100 dark:border-gray-800">
                            <button onClick={() => setActiveSection('experience')} className="w-full flex items-center justify-between p-4 font-bold text-left hover:bg-gray-50 dark:hover:bg-white/5"><span className="flex items-center gap-2 text-sm"><Briefcase size={16} /> Experience</span>{activeSection === 'experience' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                            {activeSection === 'experience' && (
                                <div className="p-5 pt-0">
                                    {resumeData.experience.map((exp, i) => (
                                        <div key={i} className="relative mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <button onClick={() => removeItem('experience', i)} className="absolute top-2 right-2 text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                                            <InputField label="Role" value={exp.role} onChange={e => handleArrayChange('experience', i, 'role', e.target.value)} isDark={isDark} t={t} />
                                            <InputField label="Company" value={exp.company} onChange={e => handleArrayChange('experience', i, 'company', e.target.value)} isDark={isDark} t={t} />
                                            <InputField label="Duration" value={exp.duration} onChange={e => handleArrayChange('experience', i, 'duration', e.target.value)} isDark={isDark} t={t} />
                                            <TextAreaField label="Description" value={exp.desc} onChange={e => handleArrayChange('experience', i, 'desc', e.target.value)} isDark={isDark} t={t} />
                                        </div>
                                    ))}
                                    <button onClick={() => addItem('experience', { role: "", company: "", duration: "", desc: "" })} className="w-full py-2 border border-dashed rounded-xl text-xs font-bold opacity-60 hover:opacity-100">+ Add Experience</button>
                                </div>
                            )}
                        </div>

                        {/* 4. Projects */}
                        <div className="border-b border-gray-100 dark:border-gray-800">
                            <button onClick={() => setActiveSection('projects')} className="w-full flex items-center justify-between p-4 font-bold text-left hover:bg-gray-50 dark:hover:bg-white/5"><span className="flex items-center gap-2 text-sm"><Cpu size={16} /> Projects</span>{activeSection === 'projects' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                            {activeSection === 'projects' && (
                                <div className="p-5 pt-0">
                                    {resumeData.projects.map((proj, i) => (
                                        <div key={i} className="relative mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <button onClick={() => removeItem('projects', i)} className="absolute top-2 right-2 text-red-400 hover:text-red-500"><Trash2 size={14} /></button>
                                            <InputField label="Project Title" value={proj.title} onChange={e => handleArrayChange('projects', i, 'title', e.target.value)} isDark={isDark} t={t} />
                                            <InputField label="Tech Stack" value={proj.tech} onChange={e => handleArrayChange('projects', i, 'tech', e.target.value)} isDark={isDark} t={t} />
                                            <TextAreaField label="Description" value={proj.desc} onChange={e => handleArrayChange('projects', i, 'desc', e.target.value)} isDark={isDark} t={t} />
                                        </div>
                                    ))}
                                    <button onClick={() => addItem('projects', { title: "", tech: "", desc: "" })} className="w-full py-2 border border-dashed rounded-xl text-xs font-bold opacity-60 hover:opacity-100">+ Add Project</button>
                                </div>
                            )}
                        </div>

                        {/* 5. Skills */}
                        <div className="">
                            <button onClick={() => setActiveSection('skills')} className="w-full flex items-center justify-between p-4 font-bold text-left hover:bg-gray-50 dark:hover:bg-white/5"><span className="flex items-center gap-2 text-sm"><Activity size={16} /> Skills & More</span>{activeSection === 'skills' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                            {activeSection === 'skills' && (
                                <div className="p-5 pt-0 space-y-4">
                                    <InputField label="Programming Languages" value={resumeData.skills?.languages} onChange={e => setResumeData({ ...resumeData, skills: { ...resumeData.skills, languages: e.target.value } })} isDark={isDark} t={t} />
                                    <InputField label="Frameworks" value={resumeData.skills?.frameworks} onChange={e => setResumeData({ ...resumeData, skills: { ...resumeData.skills, frameworks: e.target.value } })} isDark={isDark} t={t} />
                                    <InputField label="Tools" value={resumeData.skills?.tools} onChange={e => setResumeData({ ...resumeData, skills: { ...resumeData.skills, tools: e.target.value } })} isDark={isDark} t={t} />
                                    <InputField label="Spoken Languages" value={resumeData.skills.spoken} onChange={e => setResumeData({ ...resumeData, skills: { ...resumeData.skills, spoken: e.target.value } })} isDark={isDark} t={t} />

                                    <h4 className={`text-xs font-bold uppercase mt-6 mb-2 ${t.textSec}`}>Certifications & Awards</h4>
                                    {resumeData.achievements.map((ach, i) => (
                                        <div key={i} className="flex gap-2 mb-2">
                                            <input value={safeText(ach)} onChange={e => {
                                                const updated = [...resumeData.achievements];
                                                updated[i] = e.target.value;
                                                setResumeData({ ...resumeData, achievements: updated });
                                            }} className={`w-full p-2 border rounded-lg text-sm bg-transparent ${isDark ? 'border-white/10' : 'border-gray-200'}`} placeholder="Item" />
                                            <button onClick={() => removeItem('achievements', i)}><Trash2 size={14} className="text-red-400" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addItem('achievements', "")} className="text-xs font-bold text-indigo-500">+ Add Item</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ATS Scanner */}
                    <div className={`p-6 rounded-3xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className={`font-bold text-lg flex items-center gap-2 ${t.text}`}><CheckCircle className="text-green-500" size={20} /> ATS Score</h3>
                            {atsResult && <div className={`px-3 py-1 rounded-full text-xs font-black ${atsResult.score > 80 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>{atsResult.score}/100</div>}
                        </div>
                        {!atsResult ? (
                            <button onClick={handleATSScan} disabled={isScanning} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all">{isScanning ? "Scanning..." : "Check Resume Score"}</button>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-red-500 uppercase">Missing Keywords:</div>
                                <div className="flex flex-wrap gap-2">{atsResult.missingKeywords.map((k, i) => <span key={i} className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs">{k}</span>)}</div>
                                <button onClick={handleATSScan} className="text-xs underline opacity-60 hover:opacity-100 mt-2">Re-scan</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT: PREVIEW (A4 PAGE) --- */}
                <div className="xl:col-span-7 flex justify-center">
                    <div id="resume-preview" className={`w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl p-[15mm] md:p-[20mm] origin-top scale-[0.8] md:scale-100 transition-all ${activeTemplate === 'harvard' ? 'font-serif leading-snug' : activeTemplate === 'tech' ? 'font-mono text-sm' : 'font-sans'}`}>
                        {/* Header */}
                        <div className={`mb-6 border-b-2 border-black pb-4 ${activeTemplate === 'modern' ? 'text-center' : ''}`}>
                            <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{safeText(resumeData.fullName) || "YOUR NAME"}</h1>
                            <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 ${activeTemplate === 'modern' ? 'justify-center' : ''}`}>
                                <span>{safeText(resumeData.email)}</span>
                                {resumeData.phone && <span>• {safeText(resumeData.phone)}</span>}
                                {resumeData.linkedin && <span>• {safeText(resumeData.linkedin).replace('https://', '')}</span>}
                            </div>
                        </div>

                        {/* Summary */}
                        {resumeData.summary && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2">Professional Summary</h3>
                                <p className="text-sm leading-relaxed">{safeText(resumeData.summary)}</p>
                            </div>
                        )}

                        {/* Education */}
                        <div className="mb-5">
                            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2">Education</h3>
                            {resumeData.education.map((edu, i) => (
                                <div key={i} className="mb-2 flex justify-between">
                                    <div>
                                        <div className="font-bold">{safeText(edu.school)}</div>
                                        <div className="italic text-sm">{safeText(edu.degree)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-sm">{safeText(edu.year)}</div>
                                        <div className="text-sm">{safeText(edu.grade)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Skills */}
                        <div className="mb-5">
                            <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2">Technical Skills</h3>
                            <div className="text-sm space-y-1">
                                {resumeData.skills.languages && <div><span className="font-bold">Languages:</span> {safeText(resumeData.skills.languages)}</div>}
                                {resumeData.skills.frameworks && <div><span className="font-bold">Frameworks:</span> {safeText(resumeData.skills.frameworks)}</div>}
                                {resumeData.skills.tools && <div><span className="font-bold">Developer Tools:</span> {safeText(resumeData.skills.tools)}</div>}
                                {resumeData.skills.spoken && <div><span className="font-bold">Spoken Languages:</span> {safeText(resumeData.skills.spoken)}</div>}
                            </div>
                        </div>

                        {/* Experience */}
                        {resumeData.experience.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2">Experience</h3>
                                {resumeData.experience.map((exp, i) => (
                                    <div key={i} className="mb-4">
                                        <div className="flex justify-between font-bold">
                                            <span>{safeText(exp.role)} | {safeText(exp.company)}</span>
                                            <span>{safeText(exp.duration)}</span>
                                        </div>
                                        <p className="text-sm mt-1 whitespace-pre-line text-gray-800">{safeText(exp.desc)}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Projects */}
                        {resumeData.projects.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2">Projects</h3>
                                {resumeData.projects.map((proj, i) => (
                                    <div key={i} className="mb-3">
                                        <div className="font-bold flex gap-2 items-center">
                                            {safeText(proj.title)}
                                            {proj.tech && <span className="text-xs font-normal border border-gray-400 rounded px-1">{safeText(proj.tech)}</span>}
                                        </div>
                                        <p className="text-sm mt-1 text-gray-800">{safeText(proj.desc)}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Certifications & Achievements */}
                        {(resumeData.certifications.length > 0 || resumeData.achievements.length > 0) && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-2">Certifications & Awards</h3>
                                <ul className="list-disc list-inside text-sm">
                                    {resumeData.certifications.map((c, i) => <li key={`c-${i}`}>{safeText(c)}</li>)}
                                    {resumeData.achievements.map((a, i) => <li key={`a-${i}`}>{safeText(a)}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================================================================================
//  6. SETTINGS SECTION (PROFESSIONAL STUDENT PROFILE)
// =================================================================================
const SettingsSection = ({ t, isDark, user, onLogout, onUpdateUser }) => {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Default to 'male' if not specified, or try to guess from avatar URL
    const initialGender = user?.avatar?.includes('Jocelyn') ? 'female' : 'male';

    const [formData, setFormData] = useState({
        name: user?.name || "",
        headline: user?.headline || "",
        email: user?.email || "",
        university: user?.university || "",
        gender: initialGender,
        avatar: user?.avatar || ""   // ADD THIS LINE
    });

    // Avatars for the toggle
    const avatars = {
        male: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=e5e7eb",
        female: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn&backgroundColor=e5e7eb"
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenderSelect = (gender) => {
        if (!editing) return; // Prevent changing unless in edit mode
        setFormData({ ...formData, gender: gender });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // We save the selected avatar URL directly to the user profile
            const payload = {
                ...formData,
                avatar: formData.avatar || avatars[formData.gender]
            };
            const res = await axios.put(`http://localhost:5000/api/user/${user._id}`, payload);

            if (onUpdateUser) onUpdateUser(res.data);
            setEditing(false);
            alert("Student profile updated successfully!");
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update profile.");
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        const confirmStr = `delete-${user.name.split(' ')[0]}`.toLowerCase();
        const input = window.prompt(`DANGER: This will permanently delete your account and all roadmap progress.\n\nType "${confirmStr}" to confirm:`);

        if (input === confirmStr) {
            try {
                await axios.delete(`http://localhost:5000/api/user/${user._id}`);
                onLogout();
            } catch (error) {
                alert("Failed to delete account.");
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className={`text-3xl font-bold flex items-center gap-3 ${t.text}`}>
                        <User className={t.accentText} size={32} />
                        Student Profile
                    </h2>
                    <p className={`mt-1 ${t.textSec}`}>Manage your academic identity and account security.</p>
                </div>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100'}`}
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setEditing(false); setFormData({ ...formData, name: user.name, gender: initialGender }); }}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm ${t.textSec} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="grid gap-8">
                {/* 1. ACADEMIC ID CARD */}
                <div className={`p-8 md:p-10 rounded-[2.5rem] border shadow-sm relative overflow-hidden transition-all ${t.card}`}>
                    <div className="flex flex-col lg:flex-row gap-10 items-start">

                        {/* Avatar Column */}
                        <div className="flex flex-col items-center gap-6 w-full lg:w-auto shrink-0">
                            <div className={`relative w-48 h-48 rounded-full border-[6px] shadow-2xl overflow-hidden group ${isDark ? 'border-indigo-500/20 bg-slate-800' : 'border-white bg-slate-100'}`}>

                                <img
                                    src={formData.avatar || avatars[formData.gender]}
                                    alt="Student Avatar"
                                    className="w-full h-full object-cover"
                                />

                                {/* Professional overlay */}
                                {editing && (
                                    <>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <span className="text-white font-semibold text-sm tracking-wide">
                                                Change Profile Photo
                                            </span>
                                        </div>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                try {
                                                    const CLOUD_NAME = "dknkcytnr";
                                                    const UPLOAD_PRESET = "avatar";

                                                    const formDataUpload = new FormData();
                                                    formDataUpload.append("file", file);
                                                    formDataUpload.append("upload_preset", UPLOAD_PRESET);

                                                    const res = await axios.post(
                                                        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                                                        formDataUpload
                                                    );

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        avatar: res.data.secure_url
                                                    }));

                                                } catch (err) {
                                                    alert("Image upload failed");
                                                }
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="text-center">
                                <h3 className={`text-xl font-black ${t.text}`}>{user.name}</h3>
                                <p className={`text-sm font-medium ${t.textSec}`}>{user.course} Student</p>
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${t.textSec}`}>
                                    <User size={14} /> Full Name
                                </label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    className={`w-full p-4 rounded-2xl font-bold border outline-none transition-all ${editing ? (isDark ? 'bg-black/20 border-indigo-500/50 focus:border-indigo-500' : 'bg-slate-50 border-indigo-200 focus:border-indigo-500') : 'bg-transparent border-transparent px-0'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${t.textSec}`}>
                                    <Briefcase size={14} /> Future Goal / Headline
                                </label>
                                <input
                                    name="headline"
                                    value={formData.headline}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="e.g. Aspiring Full Stack Dev"
                                    className={`w-full p-4 rounded-2xl font-bold border outline-none transition-all ${editing ? (isDark ? 'bg-black/20 border-indigo-500/50 focus:border-indigo-500' : 'bg-slate-50 border-indigo-200 focus:border-indigo-500') : 'bg-transparent border-transparent px-0'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${t.textSec}`}>
                                    <Mail size={14} /> Student Email
                                </label>
                                <div className={`w-full p-4 rounded-2xl font-medium border border-dashed flex items-center justify-between opacity-70 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-50'}`}>
                                    <span>{formData.email}</span>
                                    <Shield size={14} className="text-green-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${t.textSec}`}>
                                    <GraduationCap size={14} /> University / College
                                </label>
                                <input
                                    name="university"
                                    value={formData.university}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    className={`w-full p-4 rounded-2xl font-bold border outline-none transition-all ${editing ? (isDark ? 'bg-black/20 border-indigo-500/50 focus:border-indigo-500' : 'bg-slate-50 border-indigo-200 focus:border-indigo-500') : 'bg-transparent border-transparent px-0'}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. DANGER ZONE (Distinct & Clean) */}
                <div className={`mt-4 p-1 rounded-[2rem] border border-red-500/10 ${isDark ? 'bg-red-500/5' : 'bg-red-50/50'}`}>
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400`}>
                                <LogOut size={24} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sign Out</h3>
                                <p className={`text-sm opacity-60 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Securely log out of your account on this device.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                onClick={onLogout}
                                className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all border shadow-sm hover:shadow-md ${isDark ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-white text-slate-700 hover:text-red-600'}`}
                            >
                                Sign Out
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =================================================================================
//  MAIN DASHBOARD COMPONENT
// =================================================================================
const Dashboard = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        // 1. Remove the token and user data from storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // 2. Redirect the user to the login page
        navigate('/login');
    };

    const handleUserUpdate = (updatedUser) => {
        // Simple way to refresh data if they change their name
        window.location.reload();
    };

    // --- AUTH & STATE ---
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    // --- SYNC DATA ON MOUNT ---
    useEffect(() => {
        const fetchLatestUser = async () => {

            if (!user?._id) return;

            const token = localStorage.getItem('token');

            try {

                // STEP 1: get latest user
                const { data } = await axios.get(
                    `http://localhost:5000/api/user/${user._id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                let mergedUser = { ...user, ...data };

                // STEP 2: fetch syllabus (THIS IS THE IMPORTANT PART)
                const syllabusRes = await axios.get(
                    `http://localhost:5000/api/roadmap/syllabus/${user._id}`
                );

                mergedUser.syllabus = syllabusRes.data;

                // STEP 3: save to state and localStorage
                setUser(mergedUser);

                localStorage.setItem('user', JSON.stringify(mergedUser));

            }
            catch (e) {
                console.error("Sync error", e);
            }
        };

        fetchLatestUser();

    }, []);

    useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

    // --- THEME ENGINE ---
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'professional');
    const isDark = theme === 'dark' || theme === 'cyber';
    const isGhibli = theme === 'ghibli';

    useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

    const toggleTheme = () => {
        const modes = ['professional', 'dark', 'pookie', 'cyber', 'ghibli'];
        setTheme(modes[(modes.indexOf(theme) + 1) % modes.length]);
    };

    // --- STYLES (ULTIMATE PREMIUM UPGRADE & HIGH CONTRAST) ---
    const styles = {
        professional: {
            // High-end, executive SaaS. Crisp, ultra-clean, subtle depth.
            bg: "bg-[#F8FAFC]", // Slightly cooler gray-white
            text: "text-[#0F172A] font-semibold", // Much darker, bolder slate for readability
            textSec: "text-[#475569] font-medium", // Darker secondary text
            // Multi-layered shadow + subtle gradient background + crisp ring border
            card: "bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-2xl border border-slate-200/50 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.1),0_2px_6px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/5 rounded-[1.5rem]",
            sidebar: "bg-gradient-to-b from-white/90 to-slate-50/80 backdrop-blur-3xl border-r border-slate-200/50 shadow-[8px_0_32px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 rounded-r-[2rem]",
            navBtn: "text-slate-600 font-semibold hover:bg-slate-100/80 hover:text-indigo-700 transition-all duration-300",
            navBtnActive: "bg-slate-900 text-white shadow-lg shadow-slate-900/20 ring-1 ring-slate-700 font-bold relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-tr after:from-white/10 after:to-transparent after:opacity-30",
            // Premium button with subtle shine effect on hover
            primary: "bg-[#0F172A] text-white hover:bg-[#1E293B] hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-[2px] transition-all shadow-md shadow-slate-900/10 rounded-xl font-bold relative overflow-hidden group/btn before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover/btn:before:animate-[shine_1.5s_ease-in-out]",
            accentText: "text-indigo-700 font-bold",
            input: "bg-white border-2 border-slate-200 text-[#0F172A] focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all rounded-xl shadow-sm font-medium",
            chartFill: "#6366f1", chartStroke: "#312e81",
            blob: "bg-slate-200/50 blur-3xl",
            font: "font-sans"
        },
        dark: {
            //Deep Space Luxury. Volumetric lighting, rich blacks, electric blues.
            bg: "bg-[#030612] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#030612] to-[#030612]",
            text: "text-blue-50 font-medium",
            textSec: "text-blue-200/80",
            // Deep dark glass with bright blue rim lighting and volumetric shadow bloom
            card: "bg-[#0A0E24]/80 backdrop-blur-3xl border border-blue-500/30 shadow-[0_0_50px_-15px_rgba(59,130,246,0.5)] ring-1 ring-blue-400/30 shadow-[inset_0_1px_4px_rgba(59,130,246,0.2)] rounded-[1.5rem]",
            sidebar: "bg-[#070B1E]/80 backdrop-blur-3xl border-r border-blue-500/30 shadow-[15px_0_50px_-20px_rgba(59,130,246,0.4)] ring-1 ring-blue-400/30 rounded-r-[2rem]",
            navBtn: "text-blue-300/70 font-semibold hover:bg-blue-500/20 hover:text-blue-100 transition-all duration-300",
            navBtnActive: "bg-blue-600 text-white shadow-[0_0_35px_-5px_rgba(59,130,246,0.8)] border border-blue-400/50 font-bold text-shadow-sm",
            primary: "bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:shadow-[0_0_40px_-10px_rgba(59,130,246,1)] hover:brightness-125 transition-all shadow-[0_0_25px_-10px_rgba(59,130,246,0.7)] border border-blue-400/50 rounded-xl font-bold",
            accentText: "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.8)] font-bold",
            input: "bg-[#05081A]/90 border border-blue-800/60 text-blue-50 focus:border-blue-500 focus:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all rounded-xl",
            chartFill: "#3b82f6", chartStroke: "#60a5fa",
            blob: "bg-blue-800/30 blur-[120px]",
            font: "font-sans"
        },
        pookie: {
            // Cloud-Soft Luxury. Diffused light, pillowy textures, clearer text.
            bg: "bg-[#FFF0F5] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-100/40 via-[#FFF0F5] to-[#FFF0F5]",
            text: "text-[#831843] font-bold", // Darker raspberry color for contrast
            textSec: "text-[#BE185D] font-semibold", // Darker pink for secondary
            // Pillowy frosted glass with colored shadows
            card: "bg-white/60 backdrop-blur-3xl border-[2px] border-pink-200/80 shadow-[0_16px_40px_-12px_rgba(249,168,212,0.4),inset_0_2px_6px_rgba(255,255,255,0.8)] ring-2 ring-pink-50/50 rounded-[2.5rem]",
            sidebar: "bg-white/50 backdrop-blur-3xl border-r-[2px] border-pink-200/80 shadow-[12px_0_32px_-8px_rgba(249,168,212,0.3)] ring-2 ring-pink-50/50 rounded-r-[3rem]",
            navBtn: "text-[#DB2777] font-bold hover:bg-pink-100/60 hover:text-pink-700 transition-all hover:scale-105",
            navBtnActive: "bg-gradient-to-tr from-[#F472B6] to-[#F687B3] text-white shadow-lg shadow-pink-400/40 ring-4 ring-pink-100/80 font-black",
            primary: "bg-gradient-to-tr from-[#EC4899] to-[#F472B6] text-white hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-1 transition-all shadow-md shadow-pink-400/30 ring-4 ring-pink-200/80 rounded-2xl font-black",
            accentText: "text-[#DB2777] drop-shadow-sm font-black",
            input: "bg-white/70 border-[3px] border-pink-200/80 text-[#831843] focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60 rounded-2xl transition-all font-bold placeholder:text-pink-300",
            chartFill: "#f9a8d4", chartStroke: "#be185d",
            blob: "bg-pink-300/60 blur-3xl",
            font: "font-sans"
        },
        cyber: {
            // Radioactive Tech. Aggressive neon, digital noise, hard lines.
            bg: "bg-[#010201] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-90",
            text: "text-[#00FF9C] font-bold tracking-wide text-shadow-[0_0_4px_rgba(0,255,156,0.4)]",
            textSec: "text-[#008F57] font-semibold tracking-wider",
            // Intense neon glow, hard edges, digital scanline effect
            card: "bg-[#030A05]/95 backdrop-blur-md border-2 border-[#00FF9C]/60 shadow-[0_0_40px_-8px_rgba(0,255,156,0.5),inset_0_0_20px_rgba(0,255,156,0.1)] ring-1 ring-[#00FF9C]/30 clip-path-polygon rounded-none relative overflow-hidden after:absolute after:inset-0 after:bg-[linear-gradient(transparent_50%,rgba(0,255,156,0.1)_50%)] after:bg-[length:100%_4px] after:pointer-events-none",
            sidebar: "bg-[#020503]/95 backdrop-blur-xl border-r-2 border-[#00FF9C]/60 shadow-[15px_0_40px_-10px_rgba(0,255,156,0.4)] ring-1 ring-[#00FF9C]/30",
            navBtn: "text-[#008F57] hover:text-[#00FF9C] hover:bg-[#00FF9C]/10 tracking-widest font-mono uppercase transition-all font-bold",
            navBtnActive: "bg-[#00FF9C]/20 text-[#00FF9C] border-l-[6px] border-[#00FF9C] shadow-[0_0_30px_rgba(0,255,156,0.6)] font-mono font-black uppercase tracking-widest",
            primary: "bg-[#00331F] text-[#00FF9C] font-mono font-black hover:bg-[#004D2F] hover:shadow-[0_0_50px_rgba(0,255,156,1)] hover:text-white transition-all shadow-[0_0_30px_rgba(0,255,156,0.6)] border-2 border-[#00FF9C] rounded-none uppercase tracking-wider",
            accentText: "text-[#00FF9C] drop-shadow-[0_0_15px_rgba(0,255,156,1)] font-black",
            input: "bg-[#010302] border-2 border-[#00FF9C]/70 text-[#00FF9C] focus:border-[#00FF9C] focus:shadow-[0_0_30px_rgba(0,255,156,0.7)] rounded-none font-mono font-bold placeholder:text-[#004D2F]",
            chartFill: "#00FF9C", chartStroke: "#008F57",
            blob: "bg-[#00FF9C]/40 blur-[100px]",
            font: "font-mono"
        },
        ghibli: {
            // Illustrated Storybook. Hand-drawn feel, deep ink colors, warm texture.
            bg: "bg-[#FFFBE8] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]",
            text: "text-[#3C3026] font-bold", // Very dark brown, almost black ink
            textSec: "text-[#7C7063] font-semibold", // Deep sepia brown
            // Thick, hand-drawn borders with deep, solid offset shadows like paint on paper
            card: "bg-[#FDFDF6] border-[4px] border-[#D9CBB1] shadow-[8px_8px_0px_0px_rgba(140,120,100,0.3),inset_0_0_40px_rgba(230,210,180,0.2)] rounded-[3rem] relative overflow-hidden",
            sidebar: "bg-[#F8F1E0]/95 backdrop-blur-sm border-r-[4px] border-[#D9CBB1] shadow-[8px_0px_0px_0px_rgba(140,120,100,0.25)] rounded-r-[3rem]",
            navBtn: "text-[#7C7063] font-bold hover:bg-[#EFE6D5]/60 hover:text-[#4A7C26] rounded-2xl transition-all duration-300",
            navBtnActive: "bg-[#DCECC9] text-[#3E6B1F] border-[4px] border-[#9BC978] rounded-3xl shadow-[6px_6px_0px_0px_rgba(155,201,120,0.6)] font-black",
            // Button looks like a physical painted object that presses down
            primary: "bg-[#6A9C43] text-[#FDFDF6] hover:bg-[#578336] hover:shadow-[4px_4px_0px_0px_rgba(67,112,36,0.3)] hover:-translate-y-0.5 transition-all shadow-[8px_8px_0px_0px_rgba(67,112,36,0.3)] border-b-[6px] border-[#3E6B1F] active:border-b-0 active:translate-y-[6px] active:shadow-none rounded-3xl font-black",
            accentText: "text-[#6A9C43] font-black",
            input: "bg-[#FDFDF6] border-[4px] border-[#D9CBB1] focus:border-[#8FBCA7] focus:shadow-[8px_8px_0px_0px_rgba(143,188,167,0.3)] rounded-2xl text-[#3C3026] font-bold placeholder:text-[#B0A090]",
            chartFill: "#A9D18E", chartStroke: "#558B2F",
            blob: "bg-[#A0CFE3]/40 blur-3xl",
            font: "font-serif",
            pathColor: "bg-[#8B4513]/20"
        }
    };
    const t = styles[theme];
    const [activeTab, setActiveTab] = useState('analytics');

    // --- XP SYSTEM ---
    const [xp, setXp] = useState(parseInt(localStorage.getItem('xp')) || 0);
    const [level, setLevel] = useState(Math.floor(xp / 100) + 1);
    const addXp = (amount) => {
        const newXp = xp + amount;
        setXp(newXp); setLevel(Math.floor(newXp / 100) + 1);
        localStorage.setItem('xp', newXp);
    };

    // --- RENDER ---
    const tabs = [{ id: 'analytics', icon: TrendingUp, label: 'Analytics' }, { id: 'cv', icon: FileText, label: 'CV Builder' }, { id: 'interview', icon: Trophy, label: 'Arena' }, { id: 'syllabus', icon: BookOpen, label: 'Roadmap' }, { id: 'feed', icon: MessageSquare, label: 'Feed' }, { id: 'settings', icon: Settings, label: 'Settings' }];

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 relative ${t.bg} ${t.font}`}>
            {!isGhibli && <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>}
            {isGhibli && (<div className="absolute inset-0 pointer-events-none -z-10 font-sans"><Leaf className="absolute top-[10%] left-[5%] text-[#A9D18E] opacity-40 rotate-12" size={24} /></div>)}
            {!isGhibli && (<div className="absolute inset-0 pointer-events-none -z-10"><div className={`absolute top-0 left-[-10%] w-96 h-96 rounded-full blur-3xl opacity-20 animate-blob ${t.blob}`}></div></div>)}

            <aside className={`w-20 lg:w-72 flex flex-col z-20 transition-all duration-500 m-4 ${theme === 'cyber' ? 'm-0 h-full border-r' : 'h-[calc(100vh-2rem)]'} ${t.sidebar}`}>
                <div className="p-8 relative"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden ${isGhibli ? 'bg-[#558B2F]' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`}>{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Hexagon size={24} strokeWidth={2.5} />}</div><div className="hidden lg:block"><h1 className={`text-2xl font-black tracking-tight ${t.text}`}>CollegeHub.</h1></div></div></div>
                <nav className="flex-1 px-4 space-y-2">{tabs.map(item => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`group w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold relative overflow-hidden ${activeTab === item.id ? t.navBtnActive : t.navBtn}`}><div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}></div><div className="relative z-10 flex items-center gap-4"><item.icon size={22} /><span className="hidden lg:block">{item.label}</span></div></button>))}</nav>
                <div className="p-4 mt-auto">
                    <div className={`p-4 mb-4 rounded-2xl flex items-center gap-3 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/60 border-white/40'} backdrop-blur-md shadow-lg`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden ${isGhibli ? 'bg-[#7FA99B]' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}</div>
                        <div className="hidden lg:block overflow-hidden"><p className={`text-sm font-bold truncate ${t.text}`}>{user.name}</p><p className={`text-[10px] font-bold uppercase tracking-wider ${t.textSec}`}>Level {level}</p></div>
                    </div>
                    <button onClick={toggleTheme} className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>{isDark ? <Moon size={14} /> : <Sun size={14} />} <span>Theme</span></button>
                </div>
            </aside>

            <main className="flex-1 relative overflow-y-auto z-10">
                <header className={`sticky top-0 z-30 px-8 py-4 flex justify-between items-center backdrop-blur-md border-b ${isDark ? 'bg-[#050505]/80 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                    <h2 className={`text-xl font-bold capitalize ${t.text}`}>{activeTab === 'syllabus' ? 'Roadmap' : activeTab}</h2>
                    <div className={`flex items-center gap-3 font-bold text-sm ${t.textSec}`}><span className={`${isGhibli ? 'text-[#F2D0A4]' : 'text-yellow-500'} flex items-center gap-1`}><Star size={14} fill="currentColor" /> Lvl {level}</span><div className={`w-8 h-8 rounded-full flex items-center justify-center text-white overflow-hidden ${isGhibli ? 'bg-[#558B2F]' : 'bg-indigo-500'}`}>{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name[0]}</div></div>
                </header>
                <div className="p-8 max-w-7xl mx-auto pb-32">
                    {activeTab === 'analytics' && <AnalyticsSection user={user} setUser={setUser} t={t} isDark={isDark} isGhibli={isGhibli} addXp={addXp} />}
                    {activeTab === 'cv' && <CVBuilderSection user={user} setUser={setUser} t={t} isDark={isDark} isGhibli={isGhibli} addXp={addXp} />}
                    {activeTab === 'interview' && <InterviewSection t={t} isDark={isDark} isGhibli={isGhibli} addXp={addXp} user={user} />}
                    {activeTab === 'syllabus' && <RoadmapSection t={t} isDark={isDark} user={user} />}
                    {activeTab === 'feed' && <FeedSection t={t} isDark={isDark} user={user} />}
                    {activeTab === 'settings' && <SettingsSection user={user} setUser={setUser} t={t} isDark={isDark} onLogout={handleLogout} onUpdateUser={handleUserUpdate} isGhibli={isGhibli} navigate={navigate} />}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;