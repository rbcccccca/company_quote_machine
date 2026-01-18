# ArchiMart Instant Quote Web App

A lightweight, browser-based quoting tool built for **ARCHIMART PTY LTD**, designed to quickly generate professional construction quotes for **awnings and decking projects**.

This app runs entirely on the frontend, requires **no database**, and produces **downloadable PDF quotes** suitable for sending directly to clients.

---

## Purpose

This web app is primarily built for **ARCHIMART PTY LTD** to:

- Speed up on-site or office quoting
- Reduce manual calculation errors
- Standardise quote format and pricing rules
- Generate clean, professional PDF quotes instantly

It is intended for **internal business use** rather than public self-service.

---

## Key Features

- **Instant area calculation**
  - Length × Width (metres, supports decimals)
  - Special note for curved awnings (+0.2m length reminder)

- **Configurable pricing system**
  - Awning and decking configurations
  - Automatic unit-rate calculation
  - Clear separation of base price and add-ons

- **Advanced add-ons support**
  - Awning-related add-ons (height adjustment, concrete footings, high work, etc.)
  - Decking-related add-ons (stairs, extra side cladding by area)
  - Custom manual add-ons (e.g. demolition, rubbish removal)

- **Smart pricing rules**
  - Deal price rounded **down to the nearest $100** when area ≥ 1 m²
  - No rounding applied for small-area jobs
  - Automatic 50% deposit and balance calculation

- **Professional PDF output**
  - Company details (ABN, phone)
  - Quote number & date
  - Client name & site address
  - Configuration & measurements
  - Pricing breakdown and terms

- **No data storage**
  - All calculations happen in-browser
  - No customer data is saved or uploaded

---

## Built With

- **React + Vite**
- **jsPDF** (PDF generation)
- Deployed via **GitHub Pages**

---

## Typical Use Case

1. Enter project, client, and site details  
2. Input dimensions  
3. Select configuration  
4. Add optional items if required  
5. Download PDF quote  
6. Send to client  

---

## How to Modify or Update the App

### 1. Modify business logic or pricing
Most business rules are defined in **`src/App.jsx`**:

- Base pricing:  
  `const PRICING = [...]`

- Add-on pricing:  
  `AWNING_ADDONS`  
  `DECKING_ADDONS`

- Rounding rules:  
  Look for `roundingApplied` and `dealPrice`

> 🔧 Change numbers here if pricing updates in the future.

---

### 2. Modify PDF layout or wording
All PDF-related output is inside:

```js
function downloadPDF() { ... }
