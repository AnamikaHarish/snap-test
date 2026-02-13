let MEMBERS = [];
let EXPENSES = []; // Store locally for charts
let chartInstance = null;

// --- 1. THEME & TOAST ---
function toggleTheme() {
    const body = document.body;
    const current = body.getAttribute('data-theme');
    body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
}

function showToast(msg, type='success') {
    const box = document.getElementById('toast-box');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.padding = '12px 20px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- 2. CORE FUNCTIONS ---
async function createGroup() {
    const name = document.getElementById('group-name').value;
    const membersRaw = document.getElementById('member-names').value;
    if (!name || !membersRaw) return showToast("Fill all fields", "error");

    MEMBERS = membersRaw.split(',').map(m => m.trim()).filter(m => m);
    
    // Call Backend
    const res = await fetch('http://127.0.0.1:5000/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, members: MEMBERS })
    });

    if (res.ok) {
        document.getElementById('setup-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        document.getElementById('display-group-name').innerText = name;
        populatePayerDropdown();
        updateSplitUI();
    }
}

function populatePayerDropdown() {
    const select = document.getElementById('exp-payer');
    select.innerHTML = '';
    MEMBERS.forEach(m => {
        let opt = document.createElement('option');
        opt.value = m;
        opt.innerText = m;
        select.appendChild(opt);
    });
}

// --- 3. VOICE INPUT (INNOVATION) ---
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) {
        return alert("Voice not supported in this browser. Try Chrome.");
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    
    showToast("Listening... Say 'Dinner 500 Alice'", "success");
    
    recognition.onresult = function(event) {
        const text = event.results[0][0].transcript;
        console.log("Voice:", text);
        parseVoiceCommand(text);
    };
    recognition.start();
}

function parseVoiceCommand(text) {
    // Simple Heuristic: "[Title] [Amount] [Payer]"
    // Example: "Pizza 500 Bob"
    const words = text.split(' ');
    let amount = words.find(w => !isNaN(w)); // Find first number
    
    if (amount) {
        document.getElementById('exp-amount').value = amount;
        
        // Remove amount from words to find title
        const amountIndex = words.indexOf(amount);
        const titleWords = words.slice(0, amountIndex);
        document.getElementById('exp-title').value = titleWords.join(' ') || "Voice Expense";
        
        // Check if last word is a member
        const possiblePayer = words[words.length - 1];
        const match = MEMBERS.find(m => m.toLowerCase() === possiblePayer.toLowerCase());
        if(match) {
            document.getElementById('exp-payer').value = match;
        }
        
        showToast(`Heard: ${text}`, "success");
    } else {
        showToast("Could not understand amount.", "error");
    }
}

// --- 4. ADD EXPENSE & CHARTS ---
async function addExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = document.getElementById('exp-amount').value;
    const payer = document.getElementById('exp-payer').value;
    const category = document.getElementById('exp-category').value;
    const type = document.getElementById('split-type').value;

    if (!title || !amount) return showToast("Missing details", "error");

    let payload = { title, amount, payer, category, split_type: type };

    // Handle Split Logic (Same as before)
    if (type === 'percentage' || type === 'ratio') {
        let splits = {};
        document.querySelectorAll('.split-input').forEach(i => splits[i.dataset.member] = i.value);
        payload.splits = splits;
    } else if (type === 'itemized') {
        let items = [];
        document.querySelectorAll('#items-list > div').forEach(div => {
            items.push({
                name: div.querySelector('.item-name').value,
                price: div.querySelector('.item-price').value,
                consumers: Array.from(div.querySelector('.item-consumers').selectedOptions).map(o => o.value)
            });
        });
        payload.items = items;
    }

    const res = await fetch('http://127.0.0.1:5000/add-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        showToast("Expense Added!");
        // Clear fields
        document.getElementById('exp-title').value = '';
        document.getElementById('exp-amount').value = '';
        getBalances();
    }
}

async function getBalances() {
    const res = await fetch('http://127.0.0.1:5000/calculate-balance');
    const data = await res.json();
    
    EXPENSES = data.expenses; // Update local storage for charts

    // Render Transactions
    const txDiv = document.getElementById('transactions-list');
    txDiv.innerHTML = data.transactions.length ? '' : '<div class="empty-state">All settled!</div>';
    data.transactions.forEach(tx => {
        txDiv.innerHTML += `<div>${tx}</div>`;
    });

    // Render Balances
    const balList = document.getElementById('balance-list');
    balList.innerHTML = '';
    for (const [m, amt] of Object.entries(data.balances)) {
        let color = amt >= 0 ? 'positive' : 'negative';
        balList.innerHTML += `<li><span>${m}</span><span class="${color}">${amt.toFixed(2)}</span></li>`;
    }

    updateChart();
}

// --- 5. CHART JS LOGIC ---
function updateChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Group expenses by category
    const categories = {};
    EXPENSES.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount);
    });

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

// --- 6. UTILS (Split UI, OCR) ---
function updateSplitUI() {
    const type = document.getElementById('split-type').value;
    const container = document.getElementById('dynamic-split-inputs');
    container.innerHTML = '';

    if (type === 'equal') container.innerHTML = '<p class="text-muted">Split equally.</p>';
    else if (type === 'percentage' || type === 'ratio') {
        MEMBERS.forEach(m => {
            container.innerHTML += `<div style="margin-bottom:5px; display:flex; justify-content:space-between;">
                <label>${m}</label>
                <input type="number" class="split-input" data-member="${m}" placeholder="0" style="width:80px;">
            </div>`;
        });
    } else if (type === 'itemized') {
        container.innerHTML = `<button class="btn-secondary" onclick="addItemRow()" style="width:100%">+ Add Item</button><div id="items-list"></div>`;
        addItemRow();
    }
}

function addItemRow() {
    const div = document.createElement('div');
    div.style.marginTop = "10px";
    div.innerHTML = `
        <input class="item-name" placeholder="Item" style="width:40%">
        <input class="item-price" type="number" placeholder="$" style="width:20%">
        <select class="item-consumers" multiple style="width:30%; vertical-align:middle">
            ${MEMBERS.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
    `;
    document.getElementById('items-list').appendChild(div);
}

// Reuse your existing OCR function here (it was good)
async function scanBill() {
    const file = document.getElementById('bill-image').files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    document.getElementById('ocr-status').innerText = "Scanning...";
    
    try {
        const res = await fetch('http://127.0.0.1:5000/scan-bill', { method: 'POST', body: formData });
        const data = await res.json();
        
        if(data.detected_total > 0) {
            document.getElementById('exp-amount').value = data.detected_total;
            document.getElementById('ocr-status').innerText = "Found: " + data.detected_total;
        } else {
            document.getElementById('ocr-status').innerText = "No price found";
        }
    } catch(e) { console.error(e); }
}