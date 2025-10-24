// src/components/Header.js
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo1.jpg';

const Header = () => {
    return (
        <header className="main-header">
            <div className="container">
                <nav>
                    <Link to="/" className="logo-container">
                        <img src={logo} alt="CollegeHub Logo" className="logo-image" />
                        <h1>College<span>Hub</span></h1>
                    </Link>
                    
                    {/* This new wrapper div is key for alignment */}
                    <div className="nav-right">
                        <div className="nav-links">
                            <NavLink to="/">Home</NavLink>
                            <NavLink to="/profile">Profile</NavLink>
                            <a href="#features">Features</a>
                        </div>
                        <Link to="/auth" className="cta-button">Get Started</Link>
                    </div>

                </nav>
            </div>
        </header>
    );
};

export default Header;