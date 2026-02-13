from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pytesseract
from PIL import Image
import re
import os

# ==========================================
# IMPORTANT: CONFIGURE TESSERACT PATH HERE
# ==========================================
# If you are on Windows, you MUST set this path.
# Common paths are:
# C:\Program Files\Tesseract-OCR\tesseract.exe
# C:\Program Files (x86)\Tesseract-OCR\tesseract.exe
# Linux/Mac usually doesn't need this if installed via brew/apt.

# UNCOMMENT THE LINE BELOW AND CHECK YOUR PATH:
pytesseract.pytesseract.tesseract_cmd = r"D:\Ami college activities (extra)\tesseract\tesseract.exe" 
# ==========================================

app = Flask(__name__, template_folder='.', static_folder='.')
CORS(app)

# --- IN-MEMORY DATABASE ---
GROUP_DATA = {
    "name": "",
    "members": [],
    "expenses": [],
    "net_balances": {}
}

# --- GREEDY ALGORITHM ---
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
            transactions.append(f"{debtor['person']} pays {creditor['person']}: ₹{amount}")

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
    GROUP_DATA["net_balances"] = {m: 0.0 for m in GROUP_DATA["members"]}
    GROUP_DATA["expenses"] = []
    return jsonify({"message": "Group created", "group": GROUP_DATA})

@app.route('/scan-bill', methods=['POST'])
# --- IN app.py, REPLACE THE 'scan_bill' ROUTE WITH THIS ---

@app.route('/scan-bill', methods=['POST'])
def scan_bill():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        image = Image.open(file)
        # Custom config to treat image as a single block of text
        custom_config = r'--oem 3 --psm 6' 
        text = pytesseract.image_to_string(image, config=custom_config)
        
        # --- SMART PRICE DETECTION LOGIC ---
        
        # 1. Split text into lines to analyze row by row
        lines = text.split('\n')
        detected_total = 0.0
        possible_prices = []

        # Regex to find money patterns (e.g., 1,200.50 or 500.00 or 500)
        # It looks for digits, optional commas, and optional decimals
        price_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'

        for line in lines:
            # Clean the line
            lower_line = line.lower()
            
            # Find all numbers in this line
            matches = re.findall(price_pattern, line)
            
            # Convert matches to floats
            valid_floats = []
            for m in matches:
                try:
                    # Remove commas to convert to float
                    val = float(m.replace(',', ''))
                    # Filter: Price must be reasonable (e.g., < 100,000) to avoid phone numbers
                    # Filter: Price should usually have a decimal or be > 0
                    if 0 < val < 100000: 
                        valid_floats.append(val)
                except:
                    continue
            
            possible_prices.extend(valid_floats)

            # STRATEGY A: High Confidence - Look for "Total" keyword
            if 'total' in lower_line or 'amount' in lower_line or 'payable' in lower_line:
                if valid_floats:
                    # If line says "Total: 500", take the last number on that line
                    detected_total = valid_floats[-1]

        # STRATEGY B: Fallback - If no "Total" keyword found, take the largest valid number
        if detected_total == 0.0 and possible_prices:
            detected_total = max(possible_prices)

        return jsonify({
            "raw_text": text, 
            "detected_total": detected_total,
            "all_found": possible_prices
        })

    except Exception as e:
        print("OCR Error:", str(e))
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
            return jsonify({"error": "Payer not in group"}), 400

        GROUP_DATA["net_balances"][payer] += amount
        members = GROUP_DATA["members"]
        
        if split_type == 'equal':
            share = amount / len(members)
            for m in members: GROUP_DATA["net_balances"][m] -= share

        elif split_type == 'percentage':
            percents = data['splits']
            for m, pct in percents.items():
                share = (amount * float(pct)) / 100
                GROUP_DATA["net_balances"][m] -= share

        elif split_type == 'ratio':
            weights = data['splits']
            total_weight = sum(float(w) for w in weights.values())
            for m, weight in weights.items():
                share = (amount * float(weight)) / total_weight
                GROUP_DATA["net_balances"][m] -= share

        elif split_type == 'itemized':
            items = data['items']
            for item in items:
                item_price = float(item['price'])
                consumers = item['consumers']
                if consumers:
                    split_amt = item_price / len(consumers)
                    for c in consumers: GROUP_DATA["net_balances"][c] -= split_amt

        GROUP_DATA["expenses"].append({
            "title": title, "amount": amount, "payer": payer, "category": category, "type": split_type
        })

        return jsonify({"message": "Expense added", "balances": GROUP_DATA["net_balances"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/calculate-balance', methods=['GET'])
def calculate_balance():
    transactions = minimize_transactions(GROUP_DATA["net_balances"])
    return jsonify({
        "balances": GROUP_DATA["net_balances"],
        "transactions": transactions,
        "expenses": GROUP_DATA["expenses"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)