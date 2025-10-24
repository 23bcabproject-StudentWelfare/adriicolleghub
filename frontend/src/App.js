// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage'; 
import Header from './components/Header';
import './App.css';
import Chatbot from './pages/Chatbot';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/feed/*" element={<FeedPage />} />
         <Route path="/chatbot/*" element={<Chatbot />} />
      </Routes>
    </Router>
  );
}

export default App;