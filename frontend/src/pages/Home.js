// src/pages/Home.js
import React, { useRef } from 'react';
import ParticleCanvas from '../components/ParticleCanvas';
import Footer from '../components/Footer';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import FeatureCard from '../components/FeatureCard'; // We will create this next

const Home = () => {
    const heroRef = useRef(null);
    const sectionTitleRef = useRef(null);
    const isHeroVisible = useIntersectionObserver(heroRef, { threshold: 0.1 });
    const isTitleVisible = useIntersectionObserver(sectionTitleRef, { threshold: 0.1 });

    const features = [
        {
            icon: <svg>...</svg>, // Copy SVG content here
            title: "AI Interview Gym",
            description: "Practice for technical and HR rounds with our AI..."
        },
        // ... other feature objects
    ];

    return (
        <>
            <ParticleCanvas />
            <main>
                <section id="home" className="hero">
                    <div ref={heroRef} className={`container hero-content ${isHeroVisible ? 'show' : 'hidden'}`}>
                        <h2>Your Entire College Life, <br /> <span className="highlight">Upgraded and Organised.</span></h2>
                        <p>
                            CollegeHub is an all-in-one ecosystem designed to help you excel. From AI-powered interview prep to a centralized hub for all your study materials, we provide the tools you need to conquer your academics and launch your career.
                        </p>
                        <a href="#" className="cta-button">Begin Your Ascent</a>
                    </div>
                </section>

                <section id="features">
                    <div className="container">
                        <div ref={sectionTitleRef} className={`section-title ${isTitleVisible ? 'show' : 'hidden'}`}>
                            <h2>The Ultimate Student Toolkit</h2>
                            <p>Everything you need, all in one place.</p>
                        </div>
                        <div className="features-grid">
                            {/* Map over feature data here if you want to be more dynamic */}
                            <FeatureCard id="feature1" title="AI Interview Gym" description="Practice for technical and HR rounds..." />
                            <FeatureCard id="feature2" title="Study Resources Hub" description="Your centralized library for every subject..." />
                            <FeatureCard id="feature3" title="AI Academic Chatbot" description="Stuck on a problem at 2 AM? Our AI tutor..." />
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default Home;