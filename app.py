from flask import Flask, request, jsonify, render_template, Response
from flask_cors import CORS
import pytesseract
from PIL import Image
import re
import io
import csv

app = Flask(__name__, template_folder='.', static_folder='.')
CORS(app)

# ==========================================
# ⚙️ CONFIGURATION
# ==========================================
# WINDOWS USERS: UNCOMMENT AND SET YOUR PATH
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# ==========================================

# --- IN-MEMORY DATABASE ---
GROUP_DATA = {
    "name": "",
    "members": [],
    "upi_ids": {},  # New: Store UPI IDs for QR Codes
    "expenses": [],
    "net_balances": {}
}

# --- HELPER: GREEDY ALGORITHM ---
def minimize_transactions(balances):
    debtors = []
    creditors = []
    for person, amount in balances.items():
        amount = round(amount, 2)
        if amount < -0.01: debtors.append({'person': person, 'amount': amount})
        elif amount > 0.01: creditors.append({'person': person, 'amount': amount})

    debtors.sort(key=lambda x: x['amount'])
    creditors.sort(key=lambda x: x['amount'], reverse=True)

    transactions = []
    i = 0
    j = 0

    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        amount = min(abs(debtor['amount']), creditor['amount'])
        amount = round(amount, 2)
        
        if amount > 0:
            transactions.append({
                "from": debtor['person'],
                "to": creditor['person'],
                "amount": amount
            })

        debtors[i]['amount'] += amount
        creditors[j]['amount'] -= amount

        if abs(debtors[i]['amount']) < 0.01: i += 1
        if creditors[j]['amount'] < 0.01: j += 1
            
    return transactions

# --- ROUTES ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/create-group', methods=['POST'])
def create_group():
    data = request.json
    GROUP_DATA["name"] = data.get("name")
    GROUP_DATA["members"] = data.get("members")
    # Initialize mock UPI IDs for demo purposes (In real app, ask user)
    GROUP_DATA["upi_ids"] = {m: "example@upi" for m in GROUP_DATA["members"]}
    GROUP_DATA["net_balances"] = {m: 0.0 for m in GROUP_DATA["members"]}
    GROUP_DATA["expenses"] = []
    return jsonify({"message": "Group created", "group": GROUP_DATA})

@app.route('/scan-bill', methods=['POST'])
def scan_bill():
    if 'file' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['file']
    
    try:
        image = Image.open(file)
        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(image, config=custom_config)
        
        lines = text.split('\n')
        detected_total = 0.0
        possible_prices = []
        price_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'

        for line in lines:
            matches = re.findall(price_pattern, line)
            valid_floats = []
            for m in matches:
                try:
                    val = float(m.replace(',', ''))
                    if 0 < val < 100000: valid_floats.append(val)
                except: continue
            
            possible_prices.extend(valid_floats)
            if 'total' in line.lower() and valid_floats:
                detected_total = valid_floats[-1]

        if detected_total == 0.0 and possible_prices:
            detected_total = max(possible_prices)

        return jsonify({"detected_total": detected_total, "raw_text": text})

    except Exception as e:
        print("OCR Error:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/add-expense', methods=['POST'])
def add_expense():
    data = request.json
    try:
        title = data['title']
        amount = float(data['amount'])
        payer = data['payer']
        split_type = data['split_type']
        category = data.get('category', 'General')

        if payer not in GROUP_DATA["net_balances"]:
            return jsonify({"error": "Payer not found"}), 400

        GROUP_DATA["net_balances"][payer] += amount
        members = GROUP_DATA["members"]

        if split_type == 'equal':
            share = amount / len(members)
            for m in members: GROUP_DATA["net_balances"][m] -= share

        elif split_type == 'percentage':
            for m, pct in data['splits'].items():
                share = (amount * float(pct)) / 100
                GROUP_DATA["net_balances"][m] -= share

        elif split_type == 'ratio':
            total_weight = sum(float(w) for w in data['splits'].values())
            for m, w in data['splits'].items():
                share = (amount * float(w)) / total_weight
                GROUP_DATA["net_balances"][m] -= share

        elif split_type == 'itemized':
            for item in data['items']:
                price = float(item['price'])
                consumers = item['consumers']
                if consumers:
                    split = price / len(consumers)
                    for c in consumers: GROUP_DATA["net_balances"][c] -= split

        GROUP_DATA["expenses"].append({
            "title": title, "amount": amount, "payer": payer, "category": category, "type": split_type
        })
        return jsonify({"message": "Added"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/calculate-balance', methods=['GET'])
def calculate_balance():
    tx = minimize_transactions(GROUP_DATA["net_balances"])
    return jsonify({
        "balances": GROUP_DATA["net_balances"],
        "transactions": tx,
        "expenses": GROUP_DATA["expenses"],
        "upi_ids": GROUP_DATA["upi_ids"]
    })

@app.route('/download-report')
def download_report():
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['Payer', 'Title', 'Category', 'Amount', 'Split Type'])
    for exp in GROUP_DATA["expenses"]:
        cw.writerow([exp['payer'], exp['title'], exp['category'], exp['amount'], exp['type']])
    
    return Response(
        si.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=report.csv"}
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)