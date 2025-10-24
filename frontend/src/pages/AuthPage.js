import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Assuming NeuralCanvas is a component defined elsewhere
import NeuralCanvas from '../components/NeuralCanvas';

// Define the base URL for the backend API
// Note: In development, the backend often runs on port 8080.
const API_BASE_URL = 'http://localhost:8080/api/auth';

const AuthPage = () => {
    const navigate = useNavigate();
    const [isLoginView, setIsLoginView] = useState(true);
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });
    
    // Updated signupForm state to match backend schema
    const [signupForm, setSignupForm] = useState({
        username: '',
        password: '',
        collegeName: '',
        universityName: '',
        major: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState(''); // State for success/error messages

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setMessage(''); // Clear message when switching views
    };

    const handleLoginChange = (e) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    };

    const handleSignupChange = (e) => {
        setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
    };

    // --- Core API Call Function ---
    const sendAuthRequest = async (url, data) => {
        setMessage('Processing...');
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // important to receive httpOnly cookies from backend
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                // Success: Login/Signup successful
                setMessage(result.message || 'Authentication successful!');
                
                // Store token and user ID (replace with a proper state/context manager later)
                if (result.token) localStorage.setItem('userToken', result.token);
                if (result.userId) localStorage.setItem('userId', result.userId);

                // Navigate to the main application page
                navigate('/feed/ai-interview');
            } else {
                // Failure: Backend returned a 4xx or 5xx error
                // Ensure we get a string message, otherwise fall back to a generic message
                const errorMessage = (result && result.message) 
                    ? `Error: ${result.message}` 
                    : 'Error: An unknown error occurred.';
                setMessage(errorMessage); 
            }
        } catch (error) {
            console.error('Network or Parse Error:', error);
            setMessage('Error: Network error. Is the backend running at ' + API_BASE_URL + '?');
        }
    };
    // -----------------------------

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        sendAuthRequest(`${API_BASE_URL}/login`, loginForm);
    };

    const handleSignupSubmit = (e) => {
        e.preventDefault();
        
        // Frontend validation: Check if passwords match
        if (signupForm.password !== signupForm.confirmPassword) {
            setMessage('Error: Passwords do not match.');
            return;
        }

        // We only send fields relevant to the backend User creation
        const { confirmPassword, ...dataToSend } = signupForm;
        
        // Note: The backend router will handle splitting fullName into first_name/last_name
        // and mapping 'college' from the body to 'college_id' on the schema.
        sendAuthRequest(`${API_BASE_URL}/signup`, dataToSend);
    };

    return (
        <>
            <NeuralCanvas />
            <div className="auth-page-wrapper">
                <div className={`auth-card ${!isLoginView ? 'signup-view' : ''}`}>
                    <div className="auth-content">
                        <h2 className="auth-title">
                            {isLoginView ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="auth-subtitle">
                            {isLoginView ? 'Log in to continue your ascent.' : 'Join the CollegeHub ecosystem.'}
                        </p>

                        {/* Display Message (FIXED: Added typeof check to prevent startsWith error) */}
                        {message && (
                            <div className="message-box" style={{ 
                                // Safely check if message is a string before calling startsWith()
                                color: (typeof message === 'string' && message.startsWith('Error')) ? 'red' : 'green', 
                                margin: '10px 0' 
                            }}>
                                {message}
                            </div>
                        )}
                        
                        {isLoginView ? (
                            <form className="auth-form" onSubmit={handleLoginSubmit}>
                                <div className="form-input-group">
                                    <label htmlFor="login-username">Username</label>
                                    <input 
                                        type="text" 
                                        id="login-username" 
                                        name="username" 
                                        placeholder="username" 
                                        value={loginForm.username}
                                        onChange={handleLoginChange}
                                        required 
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label htmlFor="login-password">Password</label>
                                    <input 
                                        type="password" 
                                        id="login-password" 
                                        name="password" 
                                        placeholder="••••••••" 
                                        value={loginForm.password}
                                        onChange={handleLoginChange}
                                        required 
                                    />
                                </div>
                                <button type="submit" className="auth-button">Log In</button>
                            </form>
                        ) : (
                            <form className="auth-form signup-form" onSubmit={handleSignupSubmit}>
                                <div className="form-input-group">
                                    <label htmlFor="signup-username">Username</label>
                                    <input 
                                        type="text" 
                                        id="signup-username" 
                                        name="username" 
                                        placeholder="username"
                                        value={signupForm.username}
                                        onChange={handleSignupChange}
                                        required 
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label htmlFor="signup-college">College Name</label>
                                    <input 
                                        type="text" 
                                        id="signup-college" 
                                        name="collegeName" 
                                        placeholder="College Name"
                                        value={signupForm.collegeName}
                                        onChange={handleSignupChange}
                                        required 
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label htmlFor="signup-university">University Name</label>
                                    <input 
                                        type="text" 
                                        id="signup-university" 
                                        name="universityName" 
                                        placeholder="University Name"
                                        value={signupForm.universityName}
                                        onChange={handleSignupChange}
                                        required 
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label htmlFor="signup-major">Major (Optional)</label>
                                    <input 
                                        type="text" 
                                        id="signup-major" 
                                        name="major" 
                                        placeholder="Major"
                                        value={signupForm.major}
                                        onChange={handleSignupChange}
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label htmlFor="signup-password">Password</label>
                                    <input 
                                        type="password" 
                                        id="signup-password" 
                                        name="password" 
                                        value={signupForm.password}
                                        onChange={handleSignupChange}
                                        required 
                                    />
                                </div>
                                <div className="form-input-group">
                                    <label htmlFor="signup-confirm-password">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        id="signup-confirm-password" 
                                        name="confirmPassword" 
                                        value={signupForm.confirmPassword}
                                        onChange={handleSignupChange}
                                        required 
                                    />
                                </div>
                                <button type="submit" className="auth-button">Sign Up</button>
                            </form>
                        )}

                        <div className="auth-toggle">
                            <p>
                                {isLoginView ? "Don't have an account?" : 'Already have an account?'}
                                <button onClick={toggleView}>
                                    {isLoginView ? 'Sign Up' : 'Log In'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthPage;
