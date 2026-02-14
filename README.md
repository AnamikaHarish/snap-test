<p align="center">
  <img src="./img.png" alt="Project Banner" width="100%">
</p>

# SplitSmart🎯

## Basic Details

### Team Name: Obsidians

### Team Members
- Member 1: Anamika H - LBS Institute of Technology for Women
- Member 2: Anaswara Shajee - LBS Institute of Technology for Women


### Hosted Project Link
https://snap-test-q68s.onrender.com/

### Project Description
SplitSmart is an AI-powered expense manager designed to eliminate the social friction and mathematical complexity of group finances. It combines OCR (Optical Character Recognition) to digitize receipts, a Greedy Graph Algorithm to minimize the number of transactions needed to settle debts, and Dynamic UPI integration for instant payments.

### The Problem statement
Splitting bills in large groups (trips, flatmates, dining) is broken:
1.Manual Entry is Tedious: Typing every item from a long receipt is prone to errors.
2.Complex Settlements: In a group of 5, "who owes whom" becomes a tangled web of circular debts.
3.Social Awkwardness: Asking friends for money is uncomfortable, leading to unpaid debts and strained relationships.
### The Solution
SplitSmart automates the entire lifecycle:
1.Scan: Users take a photo of a bill; our Tesseract-based OCR engine extracts the total automatically.
2.Optimize: We use a "Minimize Cash Flow" algorithm. If A owes B ₹50, and B owes C ₹50, the system tells A to pay C directly.

## Technical Details
Technologies Used
Languages:

Python 3.10+ (Backend Logic)
JavaScript ES6 (Frontend Logic)
HTML5 / CSS3 (UI/UX)
Frameworks & Libraries:
Backend: Flask (Web Server), Flask-CORS.
AI/OCR: pytesseract (OCR Engine Wrapper), Pillow (Image Processing).
Frontend: Chart.js (Visual Analytics), qrcode.js (UPI Generation), canvas-confetti.

### Technologies/Components Used
Tools:

VS Code
Git / GitHub
Tesseract-OCR Engine (System Dependency)

**For Software:**
- Languages used: [e.g., JavaScript, Python, Java]
- Frameworks used: [e.g., React, Django, Spring Boot]
- Libraries used: [e.g., axios, pandas, JUnit]
- Tools used: [e.g., VS Code, Git, Docker]

**For Hardware:**
- Main components: [List main components]
- Specifications: [Technical specifications]
- Tools required: [List tools needed]

---

## Features

