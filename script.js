let MEMBERS = [];
let EXPENSES = [];
let chartInstance = null;
let currentTxButton = null; // To track which debt is being paid

// --- UTILS ---
function toggleTheme() {
    const body = document.body;
    const current = body.getAttribute('data-theme');
    body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
}

function showToast(msg, type='success') {
    const box = document.getElementById('toast-box');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = type === 'error' ? '#ef4444' : (type === 'roast' ? '#f59e0b' : '#10b981');
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function getAvatar(name) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
}

// --- SETUP ---
async function createGroup() {
    const name = document.getElementById('group-name').value;
    const membersRaw = document.getElementById('member-names').value;
    if (!name || !membersRaw) return showToast("Please fill all fields", "error");

    MEMBERS = membersRaw.split(',').map(m => m.trim()).filter(m => m);
    
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
        showToast("🚀 Dashboard Launched!");
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

// --- COOL FEATURES: ROAST, NAG, UPI ---

function roastGroup() {
    if(EXPENSES.length === 0) return showToast("Add expenses first!", "error");
    
    // Simple "AI" Logic
    const food = EXPENSES.filter(e => e.category === 'Dining').reduce((a,b)=>a+b.amount,0);
    const total = EXPENSES.reduce((a,b)=>a+b.amount,0);
    
    let msg = "";
    if((food/total) > 0.6) msg = "You guys eat out too much. Do you even have kitchens? 🍔";
    else if (total > 10000) msg = "Spending like billionaires, earning like students? 💸";
    else msg = "This group is too boring. Spend more money! 😴";
    
    showToast("🤖 AI Roast: " + msg, "roast");
}

function nag(member, amount) {
    const text = encodeURIComponent(`Hey ${member}! You owe me ₹${amount}. Pay up or I'm deleting your Netflix profile. 🔫`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function showQR(to, from, amount, btn) {
    currentTxButton = btn; // Save button reference
    const modal = document.getElementById('qr-modal');
    const qrDiv = document.getElementById('qrcode');
    const text = document.getElementById('qr-text');
    
    modal.classList.remove('hidden');
    qrDiv.innerHTML = ""; // Clear old QR
    
    // Real UPI String Format: upi://pay?pa={UPI_ID}&pn={NAME}&am={AMOUNT}&cu=INR
    // Using a placeholder UPI ID for hackathon demo
    const upiStr = `upi://pay?pa=hackathon@upi&pn=${to}&am=${amount}&cu=INR`;
    
    new QRCode(qrDiv, {
        text: upiStr,
        width: 150,
        height: 150
    });
    
    text.innerText = `Scan to pay ₹${amount} to ${to}`;
}

function closeQR() {
    document.getElementById('qr-modal').classList.add('hidden');
}

function markAsPaid() {
    closeQR();
    if(currentTxButton) {
        settleDebt(currentTxButton);
    }
}

function downloadCSV() {
    // FIX: Use absolute path to ensure download triggers
    window.location.href = "http://127.0.0.1:5000/download-report";
}

// --- CORE LOGIC ---

async function addExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = document.getElementById('exp-amount').value;
    const payer = document.getElementById('exp-payer').value;
    const type = document.getElementById('split-type').value;

    if (!title || !amount) return showToast("Missing details", "error");

    let payload = { title, amount, payer, category: document.getElementById('exp-category').value, split_type: type };

    if (type === 'percentage' || type === 'ratio') {
        let splits = {};
        document.querySelectorAll('.split-input').forEach(i => splits[i.dataset.member] = i.value);
        payload.splits = splits;
    } else if (type === 'itemized') {
        let items = [];
        document.querySelectorAll('#items-list > div').forEach(div => {
            items.push({
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
        showToast("Expense Added");
        document.getElementById('exp-amount').value = '';
        getBalances();
    }
}

async function getBalances() {
    const res = await fetch('http://127.0.0.1:5000/calculate-balance');
    const data = await res.json();
    EXPENSES = data.expenses;

    const txDiv = document.getElementById('transactions-list');
    txDiv.innerHTML = data.transactions.length ? '' : '<div class="empty-state">All settled! 🎉</div>';
    
    data.transactions.forEach(tx => {
        // Safe check for object properties
        let from = tx.from || tx.debtor; 
        let to = tx.to || tx.creditor;
        let amt = tx.amount;

        txDiv.innerHTML += `
            <div class="transaction-item">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${getAvatar(from)}" class="avatar">
                    <div>
                        <strong>${from}</strong> pays <strong>${to}</strong>
                        <div style="font-size:0.8rem; color:var(--text-muted)">₹${amt}</div>
                    </div>
                </div>
                <div class="tx-actions">
                    <button onclick="nag('${from}', '${amt}')" class="action-btn nag-btn" title="Send WhatsApp Reminder">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                    <button onclick="showQR('${to}', '${from}', '${amt}', this)" class="action-btn pay-btn" title="Pay with UPI">
                        <i class="fa-solid fa-qrcode"></i>
                    </button>
                </div>
            </div>`;
    });

    const balList = document.getElementById('balance-list');
    balList.innerHTML = '';
    for (const [m, amt] of Object.entries(data.balances)) {
        let color = amt >= 0 ? 'positive' : 'negative';
        let arrow = amt >= 0 ? '↑' : '↓';
        balList.innerHTML += `<li>
            <span><img src="${getAvatar(m)}" class="avatar">${m}</span>
            <span class="${color}">${arrow} ₹${Math.abs(amt).toFixed(2)}</span>
        </li>`;
    }
    updateChart();
}

function settleDebt(btn) {
    // Traverse up to find the transaction item
    const item = btn.closest('.transaction-item');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    item.style.opacity = '0.5';
    item.style.pointerEvents = 'none';
    item.querySelector('.tx-actions').innerHTML = '<i class="fa-solid fa-check-circle" style="color:var(--success)"></i> Paid';
    showToast("Payment Recorded!", "success");
}

function updateChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categories = {};
    EXPENSES.forEach(e => categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount));

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{ 
                data: Object.values(categories), 
                backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'],
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } 
        }
    });
}

// Voice & OCR Functions (Kept from original)
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) return alert("Use Chrome for Voice");
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    showToast("Listening... 'Dinner 500 Alice'", "success");
    recognition.onresult = function(event) {
        const text = event.results[0][0].transcript;
        const words = text.split(' ');
        const amount = words.find(w => !isNaN(w));
        if (amount) {
            document.getElementById('exp-amount').value = amount;
            document.getElementById('exp-title').value = words.slice(0, words.indexOf(amount)).join(' ') || "Voice Item";
            showToast("Voice matched!", "success");
        }
    };
    recognition.start();
}

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
            document.getElementById('ocr-status').innerText = "Found: ₹" + data.detected_total;
            showToast("Receipt Scanned!");
        } else {
            document.getElementById('ocr-status').innerText = "No price found";
        }
    } catch(e) { console.error(e); }
}

