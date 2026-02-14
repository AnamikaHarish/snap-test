let MEMBERS = [];
let EXPENSES = [];
let chartInstance = null;
let currentTxButton = null;

// --- UTILS ---
function toggleTheme() {
    const body = document.body;
    const current = body.getAttribute('data-theme');
    body.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
}

function showToast(msg, type='success') {
    const box = document.getElementById('toast-box');
    if (!box) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    // Color logic
    if (type === 'error') toast.style.background = '#ef4444'; // Red
    else if (type === 'roast') toast.style.background = '#f59e0b'; // Orange
    else toast.style.background = '#10b981'; // Green
    
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function getAvatar(name) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
}

// --- SETUP (FIXED) ---
async function createGroup() {
    const nameInput = document.getElementById('group-name');
    const membersInput = document.getElementById('member-names');

    // 1. Validate Inputs
    if (!nameInput || !membersInput) {
        alert("Error: HTML elements not found. Check your IDs.");
        return;
    }

    const name = nameInput.value.trim();
    const membersRaw = membersInput.value.trim();

    if (!name || !membersRaw) {
        showToast("Please fill in Group Name and Members!", "error");
        return;
    }

    MEMBERS = membersRaw.split(',').map(m => m.trim()).filter(m => m);
    
    if (MEMBERS.length === 0) {
        showToast("Add at least one member.", "error");
        return;
    }

    // 2. Show Loading State (So you know it's working)
    const btn = document.querySelector('.setup-box button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
    btn.disabled = true;

    try {
        // 3. Attempt Connection
        const res = await fetch('https://snap-test-q68s.onrender.com/create-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, members: MEMBERS })
        });

        if (res.ok) {
            // Success!
            document.getElementById('setup-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('display-group-name').innerText = name;
            populatePayerDropdown();
            updateSplitUI();
            showToast("🚀 Dashboard Launched!");
        } else {
            // Server returned an error (e.g., 500)
            const err = await res.json();
            showToast("Server Error: " + (err.error || "Unknown"), "error");
        }
    } catch (error) {
        // 4. NETWORK ERROR (This is why you were stuck!)
        console.error("Fetch error:", error);
        showToast("Connection Failed! Is 'python app.py' running?", "error");
    } finally {
        // Reset button
        btn.innerHTML = originalText;
        btn.disabled = false;
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

// --- FEATURES ---

function roastGroup() {
    if(EXPENSES.length === 0) return showToast("Add expenses first!", "error");
    
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
    currentTxButton = btn; 
    const modal = document.getElementById('qr-modal');
    const qrDiv = document.getElementById('qrcode');
    const text = document.getElementById('qr-text');
    
    modal.classList.remove('hidden');
    qrDiv.innerHTML = ""; 
    
    const upiStr = `upi://pay?pa=hackathon@upi&pn=${to}&am=${amount}&cu=INR`;
    
    new QRCode(qrDiv, { text: upiStr, width: 150, height: 150 });
    text.innerText = `Scan to pay ₹${amount} to ${to}`;
}

function closeQR() { document.getElementById('qr-modal').classList.add('hidden'); }
function markAsPaid() { closeQR(); if(currentTxButton) settleDebt(currentTxButton); }
function downloadCSV() { window.location.href = "https://snap-test-q68s.onrender.com/download-report"; }

// --- CORE LOGIC ---

async function addExpense() {
    const title = document.getElementById('exp-title').value;
    let amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const type = document.getElementById('split-type').value;

    if (!title || !amount) return showToast("Missing details", "error");

    // Smart Tax Logic Check
    const taxToggle = document.getElementById('smart-tax');
    if(taxToggle && taxToggle.checked) {
        amount = amount + (amount * 0.05) + (amount * 0.10); // 5% GST + 10% Tip
        amount = parseFloat(amount.toFixed(2));
    }

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

    try {
        const res = await fetch('https://snap-test-q68s.onrender.com/add-expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast(`Expense Added: ₹${amount}`);
            document.getElementById('exp-amount').value = '';
            getBalances();
        } else {
            showToast("Failed to add expense", "error");
        }
    } catch (e) {
        showToast("Connection Error", "error");
    }
}

async function getBalances() {
    try {
        const res = await fetch('https://snap-test-q68s.onrender.com/calculate-balance');
        const data = await res.json();
        EXPENSES = data.expenses;

        const txDiv = document.getElementById('transactions-list');
        txDiv.innerHTML = data.transactions.length ? '' : '<div class="empty-state">All settled! 🎉</div>';
        
        data.transactions.forEach(tx => {
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
                        <button onclick="nag('${from}', '${amt}')" class="action-btn nag-btn"><i class="fa-brands fa-whatsapp"></i></button>
                        <button onclick="showQR('${to}', '${from}', '${amt}', this)" class="action-btn pay-btn"><i class="fa-solid fa-qrcode"></i></button>
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
    } catch (e) {
        console.error(e);
        showToast("Error fetching balances", "error");
    }
}

function settleDebt(btn) {
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
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } } }
    });
}

function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window)) return alert("Use Chrome for Voice");
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    showToast("Listening...", "success");
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
        const res = await fetch('https://snap-test-q68s.onrender.com/scan-bill', { method: 'POST', body: formData });
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