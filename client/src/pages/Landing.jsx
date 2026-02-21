import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion';
import { ArrowRight, Layers, Cpu, Shield, Zap, Globe, Github, Twitter, TrendingUp, FileText, LayoutGrid, Award, BrainCircuit, CheckCircle, PlayCircle, Trophy, Linkedin } from 'lucide-react';

// --- COMPONENTS ---

// 1. MAGNETIC BUTTON
const MagneticButton = ({ children, onClick, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    x.set((clientX - (left + width / 2)) * 0.35);
    y.set((clientY - (top + height / 2)) * 0.35);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// 2. BENTO GRID ITEM
const BentoItem = ({ title, desc, icon: Icon, className, delay, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, ease: "easeOut" }}
    viewport={{ once: true, margin: "-50px" }}
    className={`group relative overflow-hidden rounded-3xl border border-white/10 p-8 hover:border-white/20 transition-colors duration-500 ${className}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-b ${gradient || 'from-white/5 to-transparent'} opacity-50 group-hover:opacity-100 transition-opacity`} />
    <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700" />
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-6 w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-300">
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
    </div>
  </motion.div>
);

// 3. STICKY SCROLL SECTION ITEM
const StickyItem = ({ title, desc, index }) => {
  return (
    <div className="flex gap-8 mb-24 last:mb-0 group">
        <div className="hidden md:flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-mono font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                0{index}
            </div>
            <div className="w-px h-full bg-gradient-to-b from-indigo-500/30 to-transparent mt-4 group-last:hidden" />
        </div>
        <div className="pt-2">
            <h3 className="text-3xl font-bold text-white mb-4">{title}</h3>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl">{desc}</p>
        </div>
    </div>
  );
};

// 4. INTERACTIVE MESH (New Bridging Section)
const InteractiveMesh = () => {
    return (
        <div className="relative w-full h-[500px] bg-[#030303] overflow-hidden flex flex-col items-center justify-center border-t border-white/5">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
             
             <div className="relative z-10 text-center px-4">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md"
                 >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></span>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Neural Engine Active</span>
                 </motion.div>
                 
                 <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tight mb-4"
                 >
                    Connecting Data Points.
                 </motion.h2>
                 
                 <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 max-w-lg mx-auto text-lg"
                 >
                    Our system processes thousands of academic signals to build your personalized roadmap.
                 </motion.p>
             </div>

             {/* Floating Nodes */}
             <div className="absolute inset-0 pointer-events-none">
                 <motion.div 
                    animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-600/20 rounded-full blur-[60px]"
                 />
                 <motion.div 
                    animate={{ y: [0, 20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-cyan-600/20 rounded-full blur-[60px]"
                 />
             </div>
        </div>
    )
}

// --- MAIN PAGE ---

const Landing = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Refs for Scroll Control
  const heroRef = useRef(null);
  
  // 1. HERO SCROLL LOGIC
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  // Tighter zoom, fades out faster to reveal content
  const textScale = useTransform(heroProgress, [0, 0.5], [1, 60]);
  const textOpacity = useTransform(heroProgress, [0, 0.4], [1, 0]);
  const overlayOpacity = useTransform(heroProgress, [0.3, 0.5], [0, 1]); 
  const videoBlur = useTransform(heroProgress, [0, 0.5], ["0px", "20px"]);

  // Navbar Scroll Listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#030303]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 mix-blend-difference cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-bold">C</div>
            <span className="text-sm font-bold tracking-[0.2em] uppercase">CollegeHub</span>
          </div>
          <div className="hidden md:flex gap-12 text-xs font-bold uppercase tracking-widest text-slate-400 mix-blend-difference">
            <span onClick={() => document.getElementById('features').scrollIntoView({behavior:'smooth'})} className="hover:text-white transition-colors cursor-pointer">Features</span>
            <span onClick={() => document.getElementById('workflow').scrollIntoView({behavior:'smooth'})} className="hover:text-white transition-colors cursor-pointer">How it works</span>
            <span onClick={() => navigate('/about')} className="hover:text-white transition-colors cursor-pointer">About Us</span>
          </div>
          <MagneticButton onClick={() => navigate('/login')} className="hidden md:block text-xs font-bold uppercase tracking-widest mix-blend-difference hover:text-indigo-400">
            Login
          </MagneticButton>
        </div>
      </nav>

      {/* --- SECTION 1: THE IMMERSIVE PORTAL HERO --- */}
      {/* Reduced height to 130vh for tighter transition */}
      <div ref={heroRef} className="relative h-[130vh] w-full">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          
          {/* A. Background Video Layer */}
          <motion.div style={{ filter: videoBlur }} className="absolute inset-0 w-full h-full">
             <div className="absolute inset-0 bg-black/50 z-10" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] min-w-[177.77vh] min-h-[56.25vw] z-0 pointer-events-none opacity-60">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/QJ7OeIrc6Y0?autoplay=1&mute=1&controls=0&loop=1&playlist=QJ7OeIrc6Y0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1" 
                  title="Background"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
             </div>
          </motion.div>

          {/* B. The Zooming Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
            <motion.div style={{ scale: textScale, opacity: textOpacity }} className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">System Online</span>
              </div>
              <h1 className="text-[12vw] font-black leading-none tracking-tighter text-white mix-blend-overlay">
                COLLEGE<br/>HUB
              </h1>
            </motion.div>
          </div>

          {/* C. The CTA */}
          <motion.div style={{ opacity: textOpacity }} className="absolute bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-auto">
             <MagneticButton onClick={() => navigate('/signup')} className="group relative px-10 py-5 bg-white text-black rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center gap-2 font-bold text-lg group-hover:text-white transition-colors">
                  Get Started <ArrowRight size={20} />
                </span>
             </MagneticButton>
          </motion.div>

          {/* D. Transition Overlay */}
          <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0 bg-[#030303] z-40 pointer-events-none" />
        </div>
      </div>

      {/* --- NEW SECTION: INTERACTIVE MESH (Fills the gap) --- */}
      <InteractiveMesh />

      {/* --- MARQUEE STRIP --- */}
      <div className="w-full bg-[#030303] py-10 border-y border-white/5 overflow-hidden">
        <div className="flex gap-20 whitespace-nowrap animate-[marquee_20s_linear_infinite] opacity-30 hover:opacity-50 transition-opacity">
           {["INTELLIGENT ANALYTICS", "CAREER FORECASTING", "AUTOMATED ROADMAPS", "ATS RESUME BUILDER", "GAMIFIED LEARNING", "INTELLIGENT ANALYTICS", "CAREER FORECASTING"].map((text, i) => (
             <span key={i} className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-transparent stroke-white">{text}</span>
           ))}
        </div>
      </div>

      {/* --- SECTION 2: BENTO GRID FEATURES --- */}
      <section id="features" className="relative z-10 py-32 px-6 bg-[#030303]">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-20 max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-light tracking-tighter text-white mb-6">
              The <span className="font-bold text-indigo-500">Student Space</span>
            </h2>
            <p className="text-xl text-slate-400">
              Everything you need to master your degree, consolidated into one powerful, intelligent interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[800px]">
            {/* Column 1 */}
            <div className="flex flex-col gap-6 h-full">
              <BentoItem 
                title="AI Career Coach" 
                desc="Llama-3 powered guidance analyzing your specific grades to predict career paths."
                icon={BrainCircuit}
                className="flex-1 bg-[#0A0A0A] border-indigo-500/20"
                delay={0.1}
                gradient="from-indigo-500/10 to-transparent"
              />
              <BentoItem 
                title="Resume Builder" 
                desc="ATS scoring engine ensuring your CV passes robotic filters."
                icon={FileText}
                className="h-[300px] bg-[#0A0A0A]"
                delay={0.2}
              />
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-6 h-full pt-0 md:pt-12">
              <BentoItem 
                title="GPA Forecasting" 
                desc="Predictive models that visualize your academic trajectory before finals."
                icon={TrendingUp}
                className="h-[300px] bg-[#0A0A0A]"
                delay={0.3}
              />
              <BentoItem 
                title="Interview Arena" 
                desc="Gamified technical mock interviews with XP, streaks, and global leaderboards."
                icon={Trophy}
                className="flex-1 bg-[#0A0A0A] border-purple-500/20"
                delay={0.4}
                gradient="from-purple-500/10 to-transparent"
              />
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-6 h-full">
              <BentoItem 
                title="Smart Roadmap" 
                desc="Dynamic roadmaps that adapt to your university curriculum updates automatically."
                icon={Layers}
                className="flex-1 bg-[#0A0A0A]"
                delay={0.5}
              />
              <BentoItem 
                title="Community Feed" 
                desc="Share insights and tips with peers in your specific course."
                icon={Globe}
                className="h-[300px] bg-[#0A0A0A]"
                delay={0.6}
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: STICKY WORKFLOW --- */}
      <section id="workflow" className="relative py-32 px-6 bg-[#050505] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* Sticky Left */}
          <div className="h-fit lg:sticky lg:top-32">
            <h2 className="text-5xl font-bold mb-8">How it works.</h2>
            <p className="text-xl text-slate-400 mb-12 max-w-md">
              We bridge the gap between your raw academic data and your career potential using advanced AI modeling.
            </p>
            <MagneticButton onClick={() => navigate('/signup')} className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-indigo-50 transition-colors">
              Get Started Now
            </MagneticButton>
          </div>

          {/* Scrollable Right */}
          <div className="flex flex-col pt-10 lg:pt-0">
            <StickyItem 
              index={1} 
              title="Sync Your Data" 
              desc="Input your university details and current grades. Our system instantly structures your syllabus and creates a baseline academic profile."
            />
            <StickyItem 
              index={2} 
              title="AI Analysis" 
              desc="Our neural engine scans your performance to identify strengths. It suggests 3 tailored career paths (e.g., 'Backend Engineer') based on your actual marks in core subjects."
            />
            <StickyItem 
              index={3} 
              title="Skill Up & Apply" 
              desc="Use the Interview Arena to practice technical questions. Then, generate a perfect ATS-friendly resume with one click and start applying."
            />
          </div>

        </div>
      </section>

      {/* --- SECTION 4: MASKED OUTRO --- */}
      <section className="relative min-h-screen w-full bg-white flex items-center justify-center overflow-hidden">
        {/* The Video that shows THROUGH the text */}
        <div className="absolute inset-0 w-full h-full">
           <video autoPlay loop muted playsInline className="w-full h-full object-cover grayscale opacity-80">
              <source src="https://cdn.pixabay.com/video/2020/05/25/40139-424930064_large.mp4" type="video/mp4" />
           </video>
        </div>

        {/* The Masking Layer */}
        <div className="absolute inset-0 bg-black mix-blend-hard-light flex flex-col items-center justify-center text-center p-4">
           {/* Text Mask */}
           <div className="mix-blend-difference pointer-events-none">
               <h2 className="text-[15vw] md:text-[18vw] font-black leading-[0.8] tracking-tighter text-white bg-clip-text uppercase">
                 Career
               </h2>
               <h2 className="text-[15vw] md:text-[18vw] font-black leading-[0.8] tracking-tighter text-white bg-clip-text uppercase">
                 Ready
               </h2>
           </div>
           
           {/* Floating CTA - Positioned relatively to avoid overlap */}
           <div className="mt-12 md:mt-16 mix-blend-difference z-20 relative">
               <MagneticButton onClick={() => navigate('/signup')} className="px-10 py-5 md:px-12 md:py-6 bg-white text-black rounded-full font-bold text-lg md:text-xl hover:scale-110 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                  Join The Hub
               </MagneticButton>
           </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-black border-t border-white/10 pt-20 pb-10 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
           <div className="max-w-md">
              <h4 className="text-2xl font-bold mb-6">CollegeHub.</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                The space for the next generation of achievers. 
                Bridging the gap between academic theory and industry reality.
              </p>
           </div>
           
           <div className="flex gap-20">
              <div>
                 <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-indigo-500">Platform</h5>
                 <ul className="space-y-4 text-sm text-slate-500">
                    <li className="hover:text-white transition-colors cursor-pointer">Intelligence</li>
                    <li className="hover:text-white transition-colors cursor-pointer">Roadmaps</li>
                    <li className="hover:text-white transition-colors cursor-pointer">Community</li>
                 </ul>
              </div>
              <div>
                 <h5 className="font-bold mb-6 text-sm uppercase tracking-widest text-indigo-500">Company</h5>
                 <ul className="space-y-4 text-sm text-slate-500">
                    <li onClick={() => navigate('/about')} className="hover:text-white transition-colors cursor-pointer">About Us</li>
                    <li className="hover:text-white transition-colors cursor-pointer">Careers</li>
                    <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                 </ul>
              </div>
           </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 font-mono">
           <p>© 2026 COLLEGEHUB INC.</p>
           <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-white cursor-pointer transition-colors">PRIVACY</span>
              <span className="hover:text-white cursor-pointer transition-colors">TERMS</span>
              <span className="hover:text-white cursor-pointer transition-colors">TWITTER</span>
              <Linkedin className="hover:text-white cursor-pointer transition-colors" size={16}/>
           </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;