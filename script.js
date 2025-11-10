// AI Configuration
const AI_CONFIG = {
    apiKey: 'AIzaSyARclNvgJwnomgTUSTr7n6DpiltNsX246g',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    maxTokens: 1000,
    temperature: 0.8  // Slightly higher for more natural, varied responses
};

// State
let state = {
    currentUser: null,
    currentChatId: null,
    currentTheme: 'light',
    isListening: false,
    recognition: null,
    chatHistory: {},
    messageIdCounter: 0,
    sidebarOpen: false,
    conversationContext: []
};

const sessionStart = Date.now();

// System Prompt for AI
const SYSTEM_PROMPT = `You are SolarBot, a friendly and knowledgeable solar energy expert helping people in St. Louis understand solar panels. You're enthusiastic about solar but not pushy - you genuinely want to help people make informed decisions.

ABOUT YOU:
- You are an AI assistant powered by Gemini 2.0 Flash
- You're designed specifically to help with solar energy questions
- It's totally fine to acknowledge you're an AI if someone asks
- Be honest and straightforward about what you are

CORE PERSONALITY:
- Friendly, conversational, and natural (like talking to a helpful friend)
- Enthusiastic about solar benefits but grounded in reality
- Patient and educational but not condescending
- Empathetic to concerns and hesitations
- Honest and data-driven

KEY FACTS ABOUT ST. LOUIS & SOLAR:
- St. Louis gets 4.5 peak sun hours daily - great for solar
- 30% federal tax credit brings costs down significantly
- Missouri offers 5% state rebate
- Typical 5-10 kW systems cost $15k-$25k before incentives
- Payback period usually 6-12 years
- Systems last 25-30 years
- Winter performance is actually good - cold temps make panels MORE efficient
- Snow slides off quickly - not a real problem
- Financing available with $0 down

SOLAR MAP FEATURE:
- I have access to an Interactive Solar Map tool that shows solar irradiance data across the US
- When users ask about sunlight, location-specific solar potential, comparing regions, or viewing solar data by area, naturally suggest: "Want to see how much sunlight your specific area gets? I can show you our Interactive Solar Map!"
- Keywords that warrant mentioning the map: "sunlight", "peak sun", "location", "hours", "region", "area", "map", "comparison", "potential", "irradiance"
- The map shows: peak sun hours/day, recommended system size for that location, estimated monthly generation
- Users can click on any location to see detailed solar data
- Frame it naturally in conversation, not as a forced tool

WHAT YOU DO:
- Answer solar energy questions in detail and with examples
- Help people understand costs, savings, incentives
- Address concerns honestly (maintenance, weather, moving, roof issues)
- Provide St. Louis-specific info whenever relevant
- Suggest the Solar Map tool naturally when discussing geographic/location solar potential
- Suggest calculator when discussing financial scenarios
- Suggest weather tool when discussing weather/clouds/conditions
- Acknowledge you're an AI if asked - be transparent

WHAT NOT TO DO:
- Don't be pushy or salesy
- Don't give one-word answers
- Don't ignore what the person actually asked
- Don't force tool recommendations
- Don't pretend to be human

TONE EXAMPLES:
- Good: "Yeah, a lot of people wonder about winter! The cool thing is cold temperatures actually make solar panels more efficient. Plus with St. Louis's 4.5 peak sun hours daily, you're producing solid power even in winter."
- Bad: "Let me show you the weather widget to demonstrate St. Louis solar conditions."
- Good: "Solar potential really varies by location! Want to see how much sunlight your specific area gets? I can show you our Interactive Solar Map - you can click anywhere to see peak sun hours and estimated generation for that spot."
- Bad: "Let me force you to use the solar map."

IF ASKED IF YOU'RE AN AI:
- Be honest and straightforward
- Example: "Yeah, I'm an AI assistant powered by Gemini 2.0 Flash. I'm specifically trained to help with solar energy questions for St. Louis homeowners. What would you like to know?"
- Don't be defensive or evasive about it

Remember: Be helpful, be real, be enthusiastic about solar without being fake. If you don't know something, say so. Keep responses 1-3 sentences usually, longer if explaining something complex.`;


// Users
const USERS = {
    'demo': 'demo123',
    'admin': 'admin123',
    'user': 'user123'
};

// Init
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    
    // Check if already logged in
    const savedUser = localStorage.getItem('solarbot_user');
    if (savedUser && USERS[savedUser]) {
        console.log('Found saved user:', savedUser);
        state.currentUser = savedUser;
        goToApp();
    }
    
    // Setup login form
    const form = document.getElementById('loginForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            tryLogin();
            return false;
        };
    }
    
    initializeSpeechRecognition();
    initializeScrollDetection();
});

function tryLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('Trying login:', username);
    
    if (USERS[username] && USERS[username] === password) {
        console.log('Login success!');
        state.currentUser = username;
        localStorage.setItem('solarbot_user', username);
        goToApp();
    } else {
        console.log('Login failed');
        alert('Invalid username or password');
        document.getElementById('password').value = '';
    }
}

function goToApp() {
    console.log('Going to app');
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    document.getElementById('currentUser').textContent = state.currentUser;
    
    loadUserData();
    loadChatHistory();
    
    if (!state.currentChatId) {
        createNewChat();
    }
    
    setTimeout(function() {
        showMotivationalBanner();
    }, 500);
}

