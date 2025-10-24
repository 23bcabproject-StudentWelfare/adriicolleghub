// src/components/TodoList.js
import React, { useState, useEffect } from 'react';

// SVG Icon for the Add button
const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

// SVG Icon for the Checkbox tick
const CheckIcon = () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const TodoList = () => {
    const [tasks, setTasks] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        setTasks(savedTasks.map(task => ({ ...task, isNew: false })));
    }, []);

    const saveTasks = (newTasks) => {
        localStorage.setItem('tasks', JSON.stringify(newTasks.map(({isNew, ...rest}) => rest)));
        setTasks(newTasks);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (text) {
            const newTasks = [{ text, completed: false, isNew: true }, ...tasks];
            saveTasks(newTasks);
            setInputValue('');
            setTimeout(() => {
                const animatedTasks = newTasks.map((task, index) => index === 0 ? { ...task, isNew: false } : task);
                setTasks(animatedTasks);
            }, 10);
        }
    };

    const deleteTask = (indexToDelete) => {
        const updatedTasks = tasks.map((task, index) => 
            index === indexToDelete ? { ...task, isDeleting: true } : task
        );
        setTasks(updatedTasks);
        setTimeout(() => {
            const newTasks = tasks.filter((_, index) => index !== indexToDelete);
            saveTasks(newTasks);
        }, 400);
    };

    const toggleComplete = (indexToToggle) => {
        const newTasks = [...tasks];
        newTasks[indexToToggle].completed = !newTasks[indexToToggle].completed;
        saveTasks(newTasks);
    };

    return (
        <div className="widget">
            <div className="widget-content">
                <h3 className="widget-title">Task Matrix</h3>
                <form id="todo-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="todo-input"
                        placeholder="Add a new task..."
                        autoComplete="off"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button type="submit" aria-label="Add Task"><AddIcon /></button>
                </form>
                <ul id="todo-list">
                    {tasks.map((task, index) => (
                        <li key={index} className={`todo-item ${task.completed ? 'completed' : ''} ${task.isNew ? 'new' : ''} ${task.isDeleting ? 'deleting' : ''}`}>
                            <div className="checkbox" onClick={() => toggleComplete(index)}>
                                <CheckIcon />
                            </div>
                            <span>{task.text}</span>
                            <button className="delete-btn" onClick={() => deleteTask(index)}>✖</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TodoList;