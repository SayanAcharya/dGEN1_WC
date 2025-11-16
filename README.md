# dGEN1_WC · Multi-Chain Recovery Console

**dGEN1_WC** is a lightweight, secure, open-source interface designed to send assets
from any smart wallet that exposes:

```
execute(address target, uint256 value, bytes data)
```

This app provides a clean UI for sending ETH or ERC-20 tokens using WalletConnect.
It is fully client-side and requires no backend.

---

## 🚀 Purpose

A minimal recovery console that allows users to:

- Send **ETH** from a smart wallet using `execute()`
- Send **any ERC-20 token** by pasting its contract address
- Operate across multiple EVM chains
- Connect safely via WalletConnect v2

This interface focuses purely on **asset execution and recovery**, without extra features.

---

## 🧩 Features

### ✔ WalletConnect v2  
Users connect via their own WalletConnect Project ID.  
No data stored. No tracking.

### ✔ Multi-chain support  
Supports major EVM chains:

- Base  
- Ethereum  
- Arbitrum  
- Optimism  
- Polygon  
- BSC  
- Avalanche  
- Fantom  
- Linea  
- **Custom chain ID input**

### ✔ Send ETH from smart wallet  
Uses:

```
execute(recipient, value, "0x")
```

### ✔ Send **ANY ERC-20 token**  
Paste token contract address → app auto-detects:

- `symbol()`
- `decimals()`

Then executes the correct ERC-20 transfer via:

```
execute(token, 0, transferData)
```

### ✔ Simple, minimal UI  
Shows **Success** or **Error** only.  
No dropdowns, no scanners, no unnecessary features.

---

## 🛠 Installation

```bash
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

---

## ▶️ How to Use

1. Enter your WalletConnect Project ID  
2. Select a chain  
3. Connect  
4. Enter the **smart wallet address**  
5. Use:
   - **Send ETH**
   - **Send ERC-20**

---

## 🙌 Credits

This project is inspired by:

➡ **OpenBurner**  
https://github.com/rdyplayerB/openburner

All structural credit goes to OpenBurner.  
`dGEN1_WC` is a minimal execution-focused adaptation.

---

## 📄 License

MIT License — free to modify, use, and redistribute.
