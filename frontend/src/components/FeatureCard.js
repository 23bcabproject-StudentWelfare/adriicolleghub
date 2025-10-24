// src/components/FeatureCard.js
import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver'; // Assuming this hook is in src/hooks/
import { useRef } from 'react';

// A generic icon for demonstration. You can customize this per card.
const CardIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17.25l4.5-4.5-4.5-4.5m6 9l4.5-4.5-4.5-4.5"></path>
    </svg>
);

const FeatureCard = ({ title, description }) => {
    const cardRef = useRef(null);
    const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });

    return (
        <div ref={cardRef} className={`feature-card ${isVisible ? 'show' : 'hidden'}`}>
            <div className="card-content">
                <div className="card-header">
                    <div className="icon-wrapper">
                        <CardIcon />
                    </div>
                    <h3>{title}</h3>
                </div>
                <p>{description}</p>
                <a href="#" className="card-cta">
                    <span>Learn More</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                </a>
            </div>
        </div>
    );
};

export default FeatureCard;