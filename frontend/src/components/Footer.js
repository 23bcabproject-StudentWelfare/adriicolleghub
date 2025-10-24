// src/components/Footer.js
import React, { useEffect, useRef } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver'; // We'll create this custom hook

const Footer = () => {
    const footerRef = useRef(null);
    const isVisible = useIntersectionObserver(footerRef, { threshold: 0.1 });

    return (
        <footer className="main-footer">
            <div ref={footerRef} className={`container ${isVisible ? 'show' : 'hidden'}`}>
                <div className="footer-content">
                    <p>&copy; 2024 CollegeHub. All Rights Reserved. Built by students, for students.</p>
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Contact Us</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;