List the key features of your project:
- Feature 1:  AI-Powered OCR Scanning
Uses image preprocessing (grayscale conversion, contrast enhancement, sharpening) to read low-quality receipts and extract the total amount automatically using Regex pattern matching.
- Feature 2:  Debt Simplification Algorithm
Implements a Greedy Algorithm to minimize cash flow. It calculates net balances and greedily settles the largest creditor with the largest debtor, reducing total transaction volume by up to 60%.
- Feature 3: Instant UPI QR Generation
Generates dynamic UPI payment strings (upi://pay?pa=...) rendered as scan-able QR codes. Users can pay specific debts instantly using GPay, PhonePe, or Paytm.
- Feature 4: Social Gamification (Roast & Nag)
Includes an "AI Roast" button that mocks the group's spending habits based on category data, and a "WhatsApp Nag" button that sends pre-filled, humorous reminder messages to debtors.

---

## Implementation

### For Software:

#### Installation
```bash
pip install flask flask-cors pytesseract Pillow
```

#### Run
```bash
python app.py
```

### For Hardware:

#### Components Required
[List all components needed with specifications]

#### Circuit Setup
[Explain how to set up the circuit]

---

## Project Documentation

### For Software:

#### Screenshots (Add at least 3)
! https://drive.google.com/file/d/1FHa62exPmkdmwzovmNV_rR4gJtqLtRYs/view?usp=drive_link
Description:
"The Landing Page features a modern, dark-themed UI designed for quick onboarding. Users can initialize a new session by entering a Group Name (e.g., 'Goa Trip') and listing the Members. The interface highlights key features like OCR Scanning and AI Roasts, serving as the entry point to the application."
! https://drive.google.com/file/d/19mK-NcU2r578xx1oRxpL5xVV1wfcPS3N/view?usp=drive_link
Description:
"The Main Dashboard is the command center of SplitSmart.

Left Panel: Contains the Add Expense form with the 'Scan Receipt (AI-OCR)' upload area and split logic options (Equal, Percentage, etc.).

Right Panel: Displays Spending DNA (a visual breakdown of expenses by category), Smart Settlements (the output of the Greedy Algorithm showing minimized transactions), and Net Balances (real-time financial standing of each member)."

!  https://drive.google.com/file/d/1InVT5bM0p1K9brFHpTOYYvknN3M8qsmW/view?usp=drive_link
Description
"The Exported CSV Report demonstrates the data persistence and portability feature. Users can download a detailed log of all transactions, including the Payer, Title, Category, Amount, and Split Type. This file allows users to maintain offline records or perform further analysis in Excel."
#### Diagrams

**System Architecture:**

![Architecture Diagram](docs/architecture.png)
*Explain your system architecture - components, data flow, tech stack interaction*

**Application Workflow:**

![Workflow](docs/workflow.png)
*Add caption explaining your workflow*

---

### For Hardware:

#### Schematic & Circuit

![Circuit](Add your circuit diagram here)
*Add caption explaining connections*

![Schematic](Add your schematic diagram here)
*Add caption explaining the schematic*

#### Build Photos

![Team](Add photo of your team here)

![Components](Add photo of your components here)
*List out all components shown*

![Build](Add photos of build process here)
*Explain the build steps*

![Final](Add photo of final product here)
*Explain the final build*

---

## Additional Documentation

### For Web Projects with Backend:

#### API Documentation

**Base URL:** `https://snap-test-q68s.onrender.com`

##### Endpoints

**GET /api/endpoint**
- **Description:** [What it does]
- **Parameters:**
  - `param1` (string): [Description]
  - `param2` (integer): [Description]
- **Response:**
```json
{
  "status": "success",
  "data": {}
}
```

**POST /api/endpoint**
- **Description:** [What it does]
- **Request Body:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```
- **Response:**
```json
{
  "status": "success",
  "message": "Operation completed"
}
```

[Add more endpoints as needed...]

---

### For Mobile Apps:

#### App Flow Diagram

![App Flow](docs/app-flow.png)
*Explain the user flow through your application*

#### Installation Guide

**For Android (APK):**
1. Download the APK from [Release Link]
2. Enable "Install from Unknown Sources" in your device settings:
   - Go to Settings > Security
   - Enable "Unknown Sources"
3. Open the downloaded APK file
4. Follow the installation prompts
5. Open the app and enjoy!

**For iOS (IPA) - TestFlight:**
1. Download TestFlight from the App Store
2. Open this TestFlight link: [Your TestFlight Link]
3. Click "Install" or "Accept"
4. Wait for the app to install
5. Open the app from your home screen

**Building from Source:**
```bash
# For Android
flutter build apk
# or
./gradlew assembleDebug

# For iOS
flutter build ios
# or
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

---

### For Hardware Projects:

#### Bill of Materials (BOM)

| Component | Quantity | Specifications | Price | Link/Source |
|-----------|----------|----------------|-------|-------------|
| Arduino Uno | 1 | ATmega328P, 16MHz | ₹450 | [Link] |
| LED | 5 | Red, 5mm, 20mA | ₹5 each | [Link] |
| Resistor | 5 | 220Ω, 1/4W | ₹1 each | [Link] |
| Breadboard | 1 | 830 points | ₹100 | [Link] |
| Jumper Wires | 20 | Male-to-Male | ₹50 | [Link] |
| [Add more...] | | | | |

**Total Estimated Cost:** ₹[Amount]

#### Assembly Instructions

**Step 1: Prepare Components**
1. Gather all components listed in the BOM
2. Check component specifications
3. Prepare your workspace
![Step 1](images/assembly-step1.jpg)
*Caption: All components laid out*

**Step 2: Build the Power Supply**
1. Connect the power rails on the breadboard
2. Connect Arduino 5V to breadboard positive rail
3. Connect Arduino GND to breadboard negative rail
![Step 2](images/assembly-step2.jpg)
*Caption: Power connections completed*

**Step 3: Add Components**
1. Place LEDs on breadboard
2. Connect resistors in series with LEDs
3. Connect LED cathodes to GND
4. Connect LED anodes to Arduino digital pins (2-6)
![Step 3](images/assembly-step3.jpg)
*Caption: LED circuit assembled*

**Step 4: [Continue for all steps...]**

**Final Assembly:**
![Final Build](images/final-build.jpg)
*Caption: Completed project ready for testing*

---

### For Scripts/CLI Tools:

#### Command Reference

**Basic Usage:**
```bash
python script.py [options] [arguments]
```

**Available Commands:**
- `command1 [args]` - Description of what command1 does
- `command2 [args]` - Description of what command2 does
- `command3 [args]` - Description of what command3 does

**Options:**
- `-h, --help` - Show help message and exit
- `-v, --verbose` - Enable verbose output
- `-o, --output FILE` - Specify output file path
- `-c, --config FILE` - Specify configuration file
- `--version` - Show version information

**Examples:**

```bash
# Example 1: Basic usage
python script.py input.txt

# Example 2: With verbose output
python script.py -v input.txt

# Example 3: Specify output file
python script.py -o output.txt input.txt

# Example 4: Using configuration
python script.py -c config.json --verbose input.txt
```

#### Demo Output

**Example 1: Basic Processing**

**Input:**
```
This is a sample input file
with multiple lines of text
for demonstration purposes
```

**Command:**
```bash
python script.py sample.txt
```

**Output:**
```
Processing: sample.txt
Lines processed: 3
Characters counted: 86
Status: Success
Output saved to: output.txt
```

**Example 2: Advanced Usage**

**Input:**
```json
{
  "name": "test",
  "value": 123
}
```

**Command:**
```bash
python script.py -v --format json data.json
```

**Output:**
```
[VERBOSE] Loading configuration...
[VERBOSE] Parsing JSON input...
[VERBOSE] Processing data...
{
  "status": "success",
  "processed": true,
  "result": {
    "name": "test",
    "value": 123,
    "timestamp": "2024-02-07T10:30:00"
  }
}
[VERBOSE] Operation completed in 0.23s
```

---

## Project Demo

### Video
https://drive.google.com/file/d/1eahTJOl88kZLTtdWR22RlA-2OwO1Jpz3/view?usp=drive_link

*Explain what the video demonstrates - key features, user flow, technical highlights*

### Additional Demos
[Add any extra demo materials/links - Live site, APK download, online demo, etc.]

---

## AI Tools Used (Optional - For Transparency Bonus)

If you used AI tools during development, document them here for transparency:

**Tool Used:** [e.g., GitHub Copilot, v0.dev, Cursor, ChatGPT, Claude]

**Purpose:** [What you used it for]
- Example: "Generated boilerplate React components"
- Example: "Debugging assistance for async functions"
- Example: "Code review and optimization suggestions"

**Key Prompts Used:**
- "Create a REST API endpoint for user authentication"
- "Debug this async function that's causing race conditions"
- "Optimize this database query for better performance"

**Percentage of AI-generated code:** [Approximately X%]

**Human Contributions:**
- Architecture design and planning
- Custom business logic implementation
- Integration and testing
- UI/UX design decisions

*Note: Proper documentation of AI usage demonstrates transparency and earns bonus points in evaluation!*

---

## Team Contributions

- [Name 1]: [Specific contributions - e.g., Frontend development, API integration, etc.]
- [Name 2]: [Specific contributions - e.g., Backend development, Database design, etc.]
- [Name 3]: [Specific contributions - e.g., UI/UX design, Testing, Documentation, etc.]

---

## License

This project is licensed under the [LICENSE_NAME] License - see the [LICENSE](LICENSE) file for details.

**Common License Options:**
- MIT License (Permissive, widely used)
- Apache 2.0 (Permissive with patent grant)
- GPL v3 (Copyleft, requires derivative works to be open source)

---

Made with ❤️ at TinkerHub
