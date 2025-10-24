// src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';

// You can find great, free SVG icons from sites like heroicons.com
const sidebarLinks = [
    { to: "/feed/ai-interview", text: "AI Interview", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H19.5M18.75 8.25V18a2.25 2.25 0 01-2.25 2.25H7.5A2.25 2.25 0 015.25 18V8.25m13.5-1.5V6a2.25 2.25 0 00-2.25-2.25H7.5A2.25 2.25 0 005.25 6v.75m13.5 13.5H6.75" /></svg> },
    { to: "/feed/analysis", text: "Student Analysis", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg> },
    { to: "/feed/track", text: "Student Track", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></svg> },
    { to: "/feed/placements", text: "Placements Prep", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.905 59.905 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-3.938-5.714A59.937 59.937 0 0112 3.493a59.937 59.937 0 0111.938 5.714l-3.938 5.714z" /></svg> },
    { to: "/feed/notes", text: "Personal Notes", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> }
];

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {sidebarLinks.map((link) => (
                    <NavLink to={link.to} key={link.to} className="sidebar-nav-link">
                        <div className="sidebar-icon">{link.icon}</div>
                        <span>{link.text}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;