function handleLogout() {
    if (confirm('Logout?')) {
        saveCurrentChat();
        localStorage.removeItem('solarbot_user');
        state.currentUser = null;
        state.currentChatId = null;
        
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// Motivational Banner
const quotes = [
    'Welcome! Every sunny day is an opportunity to save with solar energy.',
    'The best time to go solar was yesterday. The second best time is today!',
    'St. Louis gets 4.5 hours of peak sunlight daily - perfect for solar!',
    'Solar panels are an investment in your future.',
    'Join hundreds of St. Louis families already saving with solar.'
];

function showMotivationalBanner() {
    const banner = document.getElementById('motivationalBanner');
    const text = document.getElementById('bannerText');
    
    if (!banner || !text) return;
    
    if (sessionStorage.getItem('banner_closed')) {
        banner.classList.add('hidden');
        return;
    }
    
    text.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    banner.classList.remove('hidden');
}

function closeBanner() {
    document.getElementById('motivationalBanner').classList.add('hidden');
    sessionStorage.setItem('banner_closed', 'true');
}

function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = false;
        
        state.recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('userInput').value = transcript;
            stopVoice();
        };
        
        state.recognition.onerror = function(event) {
            console.error('Speech error:', event.error);
            stopVoice();
        };
        
        state.recognition.onend = function() {
            stopVoice();
        };
    } else {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) voiceBtn.style.display = 'none';
    }
}

function initializeScrollDetection() {
    const chatWrapper = document.getElementById('chatWrapper');
    if (chatWrapper) {
        chatWrapper.addEventListener('scroll', function() {
            const scrollBottom = document.getElementById('scrollBottom');
            const isScrolledUp = this.scrollHeight - this.scrollTop - this.clientHeight > 100;
            if (scrollBottom) scrollBottom.classList.toggle('visible', isScrolledUp);
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    state.sidebarOpen = !state.sidebarOpen;
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
    } else {
        sidebar.classList.toggle('collapsed');
    }
}

function toggleMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.toggle('show');
}

function closeMenuDropdown() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.remove('show');
}

document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('menuDropdown');
    const menuButton = event.target.closest('.icon-btn');
    
    if (dropdown && !dropdown.contains(event.target) && !menuButton) {
        dropdown.classList.remove('show');
    }
});

function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    
    state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    
    if (state.currentTheme === 'dark') {
        body.classList.add('dark-theme');
        toggle.textContent = '☀️';
    } else {
        body.classList.remove('dark-theme');
        toggle.textContent = '🌙';
    }
    
    saveUserData();
}

function toggleVoice() {
    if (state.isListening) {
        stopVoice();
    } else {
        startVoice();
    }
}

function startVoice() {
    if (state.recognition) {
        try {
            state.isListening = true;
            document.getElementById('voiceBtn').style.color = '#ef4444';
            state.recognition.start();
        } catch (error) {
            console.error('Voice error:', error);
            stopVoice();
        }
    }
}

function stopVoice() {
    if (state.recognition && state.isListening) {
        try {
            state.isListening = false;
            document.getElementById('voiceBtn').style.color = '';
            state.recognition.stop();
        } catch (error) {
            console.error('Error stopping voice:', error);
        }
    }
}

function openContactForm() {
    const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf0bvHj2dJ3mAQo_FX-cdfG4md5pvnybIXOLCs67uYlFbIy7Q/viewform';
    window.open(formUrl, '_blank');
    
    setTimeout(function() {
        addMessage("I've opened our contact form in a new tab! Please fill it out and our solar experts will reach out to you within 24 hours.", false);
    }, 300);
}

function showWeather() {
    const conditions = [
        { condition: 'Sunny', icon: '☀', potential: 95, temp: 75, sunHours: 9, uvIndex: 8, cloudCover: 5 },
        { condition: 'Mostly Sunny', icon: '🌤', potential: 85, temp: 72, sunHours: 7, uvIndex: 7, cloudCover: 20 },
        { condition: 'Partly Cloudy', icon: '⛅', potential: 70, temp: 68, sunHours: 5, uvIndex: 5, cloudCover: 45 }
    ];
    
    const weather = conditions[Math.floor(Math.random() * conditions.length)];
    
    let message = 'Excellent conditions! Your panels would produce peak power today.';
    if (weather.potential < 80) message = 'Good solar day! Panels producing strong energy.';
    if (weather.potential < 60) message = 'Moderate conditions. Panels still generating decent power.';
    
    const weatherHTML = '<div class="weather-widget">' +
        '<div class="weather-location">St. Louis, Missouri</div>' +
        '<div class="weather-header">' +
        '<div><div class="weather-temp">' + weather.temp + '°F</div>' +
        '<div class="weather-condition">' + weather.condition + '</div></div>' +
        '<div class="weather-icon">' + weather.icon + '</div></div>' +
        '<div class="solar-potential">' +
        '<div class="potential-label">Today\'s Solar Production Potential</div>' +
        '<div class="potential-value">' + weather.potential + '%</div>' +
        '<div style="font-size: 13px; margin-top: 8px; opacity: 0.9;">' + message + '</div></div>' +
        '<div class="weather-details">' +
        '<div class="weather-detail"><div class="weather-detail-label">Sunlight Hours</div>' +
        '<div class="weather-detail-value">' + weather.sunHours + 'h</div></div>' +
        '<div class="weather-detail"><div class="weather-detail-label">UV Index</div>' +
        '<div class="weather-detail-value">' + weather.uvIndex + '</div></div>' +
        '<div class="weather-detail"><div class="weather-detail-label">Cloud Cover</div>' +
        '<div class="weather-detail-value">' + weather.cloudCover + '%</div></div></div>' +
        '<div style="margin-top: 16px; font-size: 12px; opacity: 0.8; text-align: center;">' +
        'St. Louis averages 4.5 peak sun hours daily - excellent for solar energy!</div></div>';
    
    addCustomMessage(weatherHTML, false);
}

