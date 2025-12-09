// script.js
// --- CONFIGURATION ---
// !!! IMPORTANT: YOU MUST REPLACE THIS PLACEHOLDER WITH YOUR LIVE VERCEL DOMAIN !!!
// Example: 'https://my-stable-chatbot.vercel.app'
const API_BASE_URL = 'YOUR_LIVE_VERCEL_DOMAIN_HERE'; 
// Do NOT include a trailing slash (/)

// --- STATE MANAGEMENT ---
let currentSubject = null; 

const chatHistory = document.getElementById('chatHistory');
const optionsContainer = document.getElementById('optionsContainer');

// --- HELPER FUNCTIONS ---

function addMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = content;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function loadOptions(title, options, clickHandler, type) {
    optionsContainer.innerHTML = `<h3>${title}</h3>`;
    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => clickHandler(encodeURIComponent(option), option); 
        optionsContainer.appendChild(button);
    });

    if (type === 'questions') {
        const backButton = document.createElement('button');
        backButton.textContent = "⬅️ Go Back to Main Menu";
        backButton.onclick = () => loadMainMenu();
        optionsContainer.appendChild(backButton);
    }
}

// --- API FETCH LOGIC ---

// 1. Loads the main subject menu
async function loadMainMenu() {
    currentSubject = null;
    const url = `${API_BASE_URL}/menu`; // No /api/ needed due to vercel.json routes
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error || response.status !== 200) throw new Error(data.detail || 'API Error');

        loadOptions('Choose an Option:', data, loadQuestionMenu, 'menu');
    } catch (error) {
        addMessage('bot', `Error loading menu: Could not connect to API at ${url}`);
    }
}

// 2. Loads the questions for a selected subject
async function loadQuestionMenu(encodedSubject, subjectText) {
    currentSubject = subjectText;
    const url = `${API_BASE_URL}/questions/${encodedSubject}`; 
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error || response.status !== 200) throw new Error(data.detail || 'API Error');
        
        loadOptions(`Questions for: ${subjectText}`, data, getAnswer, 'questions');
    } catch (error) {
        addMessage('bot', `Error loading questions: ${error.message}`);
        loadMainMenu();
    }
}

// 3. Gets the answer for a selected question
async function getAnswer(encodedQuestion, questionText) {
    addMessage('bot', `<strong>Question:</strong> ${questionText}`); 
    
    const url = `${API_BASE_URL}/answer?question=${encodedQuestion}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error || response.status !== 200) throw new Error(data.detail || 'API Error');

        addMessage('bot', `<strong>Answer:</strong> ${data.answer}`);
        
        addMessage('bot', `✅ Got it! Ready for your next question.`); 
        loadMainMenu();
    } catch (error) {
        addMessage('bot', `Error fetching answer: ${error.message}`);
        loadMainMenu();
    }
}

// Start the application by loading the main menu
document.addEventListener('DOMContentLoaded', loadMainMenu);