function updateSplitUI() {
    const type = document.getElementById('split-type').value;
    const container = document.getElementById('dynamic-split-inputs');
    container.innerHTML = '';
    if (type === 'equal') {
        container.innerHTML = '<div style="display:flex; gap:5px; flex-wrap:wrap">' + 
            MEMBERS.map(m => `<span style="background:rgba(255,255,255,0.1); border:1px solid var(--border); padding:5px 10px; border-radius:20px; font-size:0.8rem; color:var(--text)">${m}</span>`).join('') 
            + '</div>';
    } else if (type === 'percentage' || type === 'ratio') {
        MEMBERS.forEach(m => {
            container.innerHTML += `<div style="display:flex; align-items:center; margin-bottom:5px; background:rgba(0,0,0,0.2); padding:8px; border-radius:8px;">
                <label style="flex:1;">${m}</label>
                <input type="number" class="split-input" data-member="${m}" placeholder="0" style="width:80px;">
            </div>`;
        });
    } else if (type === 'itemized') {
        container.innerHTML = `<button class="btn-secondary full-width" onclick="addItemRow()">+ Add Item Row</button><div id="items-list"></div>`;
        addItemRow();
    }
}

function addItemRow() {
    const div = document.createElement('div');
    div.style.marginTop = "10px";
    div.innerHTML = `
        <input class="item-price" type="number" placeholder="Price" style="width:30%">
        <select class="item-consumers" multiple style="width:60%; vertical-align:middle; height:40px">
            ${MEMBERS.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>`;
    document.getElementById('items-list').appendChild(div);
}