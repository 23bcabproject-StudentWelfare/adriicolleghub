import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, ArrowLeft, Code, Database, Cpu, Globe } from 'lucide-react';

const developers = [
  {
    name: "Dev One",
    role: "Full Stack Architect",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop",
    bio: "Master of the MERN stack. Turns coffee into clean code.",
    socials: { github: "#", linkedin: "#" }
  },
  {
    name: "Dev Two",
    role: "AI Engineer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2574&auto=format&fit=crop",
    bio: "The brain behind the Groq integration. Loves neural networks.",
    socials: { github: "#", twitter: "#" }
  },
  {
    name: "Dev Three",
    role: "UI/UX Designer",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2574&auto=format&fit=crop",
    bio: "Pixel perfectionist. Making the web look like the future.",
    socials: { linkedin: "#", twitter: "#" }
  },
  {
    name: "Dev Four",
    role: "Frontend Wizard",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2564&auto=format&fit=crop",
    bio: "Animator and interaction specialist. If it moves, I built it.",
    socials: { github: "#", linkedin: "#" }
  }
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 p-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold uppercase tracking-widest group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Back to Home
        </button>
      </nav>

      {/* --- HERO HEADER --- */}
      <header className="relative z-10 pt-32 pb-20 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
            WE BUILD <br/> <span className="text-indigo-500">THE FUTURE.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CollegeHub wasn't built by a corporation. It was built by students, for students. 
            We are a team of passionate engineers on a mission to upgrade the education system.
          </p>
        </motion.div>
      </header>

      {/* --- MEET THE TEAM (Cutout Style) --- */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="mb-16 flex items-end gap-4">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
          <h2 className="text-3xl font-bold uppercase tracking-widest text-white">The Squad</h2>
          <div className="h-1 flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {developers.map((dev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative h-[450px]"
            >
              {/* Card Container */}
              <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm overflow-hidden transition-all duration-500 group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                
                {/* Background Gradient inside card */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 z-10"></div>
                
                {/* The Image (Scales on hover) */}
                <div className="h-full w-full overflow-hidden">
                  <img 
                    src={dev.image} 
                    alt={dev.name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                </div>

                {/* Text Content (Slides up) */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="mb-1 overflow-hidden">
                    <h3 className="text-2xl font-black uppercase text-white transform translate-y-0 transition-transform">{dev.name}</h3>
                  </div>
                  <p className="text-indigo-400 font-mono text-xs uppercase tracking-widest mb-4">{dev.role}</p>
                  <p className="text-slate-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 mb-4">
                    {dev.bio}
                  </p>
                  
                  {/* Social Icons */}
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                    {dev.socials.github && <Github size={18} className="text-slate-400 hover:text-white cursor-pointer"/>}
                    {dev.socials.linkedin && <Linkedin size={18} className="text-slate-400 hover:text-white cursor-pointer"/>}
                    {dev.socials.twitter && <Twitter size={18} className="text-slate-400 hover:text-white cursor-pointer"/>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- TECH STACK / MISSION --- */}
      <section className="relative z-10 py-20 px-6 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold">Our Philosophy</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              We believe that technology should serve the student, not the other way around. 
              By combining <span className="text-white font-bold">Generative AI</span> with intuitive design, 
              we are removing the friction from academic planning.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {['Student First', 'Open Source', 'Data Driven', 'Always Free'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-indigo-400 font-mono text-sm">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> {item}
                </div>
              ))}
            </div>
          </div>
          
          {/* Tech Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-indigo-500/50 transition-colors">
              <Code className="text-indigo-400 mb-4" size={32}/>
              <h4 className="font-bold text-lg">MERN Stack</h4>
              <p className="text-xs text-slate-500 mt-2">Robust & Scalable Architecture</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-colors translate-y-8">
              <Cpu className="text-purple-400 mb-4" size={32}/>
              <h4 className="font-bold text-lg">Llama-3 AI</h4>
              <p className="text-xs text-slate-500 mt-2">Groq-powered Intelligence</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-colors">
              <Globe className="text-cyan-400 mb-4" size={32}/>
              <h4 className="font-bold text-lg">Modern Web</h4>
              <p className="text-xs text-slate-500 mt-2">Vite + React + Framer</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-green-500/50 transition-colors translate-y-8">
              <Database className="text-green-400 mb-4" size={32}/>
              <h4 className="font-bold text-lg">MongoDB</h4>
              <p className="text-xs text-slate-500 mt-2">Flexible Data Storage</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-10 text-center text-slate-600 text-xs font-mono border-t border-white/5 mt-20">
        <p>&copy; 2026 COLLEGEHUB PROJECT. DESIGNED WITH ❤️.</p>
      </footer>

    </div>
  );
};

export default About;