function showCalculator() {
    const calcHTML = '<div class="calculator-container">' +
        '<h3>St. Louis Solar Savings Calculator</h3>' +
        '<p class="calc-subtitle">Customized for the Greater St. Louis, Missouri region</p>' +
        '<div class="calc-input-group"><label>Monthly Electric Bill ($)</label>' +
        '<input type="number" id="electricBill" placeholder="Enter your average monthly bill" value="150" min="0" step="10">' +
        '<small class="input-hint">Average St. Louis household: $140-180/month</small></div>' +
        '<div class="calc-input-group"><label>Home Size (Square Feet)</label>' +
        '<input type="number" id="homeSize" placeholder="Enter your home size" value="2000" min="500" step="100">' +
        '<small class="input-hint">Helps determine optimal system size</small></div>' +
        '<div class="calc-input-group"><label>Roof Condition</label><select id="roofCondition">' +
        '<option value="excellent">Excellent (0-5 years old)</option>' +
        '<option value="good" selected>Good (6-15 years old)</option>' +
        '<option value="fair">Fair (16-25 years old)</option>' +
        '<option value="poor">Poor (needs replacement)</option></select></div>' +
        '<div class="calc-input-group"><label>Roof Shading</label><select id="roofShading">' +
        '<option value="none" selected>Minimal/No shade</option>' +
        '<option value="partial">Partial shade (some trees)</option>' +
        '<option value="significant">Significant shade (many trees)</option></select></div>' +
        '<button class="calc-button" onclick="calculateSavings()">Calculate My St. Louis Savings</button>' +
        '<div class="calc-results" id="calcResults"></div></div>';
    
    addCustomMessage(calcHTML, false);
}

function calculateSavings() {
    const electricBill = parseFloat(document.getElementById('electricBill').value) || 150;
    const homeSize = parseFloat(document.getElementById('homeSize').value) || 2000;
    const roofCondition = document.getElementById('roofCondition').value || 'good';
    const roofShading = document.getElementById('roofShading').value || 'none';
    
    if (electricBill <= 0 || homeSize <= 0) {
        alert('Please enter valid numbers');
        return;
    }
    
    let systemSize = 5;
    if (homeSize >= 2500) systemSize = 10;
    else if (homeSize >= 1500) systemSize = 7;
    
    let shadingFactor = 1.0;
    if (roofShading === 'partial') shadingFactor = 0.85;
    if (roofShading === 'significant') shadingFactor = 0.70;
    
    const systemCost = systemSize * 3100;
    const federalCredit = systemCost * 0.30;
    const stateRebate = systemCost * 0.05;
    const netCost = systemCost - federalCredit - stateRebate;
    
    const annualProduction = systemSize * 1000 * 4.5 * 365 * shadingFactor * 0.78;
    const annualSavings = (annualProduction / 1000) * 0.12;
    const paybackYears = (netCost / annualSavings).toFixed(1);
    const lifetime25Savings = (annualSavings * 25 - netCost).toFixed(0);
    const monthlyPayment = (netCost / 180).toFixed(0);
    const monthlySavings = (annualSavings / 12).toFixed(0);
    
    const resultsHTML = '<div class="result-highlight">' +
        '<div class="result-label">Recommended System Size for Your Home</div>' +
        '<div class="result-value" style="font-size: 28px; color: #ff8c00;">' + systemSize + ' kW</div>' +
        '<small style="color: var(--text-secondary);">Optimized for ' + homeSize + ' sq ft in St. Louis</small></div>' +
        '<div class="result-section-title">Cost Breakdown</div>' +
        '<div class="result-item"><div class="result-label">System Cost (Before Incentives)</div>' +
        '<div class="result-value">$' + systemCost.toLocaleString() + '</div></div>' +
        '<div class="result-item"><div class="result-label">Federal Tax Credit (30%)</div>' +
        '<div class="result-value" style="color: #10a37f;">-$' + federalCredit.toLocaleString() + '</div></div>' +
        '<div class="result-item"><div class="result-label">Missouri State Rebate (5%)</div>' +
        '<div class="result-value" style="color: #10a37f;">-$' + stateRebate.toLocaleString() + '</div></div>' +
        '<div class="result-item highlight"><div class="result-label">Your Net Investment</div>' +
        '<div class="result-value" style="font-size: 24px;">$' + netCost.toLocaleString() + '</div></div>' +
        '<div class="result-section-title">Financial Summary</div>' +
        '<div class="result-item"><div class="result-label">Annual Savings</div>' +
        '<div class="result-value">$' + annualSavings.toLocaleString() + '</div></div>' +
        '<div class="result-item"><div class="result-label">Payback Period</div>' +
        '<div class="result-value">' + paybackYears + ' years</div></div>' +
        '<div class="result-item highlight"><div class="result-label">25-Year Net Savings</div>' +
        '<div class="result-value" style="font-size: 32px; color: #10a37f;">$' + Math.abs(lifetime25Savings).toLocaleString() + '</div></div>';
    
    const resultsDiv = document.getElementById('calcResults');
    if (resultsDiv) {
        resultsDiv.innerHTML = resultsHTML;
        resultsDiv.classList.add('show');
        setTimeout(function() { scrollToBottom(); }, 100);
    }
}

