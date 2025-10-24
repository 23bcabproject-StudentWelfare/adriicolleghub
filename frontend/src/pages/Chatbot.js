// src/components/Chatbot.js

import React, { useState, useRef, useEffect } from 'react';
// IMPORTANT: Assuming './App.css' is imported in your main App.js file.

// --- CONFIGURATION ---
const CHATBOT_API_URL = 'http://localhost:8001/chat';

const initialMessages = [
  { 
    id: 1, 
    sender: 'AI', 
    text: "Hello! I'm the College Hub AI. I can check your assignments, grades, and schedule. How can I help you today?" 
  },
];

// --- MAIN COMPONENT ---

const Chatbot = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return; 
    
    setIsLoading(true);
    setInput('');

    const newUserMessage = { id: Date.now(), sender: 'User', text: trimmedInput };
    setMessages((prev) => [...prev, newUserMessage]); 

    // Convert messages to the format expected by AI service
    const history = messages.map(msg => ({
      role: msg.sender === 'User' ? 'User' : 'AI',
      text: msg.text
    }));

  const storedUserId = localStorage.getItem('userId') || '';
    const token = localStorage.getItem('userToken');

    if (!storedUserId && !token) {
      const loginMessage = {
        id: Date.now() + 1,
        sender: 'AI',
        text: "Please log in to use the chatbot so it can access your profile."
      };
      setMessages((prev) => [...prev, loginMessage]);
      setIsLoading(false);
      return;
    }

    const payload = {
      user_id: storedUserId,
      message: trimmedInput,
      history: history
    };

    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const newAIMessage = {
        id: Date.now() + 1,
        sender: 'AI',
        text: data.response || "Sorry, I couldn't get a response from the AI model.",
      };
      setMessages((prev) => [...prev, newAIMessage]);

    } catch (error) {
      console.error('Error contacting the chatbot service:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'AI',
        text: "🚨 Connection Error: Could not reach the College Hub AI. Please check the Python service.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    // Uses the CSS classes defined in App.css for styling and integration
    <div className="chatbot-widget widget"> 
      
      <div className="chat-header">
        <svg className="chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3 className="widget-title-small">Academic Chatbot (Talking as Adrian)</h3>
      </div>
      
      <div className="widget-content">
          
          <div className="message-window">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-bubble ${message.sender === 'User' ? 'user-bubble' : 'ai-bubble'}`}
              >
                {message.text}
              </div>
            ))}
            
            {/* The cool little in-built loading animation */}
            {isLoading && (
              <div className="message-bubble ai-bubble loading-bubble">
                <div className="dot-spinner">
                  <div className="dot-bounce"></div>
                  <div className="dot-bounce"></div>
                  <div className="dot-bounce"></div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Waiting for AI response..." : "Ask the chatbot about your academics..."}
              disabled={isLoading}
              className="input-field"
            />
            <button 
              type="submit" 
              disabled={isLoading} 
              className="send-button cta-button" // Reusing cta-button for the gradient style
              >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
      </div>
    </div>
  );
};

export default Chatbot;