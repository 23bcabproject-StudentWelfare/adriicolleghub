import React, { useState, useEffect } from 'react';
import NeuralCanvas from '../components/NeuralCanvas';
import TodoList from '../components/TodoList';

const API_BASE_URL = 'http://localhost:8080/api/auth'; // Match your backend router path

const Profile = () => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const initialProfileState = {
        name: 'Loading...',
        course: 'Loading...',
        college: 'Loading...',
        dob: 'N/A',
        age: 'N/A',
        profilePicture: 'https://placehold.co/150x150/6fffb0/010409?text=User'
    };

    const [profileData, setProfileData] = useState(initialProfileState);

    // --- Data Fetching and Local Storage Load Effect ---
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const userToken = localStorage.getItem('userToken');

        if (!userId || !userToken) {
            setError("Error: User not logged in. Please log in again.");
            setIsLoading(false);
            // In a real app, you would navigate to the login page here.
            return;
        }

        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
                    method: 'GET',
                    headers: {
                        // Send the mock token for server authentication
                        'Authorization': `Bearer ${userToken}`, 
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch profile data.');
                }

                const data = await response.json();
                
                // Map API data (backend returns username, collegeName, universityName, major)
                setProfileData(prev => ({
                    ...prev,
                    name: data.username || data.fullName || prev.name,
                    college: data.collegeName || data.college || prev.college,
                    // Show major and university in the course line for now
                    course: data.major ? `${data.major} • ${data.universityName || ''}`.trim() : prev.course,
                    dob: data.dob || prev.dob,
                    age: data.age || prev.age,
                    profilePicture: data.profilePicture || prev.profilePicture
                }));
                setError(null);

            } catch (err) {
                console.error('Profile fetch error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();

    }, []); 

    // --- Local Storage Save for Edits ---
    useEffect(() => {
        // This effect runs only once to load saved local edits, but we now prioritize API data.
        // We keep this here just for local profile picture and static field saving logic.
        const savedData = localStorage.getItem('profileData');
        if (savedData) {
            setProfileData(prev => ({ ...prev, ...JSON.parse(savedData) }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const fieldName = id.replace('input-', '');
        setProfileData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileData(prev => ({...prev, profilePicture: event.target.result}));
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleEditMode = () => {
        if (isEditMode) {
            // NOTE: In a real application, 'Save Changes' would trigger a PUT/PATCH API call here
            // to update the user data in the database, not just localStorage.
            localStorage.setItem('profileData', JSON.stringify(profileData));
        }
        setIsEditMode(!isEditMode);
    };

    if (isLoading) {
        return <div className="loading-screen p-10 text-center font-bold text-lg">Loading Profile...</div>;
    }

    if (error) {
        return <div className="error-screen p-10 text-center text-red-600 font-medium">Error: {error}</div>;
    }

    return (
        <>
            <NeuralCanvas />
            <main className="container p-4 sm:p-8 max-w-6xl mx-auto">
                <div className="profile-layout grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Profile Sidebar */}
                    <aside className="profile-sidebar lg:col-span-1">
                        <div className="widget profile-card-container bg-white shadow-xl rounded-xl overflow-hidden p-6 border border-gray-100">
                            <div className="widget-content profile-card flex flex-col items-center text-center">
                                
                                {/* Profile Picture and Edit Overlay */}
                                <label htmlFor="profile-picture-input" className={`profile-picture-wrapper relative cursor-pointer ${isEditMode ? 'edit-mode' : ''} mb-4 block`}>
                                    <img 
                                        src={profileData.profilePicture} 
                                        alt="Profile" 
                                        className="profile-picture w-32 h-32 rounded-full object-cover border-4 border-emerald-400 transition-all duration-300 hover:opacity-80" 
                                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x150/ef4444/ffffff?text=Error" }}
                                    />
                                    <div className="edit-overlay absolute inset-0 bg-black bg-opacity-40 text-white flex items-center justify-center opacity-0 transition-opacity duration-300 rounded-full">
                                        Click to Change
                                    </div>
                                </label>
                                <input type="file" id="profile-picture-input" accept="image/*" style={{ display: 'none' }} onChange={handlePictureChange} disabled={!isEditMode} />
                                
                                {/* User Info */}
                                <h2 className="profile-name text-2xl font-bold text-gray-800">{profileData.name}</h2>
                                <h3 className="profile-course text-md text-emerald-600 mb-4">{profileData.course}</h3>
                                
                                {/* Details List */}
                                <ul className={`profile-details text-left w-full space-y-3 ${isEditMode ? 'edit-mode' : ''}`}>
                                    {[
                                        { label: 'College', id: 'college', value: profileData.college },
                                        { label: 'DOB', id: 'dob', value: profileData.dob },
                                        { label: 'Age', id: 'age', value: profileData.age }
                                    ].map(({ label, id, value }) => (
                                        <li key={id} className="border-b pb-2">
                                            <strong className="text-gray-500 text-sm block">{label}</strong>
                                            <div className="value-wrapper relative">
                                                <span className={`${isEditMode ? 'hidden' : 'block'} text-gray-700 font-medium`}>{value}</span>
                                                <input 
                                                    type="text" 
                                                    id={`input-${id}`} 
                                                    value={value} 
                                                    onChange={handleInputChange} 
                                                    className={`editable-input w-full p-1 border rounded focus:ring-emerald-500 focus:border-emerald-500 ${isEditMode ? 'block' : 'hidden'}`}
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                
                                {/* Edit Button */}
                                <button onClick={toggleEditMode} className="edit-profile-btn mt-6 w-full py-2 rounded-lg text-white font-semibold transition duration-200 shadow-md 
                                    bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 hover:shadow-lg">
                                    {isEditMode ? 'Save Changes' : 'Edit Profile'}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <section className="main-content lg:col-span-2 space-y-8">
                        {/* Example Widget 1: Todo List */}
                        <div className="widget bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">My Study Planner (To-Do)</h3>
                            <TodoList />
                        </div>
                        
                        {/* Example Widget 2: Recent Activity */}
                         <div className="widget bg-white shadow-xl rounded-xl p-6 border border-gray-100">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Interview Attempts</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">Backend Engineering Mock</span>
                                    <span className="text-sm text-yellow-600 font-medium">Score: 78%</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">Data Structures & Algorithms</span>
                                    <span className="text-sm text-red-600 font-medium">Score: 45%</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">Machine Learning Concepts</span>
                                    <span className="text-sm text-emerald-600 font-medium">Score: 92%</span>
                                </div>
                            </div>
                        </div>
                        {/* ... etc */}
                    </section>
                </div>
            </main>
        </>
    );
};

export default Profile;