function exportChat() {
    if (!state.currentChatId || !state.chatHistory[state.currentChatId]) {
        alert('No messages to export');
        return;
    }
    
    const chat = state.chatHistory[state.currentChatId];
    let text = '=== SolarBot Chat Transcript ===\nDate: ' + new Date().toLocaleString() + '\n\n';
    
    chat.messages.forEach(function(msg) {
        const role = msg.role === 'user' ? 'You' : 'SolarBot';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        text += '[' + time + '] ' + role + ':\n' + msg.content + '\n\n';
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SolarBot_Chat_' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadUserData() {
    if (!state.currentUser) return;
    
    const userKey = 'solarbot_chats_' + state.currentUser;
    const saved = localStorage.getItem(userKey);
    
    if (saved) {
        try {
            state.chatHistory = JSON.parse(saved);
        } catch (e) {
            state.chatHistory = {};
        }
    } else {
        state.chatHistory = {};
    }
    
    const savedTheme = localStorage.getItem('solarbot_theme_' + state.currentUser);
    if (savedTheme) {
        state.currentTheme = savedTheme;
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('themeToggle').textContent = '☀️';
        }
    }
}

function saveUserData() {
    if (!state.currentUser) return;
    
    const userKey = 'solarbot_chats_' + state.currentUser;
    localStorage.setItem(userKey, JSON.stringify(state.chatHistory));
    localStorage.setItem('solarbot_theme_' + state.currentUser, state.currentTheme);
}

function saveCurrentChat() {
    if (!state.currentChatId) return;
    
    const chatContainer = document.getElementById('chatContainer');
    const messages = [];
    
    chatContainer.querySelectorAll('.message').forEach(function(msgDiv) {
        const isUser = msgDiv.classList.contains('user');
        const content = msgDiv.querySelector('.message-content').textContent;
        
        if (content) {
            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    if (messages.length > 0) {
        const firstUserMessage = messages.find(function(m) { return m.role === 'user'; });
        const preview = firstUserMessage ? firstUserMessage.content.substring(0, 50) : 'New chat';
        
        state.chatHistory[state.currentChatId] = {
            id: state.currentChatId,
            messages: messages,
            preview: preview,
            createdAt: state.chatHistory[state.currentChatId] ? state.chatHistory[state.currentChatId].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        saveUserData();
    }
}

function createNewChat() {
    saveCurrentChat();
    
    const chatId = 'chat_' + Date.now();
    state.currentChatId = chatId;
    
    // Reset conversation context for new chat
    state.conversationContext = [];
    
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = '<div class="message bot"><div class="message-wrapper">' +
        '<div class="avatar">S</div><div class="message-content">' +
        'Hello! I\'m SolarBot, your AI-powered solar energy assistant. I can help you understand solar panels, calculate potential savings, schedule appointments, and answer all your renewable energy questions. How can I help you today?' +
        '</div></div></div>';
    
    updateSuggestions('');
    loadChatHistory();
}

function loadChat(chatId) {
    if (chatId === state.currentChatId) return;
    
    saveCurrentChat();
    
    const chat = state.chatHistory[chatId];
    if (!chat) return;
    
    state.currentChatId = chatId;
    
    // Rebuild conversation context from chat history
    state.conversationContext = [];
    
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.innerHTML = '';
    
    chat.messages.forEach(function(msg) {
        addMessageToDOM(msg.content, msg.role === 'user');
        
        // Rebuild context (skip initial bot greeting)
        if (msg.content !== "Hello! I'm SolarBot, your AI-powered solar energy assistant. I can help you understand solar panels, calculate potential savings, schedule appointments, and answer all your renewable energy questions. How can I help you today?") {
            state.conversationContext.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        }
    });
    
    loadChatHistory();
    scrollToBottom();
}

function loadChatHistory() {
    const historyContainer = document.getElementById('chatHistory');
    historyContainer.innerHTML = '';
    
    const chats = Object.values(state.chatHistory).sort(function(a, b) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    if (chats.length === 0) {
        historyContainer.innerHTML = '<div style="padding: 12px; text-align: center; color: var(--text-secondary); font-size: 13px;">No chat history yet</div>';
        return;
    }
    
    chats.forEach(function(chat) {
        const chatItem = document.createElement('button');
        chatItem.className = 'chat-history-item';
        if (chat.id === state.currentChatId) {
            chatItem.classList.add('active');
        }
        
        const date = new Date(chat.updatedAt);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        let dateStr = 'Today';
        if (days === 1) dateStr = 'Yesterday';
        else if (days < 7) dateStr = days + 'd ago';
        else dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        chatItem.innerHTML = '<span class="chat-item-text">' + chat.preview + '</span>' +
            '<span class="chat-item-date">' + dateStr + '</span>' +
            '<button class="chat-delete-btn" onclick="deleteChatById(\'' + chat.id + '\', event)">🗑️</button>';
        
        chatItem.onclick = function(e) {
            if (!e.target.classList.contains('chat-delete-btn')) {
                loadChat(chat.id);
            }
        };
        
        historyContainer.appendChild(chatItem);
    });
}

function deleteCurrentChat() {
    if (!state.currentChatId) return;
    
    if (confirm('Delete this chat?')) {
        delete state.chatHistory[state.currentChatId];
        saveUserData();
        createNewChat();
    }
}

function deleteChatById(chatId, event) {
    event.stopPropagation();
    
    if (confirm('Delete this chat?')) {
        delete state.chatHistory[chatId];
        saveUserData();
        
        if (chatId === state.currentChatId) {
            createNewChat();
        } else {
            loadChatHistory();
        }
    }
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    addMessage(message, true);
    input.value = '';
    
    // Check if user mentioned any city and auto-search map
    checkAndAutoSearchMap(message);
    
    // Add to conversation context
    state.conversationContext.push({
        role: 'user',
        content: message
    });
    
    showTypingIndicator();
    
    // Get AI response
    getAIResponse(message).then(function(response) {
        hideTypingIndicator();
        addMessage(response, false);
        
        // Add to conversation context
        state.conversationContext.push({
            role: 'assistant',
            content: response
        });
        
        // Keep only last 10 messages for context
        if (state.conversationContext.length > 20) {
            state.conversationContext = state.conversationContext.slice(-20);
        }
        
        saveCurrentChat();
        input.focus();
    }).catch(function(error) {
        console.error('AI Error:', error);
        hideTypingIndicator();
        
        // Fallback to rule-based response
        const fallbackResponse = getResponse(message);
        addMessage(fallbackResponse, false);
        
        state.conversationContext.push({
            role: 'assistant',
            content: fallbackResponse
        });
        
        saveCurrentChat();
        input.focus();
    });
}

function sendSuggestion(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function addMessage(content, isUser) {
    addMessageToDOM(content, isUser);
    
    if (!isUser) {
        updateSuggestions(content.toLowerCase());
    }
}

function addMessageToDOM(content, isUser) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isUser ? 'user' : 'bot');
    
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = isUser ? 'U' : 'S';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(messageContent);
    messageDiv.appendChild(messageWrapper);
    
    chatContainer.appendChild(messageDiv);
    
    scrollToBottom();
}

function addCustomMessage(htmlContent, isUser) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + (isUser ? 'user' : 'bot');
    
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = isUser ? 'U' : 'S';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = htmlContent;
    
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(messageContent);
    messageDiv.appendChild(messageWrapper);
    
    chatContainer.appendChild(messageDiv);
    
    scrollToBottom();
}

function showTypingIndicator() {
    const chatContainer = document.getElementById('chatContainer');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator active';
    typingDiv.id = 'typingIndicator';
    
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = 'S';
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    dotsDiv.innerHTML = '<span></span><span></span><span></span>';
    
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(dotsDiv);
    typingDiv.appendChild(messageWrapper);
    
    chatContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// AI Response Function
async function getAIResponse(userMessage) {
    console.log('getAIResponse called with:', userMessage);
    
    try {
        // Build the system + user message for Gemini
        const systemPromptText = SYSTEM_PROMPT;
        
        // Get recent context
        const recentContext = state.conversationContext.slice(-10);
        
        // Build conversation history for Gemini format
        let conversationHistory = '';
        recentContext.forEach(function(msg) {
            if (msg.role === 'user') {
                conversationHistory += 'User: ' + msg.content + '\n\n';
            } else if (msg.role === 'assistant') {
                conversationHistory += 'Assistant: ' + msg.content + '\n\n';
            }
        });
        
        // Combine system prompt with conversation history and current message
        const fullPrompt = systemPromptText + '\n\n' + conversationHistory + 'User: ' + userMessage + '\n\nAssistant:';
        
        console.log('Making Gemini API request...');
        console.log('Full prompt:', fullPrompt.substring(0, 200) + '...');
        
        const response = await fetch(AI_CONFIG.apiUrl + '?key=' + AI_CONFIG.apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: fullPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: AI_CONFIG.maxTokens,
                    temperature: AI_CONFIG.temperature
                }
            })
        });
        
        console.log('Gemini Response status:', response.status);
        
        const data = await response.json();
        console.log('Gemini Response data:', data);
        
        if (!response.ok) {
            console.error('Gemini API Error Response:', data);
            throw new Error('Gemini API Error: ' + (data.error?.message || response.status));
        }
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            let aiResponse = data.candidates[0].content.parts[0].text.trim();
            
            // Clean up the response if it starts with "Assistant:"
            if (aiResponse.startsWith('Assistant:')) {
                aiResponse = aiResponse.substring('Assistant:'.length).trim();
            }
            
            console.log('AI Response text:', aiResponse);
            
            // Smart widget triggering based on AI response content
            const lowerResponse = aiResponse.toLowerCase();
            
            if (lowerResponse.includes('calculator')) {
                setTimeout(function() { showCalculator(); }, 800);
            }
            if (lowerResponse.includes('weather') || lowerResponse.includes('forecast') || lowerResponse.includes('production potential')) {
                setTimeout(function() { showWeather(); }, 800);
            }
            if (lowerResponse.includes('contact form') || lowerResponse.includes('consultation') || lowerResponse.includes('schedule')) {
                setTimeout(function() { openContactForm(); }, 800);
            }
            if (lowerResponse.includes('solar map') || lowerResponse.includes('interactive map')) {
                setTimeout(function() { showSolarMap(); }, 800);
            }
            
            return aiResponse;
        } else {
            console.error('Unexpected Gemini response format:', data);
            throw new Error('Invalid Gemini response format');
        }
        
    } catch (error) {
        console.error('AI Error caught:', error);
        console.warn('Falling back to rule-based response');
        throw error;
    }
}

