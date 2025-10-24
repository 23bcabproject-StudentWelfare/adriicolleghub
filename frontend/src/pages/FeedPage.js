import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';

// Assuming the API base URL for posts is /api/feed
const API_BASE_URL = 'http://localhost:8080/api/auth';
const POST_API_URL = 'http://localhost:8080/api/feed/posts';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBAKT29y3MAkaE9SmmsLDJBhROvLzEY4M0`;

const FeedPage = () => {
    const [feedItems, setFeedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userContext, setUserContext] = useState({ role: 'student', university: 'Global University', authorName: 'Anonymous User' });
    
    // State for creating a new post
    const [postContent, setPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    // Helper function to format timestamps for display
    const formatTimestamp = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return new Date(date).toLocaleDateString();
    };
    
    // --- 1. Fetch User Profile Context ---
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        if (!userId || !userToken) {
            setError('User not logged in. Showing default feed.');
            setUserContext(prev => ({ ...prev, authorName: 'Guest' }));
            return;
        }

        const fetchUserContext = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    // Backend returns: username, collegeName, universityName, major
                    setUserContext({ 
                        role: data.major || 'Student',
                        university: data.universityName || data.collegeName || 'Global University',
                        authorName: data.username || 'User ' + (userId || '').substring(0, 8)
                    });
                } else {
                    const err = await response.json().catch(() => ({}));
                    console.warn('Profile fetch non-ok:', err.message || response.status);
                }
            } catch (err) {
                console.error('Failed to fetch user context:', err);
            }
        };

        fetchUserContext();
    }, []);


    // --- 2. Post Submission Handler ---
    const handlePostSubmit = async () => {
        if (!postContent.trim() || isPosting) return;

        const userToken = localStorage.getItem('userToken');
        if (!userToken) {
            setError("Please log in to post content.");
            return;
        }
        
        setIsPosting(true);

        try {
            const response = await fetch(POST_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` 
                },
                body: JSON.stringify({ content: postContent })
            });

            if (!response.ok) {
                throw new Error("Failed to create post. Authentication or server error.");
            }

            const newPost = await response.json();
            
            // Immediately prepend the new post to the feed
            setFeedItems(prevItems => [{ 
                ...newPost, 
                // Standardize fields for rendering
                title: newPost.content.substring(0, 50) + '...', // Use content as title placeholder
                summary: newPost.content,
                type: 'user_post',
                authorName: userContext.authorName,
                timestamp: new Date(newPost.timestamp).getTime(),
            }, ...prevItems]);
            
            setPostContent(''); // Clear the textarea

        } catch (e) {
            console.error('Post submission failed:', e.message);
            setError(`Failed to submit post: ${e.message}`);
        } finally {
            setIsPosting(false);
        }
    };


    // --- 3. Combined Feed Fetching (User Posts + Dynamic News) ---
    const fetchDynamicFeed = useCallback(async (retries = 3) => {
        setIsLoading(true);
        setError(null);
        
        const userToken = localStorage.getItem('userToken');
        const fetchHeaders = userToken ? { 'Authorization': `Bearer ${userToken}` } : {};

        // --- A. Fetch User Posts from Backend ---
        const fetchUserPosts = async () => {
            try {
                // Use the new endpoint that returns posts authored by the current user
                const response = await fetch(`${POST_API_URL}/me`, { headers: fetchHeaders });
                if (!response.ok) throw new Error('Could not fetch user posts.');
                const posts = await response.json();

                // Map to a common format for display
                return posts.map(post => ({
                    ...post,
                    id: post._id,
                    type: 'user_post',
                    source: post.authorName || post.username || 'You',
                    summary: post.content,
                    timestamp: new Date(post.timestamp).getTime(), // Convert to milliseconds for sorting
                }));
            } catch (e) {
                console.error('User Post Fetch Error:', e);
                return []; // Return empty array on failure
            }
        };
        
        // --- B. Fetch AI-Curated Content from Gemini API ---
        const fetchGeminiContent = async (currentRetries) => {
            const systemPrompt = `You are an expert academic and career news aggregator. Based on the user's role, generate a list of 5 recent, relevant news items and job opportunities. Use Google Search to find up-to-date information. Format the output as a clean, single JSON array.`;
            const userQuery = `Find 3 recent industry news articles and 2 recent job postings for the field: ${userContext.role} at ${userContext.university}. Ensure the output strictly follows the JSON schema.`;
            
            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                tools: [{ "google_search": {} }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "type": { "type": "STRING", "description": "Either 'news' or 'job'" },
                                "title": { "type": "STRING", "description": "The title of the news article or job posting" },
                                "source": { "type": "STRING", "description": "The source or company name" },
                                "summary": { "type": "STRING", "description": "A 1-2 sentence summary of the item" },
                                "link": { "type": "STRING", "description": "The external link" }
                            },
                            "required": ["type", "title", "source", "summary"]
                        }
                    }
                }
            };
            
            const apiKey = ""; 

            try {
                const response = await fetch(GEMINI_API_URL + apiKey, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Gemini API failed with status: ${response.status}`);

                const result = await response.json();
                const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (jsonText) {
                    const parsedData = JSON.parse(jsonText);
                    // Add a recent placeholder timestamp for sorting
                    return parsedData.map(item => ({
                        ...item, 
                        timestamp: new Date().getTime() - Math.floor(Math.random() * 3600000), // Random time up to 1h ago
                        isAI: true
                    })); 
                }
                throw new Error("No structured data received.");
            } catch (e) {
                console.error(`Gemini Attempt ${4 - currentRetries} failed:`, e.message);
                if (currentRetries > 0) {
                    await new Promise(resolve => setTimeout(resolve, (4 - currentRetries) * 1000));
                    return fetchGeminiContent(currentRetries - 1);
                }
                return [];
            }
        };

        // Execute both fetches concurrently
        const [userPosts, geminiContent] = await Promise.all([
            fetchUserPosts(),
            fetchGeminiContent(retries)
        ]);

        // Combine and sort the results by timestamp (newest first)
        const combinedFeed = [...userPosts, ...geminiContent]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); 
            
        if (combinedFeed.length === 0) {
            setError("Could not load any feed data. Please check network connection.");
        }

        setFeedItems(combinedFeed);
        setIsLoading(false);

    }, [userContext.role, userContext.university]); // Dependency array for useCallback

    useEffect(() => {
        if (userContext.role) {
            fetchDynamicFeed();
        }
    }, [userContext.role, fetchDynamicFeed]); // Run fetch when context is ready

    const userAvatarUrl = "https://placehold.co/48x48/6fffb0/010409?text=A";

    // --- Component Rendering ---
    return (
        <div className="feed-layout flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            
            <main className="feed-content flex-grow overflow-y-auto p-4 md:p-8">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Create Post Card */}
                    <div className="bg-white shadow-lg rounded-xl p-4 border border-gray-100">
                        <div className="flex space-x-3 items-start">
                            <img src={userAvatarUrl} alt="Your Avatar" className="w-12 h-12 rounded-full object-cover" />
                            <textarea 
                                placeholder={`What's on your mind, ${userContext.authorName}?`} 
                                className="create-post-input flex-grow p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none" 
                                rows="3"
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                disabled={isPosting || !localStorage.getItem('userToken')}
                            ></textarea>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button 
                                className={`create-post-button py-2 px-6 rounded-lg font-semibold transition shadow-md flex items-center ${
                                    postContent.trim() && !isPosting && localStorage.getItem('userToken')
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                }`}
                                onClick={handlePostSubmit}
                                disabled={!postContent.trim() || isPosting || !localStorage.getItem('userToken')}
                            >
                                {isPosting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Posting...
                                    </>
                                ) : 'Post'}
                            </button>
                        </div>
                        {!localStorage.getItem('userToken') && (
                             <p className="text-xs text-red-500 mt-2 text-right">You must be logged in to post.</p>
                        )}
                    </div>

                    {/* Loading & Error States */}
                    {isLoading && feedItems.length === 0 && (
                        <div className="p-10 text-center text-lg font-medium text-gray-500 bg-white shadow-lg rounded-xl flex items-center justify-center space-x-2">
                             <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading personalized feed for "{userContext.role}"...</span>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    {/* Dynamic Feed Items */}
                    {feedItems.map((item) => {
                                let tagClass = '';
                        let tagText = '';
                        let mainLink = item.link || '#';

                        switch (item.type) {
                            case 'user_post':
                                tagClass = 'bg-emerald-100 text-emerald-700';
                                tagText = 'Student Post';
                                break;
                            case 'job':
                                tagClass = 'bg-yellow-100 text-yellow-700';
                                tagText = 'Job Offer';
                                break;
                            case 'news':
                            default:
                                tagClass = 'bg-indigo-100 text-indigo-700';
                                tagText = 'Industry News';
                                break;
                        }

                        return (
                            <div 
                                key={item.id || item._id || item.title} 
                                className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 hover:shadow-xl transition duration-300"
                            >
                                <div className="post-header flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={userAvatarUrl} alt="Source Avatar" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                        <div className="post-user-info">
                                            <span className="post-user-name font-bold text-gray-800 block text-md">
                                                {item.source || item.authorName || 'Unknown Source'}
                                            </span>
                                            <span className="post-timestamp text-sm text-gray-500">
                                                {item.timestamp ? formatTimestamp(item.timestamp) : 'Just Now'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tagClass}`}>
                                        {tagText}
                                    </span>
                                </div>
                                
                                <h2 className="post-title text-xl font-semibold text-gray-900 mb-2">
                                    {item.title || (item.summary ? (item.summary.substring(0, 80) + '...') : 'Untitled')}
                                </h2>
                                <p className="post-body text-gray-700 mb-4">{item.summary || ''}</p>
                                
                                <div className="post-actions border-t pt-3 flex space-x-4 text-sm font-medium">
                                    {/* Actions for User Posts */}
                                    {item.type === 'user_post' && (
                                        <>
                                            <button className="text-gray-500 hover:text-emerald-600 transition">
                                                Like ({item.likes || 0})
                                            </button>
                                            <button className="text-gray-500 hover:text-emerald-600 transition">
                                                Comment ({item.comments || 0})
                                            </button>
                                        </>
                                    )}
                                    {/* Action for News/Job Posts */}
                                    {item.type !== 'user_post' && (
                                        <a href={mainLink} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 transition">
                                            View Source &rarr;
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {feedItems.length === 0 && !isLoading && !error && (
                        <div className="p-10 text-center text-lg font-medium text-gray-500 bg-white shadow-lg rounded-xl">
                            No feed items found. Try refreshing or logging in again.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FeedPage;
