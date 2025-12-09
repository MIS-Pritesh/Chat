// script.js
// --- CONFIGURATION ---
// PASTE YOUR ACTUAL VERCEL DOMAIN HERE
const API_BASE_URL = 'https://chat-neon-ten.vercel.app'; 
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

async function fetchData(endpoint, method = 'GET') {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
        const response = await fetch(url, { method: method });
        
        if (!response.ok) {
            const errorDetails = await response.json().catch(() => ({}));
            throw new Error(`HTTP Error ${response.status}: Failed to reach API. URL: ${url}`);
        }
        
        const data = await response.json();
        
        if (data && (data.error || data.detail)) {
             throw new Error(data.error || data.detail);
        }

        return data;

    } catch (error) {
        addMessage('bot', `**FATAL ERROR** (Data/API): The app failed to fetch data. Error: ${error.message}.`);
        addMessage('bot', `Please check Vercel Logs for errors related to **Data.csv** loading.`);
        throw error;
    }
}

// 1. Loads the main subject menu
async function loadMainMenu() {
    currentSubject = null;
    
    try {
        const data = await fetchData('/menu');
        loadOptions('Choose an Option:', data, loadQuestionMenu, 'menu');
    } catch (error) {
        // Error already logged by fetchData
    }
}

// 2. Loads the questions for a selected subject
async function loadQuestionMenu(encodedSubject, subjectText) {
    currentSubject = subjectText;
    
    try {
        const data = await fetchData(`/questions/${encodedSubject}`);
        loadOptions(`Questions for: ${subjectText}`, data, getAnswer, 'questions');
    } catch (error) {
        // Error already logged by fetchData
        loadMainMenu(); 
    }
}

// 3. Gets the answer for a selected question
async function getAnswer(encodedQuestion, questionText) {
    addMessage('bot', `<strong>Question:</strong> ${questionText}`); 
    
    try {
        const data = await fetchData(`/answer?question=${encodedQuestion}`);
        
        addMessage('bot', `<strong>Answer:</strong> ${data.answer}`);
        addMessage('bot', `✅ Got it! Ready for your next question.`); 
        
        loadMainMenu();
    } catch (error) {
        // Error already logged by fetchData
        loadMainMenu();
    }
}

// Start the application by loading the main menu
document.addEventListener('DOMContentLoaded', loadMainMenu);