function getResponse(userMessage) {
    const msg = userMessage.toLowerCase();
    
    if (/weather|sun|sunny|cloud|forecast|production.*today/i.test(msg)) {
        setTimeout(function() { showWeather(); }, 500);
        return "Let me show you today's weather and solar production potential for St. Louis!";
    }
    
    if (/calculat|savings|estimate|how much.*save/i.test(msg)) {
        setTimeout(function() { showCalculator(); }, 500);
        return "Great! Let me pull up the solar savings calculator for you.";
    }

    if (/map|solar.*area|sunlight.*location|potential.*region|hours.*location|peak sun.*where|where.*best|region|area.*solar|view.*location|show.*map|explore.*solar|check.*solar.*area|solar.*map|which.*area|compare.*location|solar.*different|region.*solar|geographic|area.*sun/i.test(msg)) {
        setTimeout(function() { showSolarMap(); }, 500);
        return "Perfect! Let me show you our Interactive Solar Map so you can explore solar potential across different regions. You can search any location, compare areas, and see exactly how many peak sun hours you'd get!";
    }
    
    if (/schedule|appointment|consult|book|meet|visit/i.test(msg)) {
        setTimeout(function() { openContactForm(); }, 500);
        return "Excellent! I'd be happy to help you schedule a consultation.";
    }
    
    if (/contact|call|email|reach|speak|talk.*someone/i.test(msg)) {
        setTimeout(function() { openContactForm(); }, 500);
        return "Perfect! I've opened our contact form in a new tab.";
    }
    
    if (/(^|\s)(hi|hello|hey|greetings|good morning)($|\s|!)/i.test(msg)) {
        const greetings = [
            "Hello! I'm SolarBot, your AI solar assistant. What would you like to know about solar energy?",
            "Hey there! I'm here to help you explore solar options. What interests you most?",
            "Hi! Welcome! What can I do for you today?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    if (/why|benefit|advantage|should i|worth it|good idea|pros/i.test(msg)) {
        return "Solar panels offer incredible benefits! Most homeowners save $20,000-$75,000 over 25 years. Your home value increases by 3-4%, and you'll enjoy energy independence. Plus, with current 30% federal tax credits, there's never been a better time. Want to use our calculator?";
    }
    
    if (/cost|price|expensive|afford|pay|money|dollar|investment|financing/i.test(msg)) {
        return "A typical residential system runs $15,000-$25,000 before incentives. The federal tax credit immediately reduces that by 30%. Most homeowners pay $10,500-$17,500 effectively. You can finance with $0 down! Want to calculate your specific costs?";
    }
    
    if (/thank|thanks|appreciate/i.test(msg)) {
        return "You're very welcome! Is there anything else you'd like to know?";
    }
    
    return "That's interesting! Since you're here, would you like to learn about solar benefits? Try our calculator or ask me anything!";
}

function updateSuggestions(context) {
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    let suggestions = [];

    if (context.includes('cost') || context.includes('price')) {
        suggestions = [
            { display: 'Financing options', query: 'How can I afford solar panels?' },
            { display: 'Calculate savings', action: function() { showCalculator(); } },
            { display: 'Payback period', query: 'How long until solar pays for itself?' },
            { display: 'View Solar Map', action: function() { showSolarMap(); } }
        ];
    } else if (context.includes('schedule') || context.includes('appointment')) {
        suggestions = [
            { display: 'Fill contact form', action: function() { openContactForm(); } },
            { display: 'More questions', query: 'I have more questions first' },
            { display: 'Costs', query: 'How much do solar panels cost?' },
            { display: 'View Solar Map', action: function() { showSolarMap(); } }
        ];
    } else if (context.includes('calculator') || context.includes('savings')) {
        suggestions = [
            { display: 'Book appointment', query: 'Schedule a consultation' },
            { display: 'Why solar?', query: 'Why should I get solar panels?' },
            { display: 'View Solar Map', action: function() { showSolarMap(); } },
            { display: 'Contact', action: function() { openContactForm(); } }
        ];
    } else if (context.includes('location') || context.includes('area') || context.includes('sunlight') || context.includes('map')) {
        suggestions = [
            { display: '📍 View Solar Map', action: function() { showSolarMap(); } },
            { display: 'Calculate savings', action: function() { showCalculator(); } },
            { display: 'Learn more', query: 'Tell me about solar benefits' },
            { display: 'Schedule visit', query: 'I want to schedule an appointment' }
        ];
    } else {
        suggestions = [
            { display: 'Why solar?', query: 'Why should I get solar panels?' },
            { display: 'Costs', query: 'How much do solar panels cost?' },
            { display: '📍 View Solar Map', action: function() { showSolarMap(); } },
            { display: 'Calculate savings', action: function() { showCalculator(); } }
        ];
    }

    suggestionsContainer.innerHTML = '';
    suggestions.forEach(function(item) {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = item.display;
        
        if (item.action) {
            btn.onclick = item.action;
        } else {
            btn.onclick = function() { sendSuggestion(item.query); };
        }
        
        suggestionsContainer.appendChild(btn);
    });
}

function scrollToBottom() {
    const chatWrapper = document.getElementById('chatWrapper');
    setTimeout(function() {
        chatWrapper.scrollTo({
            top: chatWrapper.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
}

function trackEvent(eventName, eventData) {
    console.log('Event:', eventName, eventData);
}

// ==================== SOLAR MAP INTEGRATION ====================

/**
 * Show the Interactive Solar Map modal
 */
function showSolarMap() {
    const modal = document.getElementById('solarMapModal');
    if (!modal) {
        console.error('Solar map modal not found');
        return;
    }

    try {
        modal.classList.add('active');
        
        // Check if Google Maps is available
        if (!window.googleMapsReady || !window.google || !window.google.maps) {
            console.warn('Google Maps API not available - using fallback viewer');
            useSolarViewerFallback();
        } else if (!solarMapState.isInitialized) {
            // Try Google Maps version
            const mapResult = initializeSolarMap('solarMapCanvas');
            if (!mapResult) {
                console.warn('Failed to initialize Google Maps - falling back');
                useSolarViewerFallback();
            }
        } else if (solarMapState.mapInstance) {
            // Trigger map resize if it was already initialized
            try {
                google.maps.event.trigger(solarMapState.mapInstance, 'resize');
            } catch (e) {
                console.error('Error with Google Maps:', e);
            }
        }
        
        // Populate region dropdown
        if (window.usingSolarFallback && typeof populateSolarRegionSelect === 'function') {
            populateSolarRegionSelect();
        } else {
            populateRegionDropdown();
        }
        
        console.log('Solar map opened');
    } catch (error) {
        console.error('Error opening solar map:', error);
        console.log('Attempting fallback...');
        
        // Force fallback on any error
        try {
            useSolarViewerFallback();
            populateSolarRegionSelect();
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            modal.classList.remove('active');
            showToast('Could not load solar viewer.');
        }
    }
}

/**
 * Close the Solar Map modal
 */
function closeSolarMap() {
    const modal = document.getElementById('solarMapModal');
    if (modal) {
        modal.classList.remove('active');
        saveMapPreferences();
        console.log('Solar map closed');
    }
}

/**
 * Populate the region dropdown with available regions
 */
function populateRegionDropdown() {
    const select = document.getElementById('solarRegionSelect');
    if (!select || select.innerHTML.length > 30) return; // Already populated
    
    const regions = getAllSolarRegions();
    regions.forEach(function(region) {
        const option = document.createElement('option');
        option.value = region.id;
        option.textContent = `${region.name} (${region.solarHours} hrs/day)`;
        select.appendChild(option);
    });
}

/**
 * Change map region from dropdown
 */
function changeMapRegion(regionKey) {
    if (!regionKey) return;
    
    // If using fallback, use fallback function
    if (window.usingSolarFallback && typeof changeSolarRegion === 'function') {
        changeSolarRegion(regionKey);
        return;
    }
    
    const regionData = getSolarDataByRegion(regionKey);
    if (!regionData || !solarMapState.mapInstance) return;
    
    solarMapState.currentRegion = regionKey;
    
    // Center map on region
    solarMapState.mapInstance.setCenter(regionData.center);
    solarMapState.mapInstance.setZoom(8);
    
    // Update heatmap
    if (SOLAR_MAP_CONFIG.enableHeatmap) {
        addHeatmapLayer();
    }
    
    saveMapPreferences();
    console.log('Changed to region:', regionKey);
}

/**
 * Search for location on map
 */
function searchMapLocation() {
    const input = document.getElementById('solarMapSearch');
    const query = input.value.trim();
    
    if (!query) {
        showToast('Please enter a city or address');
        return;
    }
    
    // Try to find in solar data first
    const regionData = searchSolarLocation(query);
    if (regionData) {
        if (solarMapState.mapInstance) {
            solarMapState.mapInstance.setCenter(regionData.center);
            solarMapState.mapInstance.setZoom(8);
        }
        input.value = '';
        return;
    }
    
    // Use geocoder for custom locations
    if (solarMapState.geocoder && solarMapState.mapInstance) {
        solarMapState.geocoder.geocode({ address: query }, function(results, status) {
            if (status === 'OK' && results.length > 0) {
                const location = results[0].geometry.location;
                solarMapState.mapInstance.setCenter(location);
                solarMapState.mapInstance.setZoom(10);
                
                // Find nearest solar region
                const nearest = findNearestSolarRegion(location.lat(), location.lng());
                if (nearest) {
                    const locInfo = generateLocationInfoPopup(
                        location.lat(),
                        location.lng(),
                        nearest.solarHours,
                        results[0].formatted_address
                    );
                    displayLocationInfo(locInfo);
                }
                
                input.value = '';
            } else {
                showToast('Location not found. Try another search.');
            }
        });
    }
}

/**
 * Display location info in the sidebar
 */
function displayLocationInfo(locInfo) {
    const panel = document.getElementById('mapInfoPanel');
    if (!panel) return;
    
    const systemSize = calculateSystemSizeForLocation(locInfo.solarHours, 2000);
    const monthlyGen = estimateMonthlyGeneration(systemSize, locInfo.solarHours);
    
    const html = `
        <div class="location-info-detail">
            <span class="info-label">Location:</span>
            <span class="info-value">${locInfo.name}</span>
        </div>
        <div class="location-info-detail">
            <span class="info-label">Peak Sun Hours:</span>
            <span class="info-value" style="color: ${locInfo.color};">${locInfo.solarHours} hrs/day</span>
        </div>
        <div class="location-info-detail">
            <span class="info-label">Category:</span>
            <span class="info-value">${locInfo.category}</span>
        </div>
        <div class="location-info-detail">
            <span class="info-label">Recommended System:</span>
            <span class="info-value">${systemSize} kW</span>
        </div>
        <div class="location-info-detail">
            <span class="info-label">Monthly Gen:</span>
            <span class="info-value">${monthlyGen.toLocaleString()} kWh</span>
        </div>
    `;
    
    panel.innerHTML = html;
}

/**
 * Toggle between heatmap and markers layer
 */
function toggleMapLayer(layerType) {
    if (!solarMapState.mapInstance) return;
    
    solarMapState.currentLayerType = layerType;
    
    const heatmapBtn = document.getElementById('heatmapLayerBtn');
    const markersBtn = document.getElementById('markersLayerBtn');
    
    if (layerType === 'heatmap') {
        if (heatmapBtn) heatmapBtn.classList.add('active');
        if (markersBtn) markersBtn.classList.remove('active');
        
        // Hide markers, show heatmap
        if (solarMapState.heatmapInstance) {
            solarMapState.heatmapInstance.setMap(solarMapState.mapInstance);
        } else {
            addHeatmapLayer();
        }
        
        // Hide markers
        solarMapState.markers.forEach(function(marker) {
            marker.setMap(null);
        });
    } else if (layerType === 'markers') {
        if (markersBtn) markersBtn.classList.add('active');
        if (heatmapBtn) heatmapBtn.classList.remove('active');
        
        // Hide heatmap
        if (solarMapState.heatmapInstance) {
            solarMapState.heatmapInstance.setMap(null);
        }
        
        // Show markers
        const regionData = getSolarDataByRegion(solarMapState.currentRegion);
        if (regionData) {
            regionData.data.forEach(function(point) {
                const marker = new google.maps.Marker({
                    position: { lat: point.lat, lng: point.lng },
                    map: solarMapState.mapInstance,
                    title: `${point.value} hrs/day`,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: getSolarColorForValue(point.value),
                        fillOpacity: 0.8,
                        strokeColor: '#fff',
                        strokeWeight: 2
                    }
                });
                solarMapState.markers.push(marker);
                
                marker.addListener('click', function() {
                    showLocationInfo(point.lat, point.lng, `Location (${point.value} hrs/day)`, point.value);
                });
            });
        }
    }
    
    saveMapPreferences();
}

/**
 * Compare user's location with St. Louis average
 */
function compareLocations() {
    if (!solarMapState.selectedLocation) {
        showToast('Please click on a location on the map first');
        return;
    }
    
    const stLouisHours = 4.5;
    const selectedHours = solarMapState.selectedLocation.solarHours;
    const difference = selectedHours - stLouisHours;
    const percentDiff = ((difference / stLouisHours) * 100).toFixed(1);
    
    let comparison = '';
    if (difference > 0) {
        comparison = `This location gets ${Math.abs(percentDiff)}% MORE sunlight than St. Louis (${selectedHours} vs 4.5 hrs/day).`;
    } else if (difference < 0) {
        comparison = `This location gets ${Math.abs(percentDiff)}% LESS sunlight than St. Louis (${selectedHours} vs 4.5 hrs/day).`;
    } else {
        comparison = `This location matches St. Louis average (${selectedHours} hrs/day).`;
    }
    
    const systemSize = calculateSystemSizeForLocation(selectedHours, 2000);
    const monthlyGen = estimateMonthlyGeneration(systemSize, selectedHours);
    const stLouisMonthly = estimateMonthlyGeneration(5, stLouisHours); // Assuming 5kW in St. Louis
    
    const message = `📊 Solar Comparison:\n\n${comparison}\n\nFor a typical 2000 sq ft home:\n- Recommended system: ${systemSize} kW\n- Monthly generation: ${monthlyGen} kWh\n- Better fit for solar? ${selectedHours > stLouisHours ? 'Yes!' : 'Still good!'}`;
    
    addMessage(message, false);
}

/**
 * Handle auto-response when user clicks map location
 */
function triggerSolarMapAutoResponse(locationName, solarHours) {
    if (!state.currentChatId) return;
    
    const systemSize = calculateSystemSizeForLocation(solarHours, 2000);
    const monthlyGen = estimateMonthlyGeneration(systemSize, solarHours);
    const category = getSolarCategoryLabel(solarHours);
    
    const response = `📍 **${locationName}**\n\n` +
        `Peak sun hours: **${solarHours} hrs/day** (${category})\n\n` +
        `For a typical 2,000 sq ft home, I'd recommend a **${systemSize} kW system**. ` +
        `That would generate roughly **${monthlyGen} kWh per month** - enough to offset most of your electric bill!\n\n` +
        `Interested in learning more about solar potential in this area?`;
    
    addMessage(response, false);
    
    saveCurrentChat();
}

/**
 * Google Maps API loaded callback
 */
function onGoogleMapsLoaded() {
    console.log('Google Maps API loaded successfully');
    window.googleMapsReady = true;
    
    // Try to initialize map if modal is open
    const modal = document.getElementById('solarMapModal');
    if (modal && modal.classList.contains('active')) {
        setTimeout(function() {
            if (!solarMapState.isInitialized) {
                initializeSolarMap('solarMapCanvas');
            }
        }, 100);
    }
}

/**
 * Fallback if Google Maps API fails to load or has billing issues
 * Called automatically or on error
 */
function useSolarViewerFallback() {
    console.log('Using Solar Viewer Fallback (No Google Maps)');
    
    // Mark that we're using fallback
    window.usingSolarFallback = true;
    solarMapState.isInitialized = true;
    
    // Load fallback functions
    if (typeof initializeSolarViewerFallback === 'function') {
        initializeSolarViewerFallback();
    }
    
    // Update dropdown
    if (typeof populateSolarRegionSelect === 'function') {
        populateSolarRegionSelect();
    }
}

/**
 * Check user message for city mentions and auto-search map
 * Called when user mentions specific cities in conversation
 */
function checkAndAutoSearchMap(userMessage) {
    const msg = userMessage.toLowerCase();
    
    // List of pre-loaded regions to auto-search
    const cityPatterns = {
        'denver': 'denver',
        'phoenix': 'phoenix',
        'los angeles': 'los-angeles',
        'seattle': 'seattle',
        'miami': 'miami',
        'boston': 'boston',
        'atlanta': 'atlanta',
        'austin': 'austin',
        'chicago': 'chicago',
        'kansas city': 'kansas-city',
        'springfield': 'springfield-mo'
    };
    
    // Check if user mentioned any city
    for (const [city, regionKey] of Object.entries(cityPatterns)) {
        if (msg.includes(city)) {
            // Auto-open map and search for this city
            setTimeout(function() {
                showSolarMap();
                setTimeout(function() {
                    // After map opens, jump to the region
                    if (solarMapState.mapInstance) {
                        changeMapRegion(regionKey);
                    }
                }, 500);
            }, 100);
            return true;
        }
    }
    
    return false;
}



