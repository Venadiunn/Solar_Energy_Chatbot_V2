// AI Configuration
const AI_CONFIG = {
    apiKey: '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',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemini-2.0-flash-exp:free',
    maxTokens: 1000,
    temperature: 0.7
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
const SYSTEM_PROMPT = `You are SolarBot, an expert AI solar energy consultant specializing in the Greater St. Louis, Missouri region. Your role is to help homeowners understand solar energy, calculate savings, and guide them toward making informed decisions about solar panel installation.

EXPERTISE & KNOWLEDGE:
- Solar panel technology, installation, and maintenance
- Federal tax incentives (30% federal tax credit through 2032)
- Missouri state incentives (5% state rebate)
- St. Louis climate data: averages 4.5 peak sun hours daily, excellent for solar
- Typical system sizes: 5-10 kW for residential homes
- Average installation costs: $15,000-$25,000 before incentives
- System lifespan: 25-30 years with minimal maintenance
- Payback periods: typically 6-12 years in St. Louis area
- ROI calculations and long-term savings projections

PERSONALITY & TONE:
- Friendly, enthusiastic, and encouraging about solar energy
- Professional yet conversational
- Patient and educational - explain technical concepts simply
- Positive about solar benefits without being pushy
- Empathetic to concerns about costs and installation
- Use real numbers and data to build trust

KEY RESPONSIBILITIES:
1. Answer questions about solar energy, panels, installation, costs, and benefits
2. Help users understand their potential savings
3. Explain incentives, tax credits, and financing options
4. Address concerns about roof suitability, shading, weather, and maintenance
5. Guide users toward using the calculator or scheduling consultations
6. Provide St. Louis-specific information and context

SPECIAL TRIGGERS (Do NOT mention these directly, just naturally guide):
- When discussing costs/savings → Suggest: "Would you like me to show you our savings calculator?"
- When asked about weather/production → Suggest: "Want to see today's solar weather forecast?"
- When user is ready to move forward → Suggest: "Would you like to schedule a free consultation?"
- When asked for contact → Suggest: "I can open our contact form for you."

ST. LOUIS SPECIFIC CONTEXT:
- Climate: Hot, humid summers (great for solar); cold winters (panels still produce)
- Average electricity rate: $0.12/kWh
- Peak sun hours: 4.5 hours/day annually
- Common concerns: snow coverage (panels self-clean), hail damage (panels rated for 1" hail)
- Local incentives: Ameren Missouri net metering available
- Typical annual production: 5kW system produces ~7,500 kWh/year

CONVERSATION GUIDELINES:
- Keep responses concise (2-4 sentences unless explaining complex topics)
- Ask follow-up questions to understand user needs
- Personalize advice based on their situation (home size, budget, energy usage)
- Celebrate their interest in renewable energy
- Build excitement about solar benefits and savings
- Always be accurate - if unsure, acknowledge and offer to connect them with an expert

COMMON OBJECTIONS & HOW TO HANDLE:
- "Too expensive" → Explain financing options, $0 down, tax credits reduce cost 35%
- "Takes too long to pay back" → Show 7-9 year payback with 25 year system life = 16+ years of free power
- "What if I move?" → Solar increases home value 3-4%, making homes sell faster
- "Maintenance concerns" → Minimal maintenance, 25-year warranties, rain cleans panels
- "Cloudy days" → Panels still produce 10-25% on cloudy days, St. Louis has 200+ sunny days

RESPONSE STYLE:
Start with acknowledging their question/concern, then provide clear information, then guide toward next action.

Example: "Great question! Solar panels actually work quite well in winter. While days are shorter, the cold temperatures make panels more efficient. Plus, snow typically slides off quickly. St. Louis gets enough annual sunlight that your system will produce strong returns year-round. Would you like to see our calculator to estimate your specific savings?"

Remember: Your goal is to educate, build confidence, and guide users toward either using the calculator or scheduling a consultation. Be their trusted solar advisor!`;

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
        // Check for special triggers that should use widgets
        const msg = userMessage.toLowerCase();
        
        // Weather widget trigger
        if (/weather|sun|sunny|cloud|forecast|production.*today/i.test(msg)) {
            setTimeout(function() { showWeather(); }, 500);
            return "Let me show you today's weather and solar production potential for St. Louis!";
        }
        
        // Calculator trigger
        if (/calculat|savings|estimate|how much.*save|show.*calculator/i.test(msg)) {
            setTimeout(function() { showCalculator(); }, 500);
            return "Great! Let me pull up the solar savings calculator customized for St. Louis homeowners.";
        }
        
        // Appointment/Contact trigger
        if (/schedule|appointment|consult|book|meet|visit|contact|call|email|reach|speak|talk.*someone/i.test(msg)) {
            setTimeout(function() { openContactForm(); }, 500);
            return "Excellent! I'm opening our contact form where you can schedule a free consultation with our solar experts. They'll provide a detailed assessment of your home and answer any questions you have!";
        }
        
        // Build conversation history for context
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            }
        ];
        
        // Add recent conversation context (last 10 exchanges)
        const recentContext = state.conversationContext.slice(-10);
        messages.push(...recentContext);
        
        // Make API call
        console.log('Making AI request with model:', AI_CONFIG.model);
        
        const response = await fetch(AI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + AI_CONFIG.apiKey,
                'HTTP-Referer': window.location.href,
                'X-Title': 'SolarBot - Solar Energy Assistant'
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: messages,
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature
            })
        });
        
        console.log('AI Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', response.status, errorText);
            throw new Error('AI API request failed: ' + response.status + ' - ' + errorText);
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            let aiResponse = data.choices[0].message.content.trim();
            
            // Post-process AI response to trigger widgets if it suggests them
            if (/calculator|calculate your savings|show you.*calculator/i.test(aiResponse)) {
                setTimeout(function() { showCalculator(); }, 1000);
            }
            if (/weather|solar.*forecast|today's conditions/i.test(aiResponse)) {
                setTimeout(function() { showWeather(); }, 1000);
            }
            if (/contact form|schedule.*consultation|fill out.*form/i.test(aiResponse)) {
                setTimeout(function() { openContactForm(); }, 1000);
            }
            
            return aiResponse;
        } else {
            throw new Error('Invalid AI response format');
        }
        
    } catch (error) {
        console.error('AI Error:', error);
        // Return fallback response
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
            { display: 'Contact us', action: function() { openContactForm(); } }
        ];
    } else if (context.includes('schedule') || context.includes('appointment')) {
        suggestions = [
            { display: 'Fill contact form', action: function() { openContactForm(); } },
            { display: 'More questions', query: 'I have more questions first' },
            { display: 'Costs', query: 'How much do solar panels cost?' },
            { display: 'Calculator', action: function() { showCalculator(); } }
        ];
    } else if (context.includes('calculator') || context.includes('savings')) {
        suggestions = [
            { display: 'Book appointment', query: 'Schedule a consultation' },
            { display: 'Why solar?', query: 'Why should I get solar panels?' },
            { display: 'Financing', query: 'What financing options are available?' },
            { display: 'Contact', action: function() { openContactForm(); } }
        ];
    } else {
        suggestions = [
            { display: 'Why solar?', query: 'Why should I get solar panels?' },
            { display: 'Costs', query: 'How much do solar panels cost?' },
            { display: 'Book appointment', query: 'Schedule a consultation' },
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
