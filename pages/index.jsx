
import { useState } from "react";
import Header from "../components/Header";
import { connectWallet } from "../lib/wc";
import {
  sendEthExecute,
  sendCustomTokenExecute,
} from "../lib/execute";

export default function Home() {
  const [projectId, setProjectId] = useState("");
  const [activeProjectId, setActiveProjectId] = useState("");
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const baseChains = {
    ethereum: { id: 1, name: "Ethereum", nativeSymbol: "ETH" },
    base: { id: 8453, name: "Base", nativeSymbol: "ETH" },
    polygon: { id: 137, name: "Polygon", nativeSymbol: "MATIC" },
    bsc: { id: 56, name: "BSC", nativeSymbol: "BNB" },
    arbitrum: { id: 42161, name: "Arbitrum", nativeSymbol: "ETH" },
    optimism: { id: 10, name: "Optimism", nativeSymbol: "ETH" },
    avalanche: { id: 43114, name: "Avalanche", nativeSymbol: "AVAX" },
    fantom: { id: 250, name: "Fantom", nativeSymbol: "FTM" },
    linea: { id: 59144, name: "Linea", nativeSymbol: "ETH" },
  };

  const [selectedChainKey, setSelectedChainKey] = useState("base");
  const [customChainId, setCustomChainId] = useState("");
  const [customChainName, setCustomChainName] = useState("");

  const [walletAddr, setWalletAddr] = useState("");

  const [ethRecipient, setEthRecipient] = useState("");
  const [ethAmount, setEthAmount] = useState("");
  const [ethBalance, setEthBalance] = useState(null);

  // custom token
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [customTokenRecipient, setCustomTokenRecipient] = useState("");
  const [customTokenAmount, setCustomTokenAmount] = useState("");
  const [customTokenSymbol, setCustomTokenSymbol] = useState("");
  const [customTokenDecimals, setCustomTokenDecimals] = useState(null);

  const [status, setStatus] = useState(null); // pending | success | error | null
  const [statusMsg, setStatusMsg] = useState("");
  const [log, setLog] = useState("");

  function getActiveChain() {
    if (selectedChainKey === "custom") {
      return {
        id: customChainId ? Number(customChainId) : null,
        name: customChainName || "Custom",
        nativeSymbol: "ETH",
      };
    }
    return baseChains[selectedChainKey];
  }

  const activeChain = getActiveChain();

  function pushLog(line) {
    setLog((prev) => (prev ? prev + "\n" + line : line));
  }

  async function refreshEthBalance(currentProvider, currentWallet) {
    try {
      if (!currentProvider || !currentWallet) return;
      const bal = await currentProvider.getBalance(currentWallet);
      const formatted = Number(bal) === 0 ? "0" : (Number(bal) / 1e18).toString();
      setEthBalance(formatted);
    } catch (e) {
      console.warn("Failed to read ETH balance", e);
    }
  }

  async function handleConnect() {
    try {
      const chainId = activeChain.id;
      if (!chainId) {
        setStatus("error");
        setStatusMsg("Enter a valid custom chain ID before connecting.");
        return;
      }
      if (!projectId.trim()) {
        setStatus("error");
        setStatusMsg("WalletConnect Project ID required.");
        return;
      }
      setStatus("pending");
      setStatusMsg("Connecting WalletConnect session…");
      const { provider, signer, address } = await connectWallet(
        projectId,
        chainId
      );
      setProvider(provider);
      setSigner(signer);
      setAddress(address);
      setActiveProjectId(projectId);
      setStatus("success");
      setStatusMsg("Connected via WalletConnect.");
      pushLog("[INFO] Connected: " + address + " on chain " + chainId);

      if (walletAddr) {
        await refreshEthBalance(provider, walletAddr);
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      setStatusMsg(e.message || "Connect failed");
      pushLog("[ERROR] Connect: " + (e.message || e));
    }
  }

  async function handleRefreshEth() {
    if (!provider) {
      setStatus("error");
      setStatusMsg("Connect wallet first.");
      return;
    }
    if (!walletAddr) {
      setStatus("error");
      setStatusMsg("Enter smart wallet address first.");
      return;
    }
    await refreshEthBalance(provider, walletAddr);
    setStatus("success");
    setStatusMsg("ETH balance refreshed.");
  }

  async function handleSendEth() {
    if (!signer) {
      setStatus("error");
      setStatusMsg("Connect wallet first.");
      return;
    }
    if (!walletAddr || !ethRecipient || !ethAmount) {
      setStatus("error");
      setStatusMsg("Fill all ETH fields.");
      return;
    }
    try {
      setStatus("pending");
      setStatusMsg("Sending ETH via execute()…");
      pushLog(
        `[ETH] Sending ${ethAmount} ${activeChain.nativeSymbol} from ${walletAddr} to ${ethRecipient}…`
      );
      const receipt = await sendEthExecute(
        signer,
        walletAddr,
        ethRecipient,
        ethAmount
      );
      const ok = receipt.status === 1n || receipt.status === 1;
      setStatus(ok ? "success" : "error");
      setStatusMsg(
        (ok ? "✅ ETH sent." : "❌ ETH transaction failed.") +
          " Tx: " +
          receipt.transactionHash
      );
      pushLog("[ETH] Tx: " + receipt.transactionHash);
      await refreshEthBalance(provider, walletAddr);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setStatusMsg("ETH send error: " + (e.message || e));
      pushLog("[ETH][ERROR] " + (e.message || e));
    }
  }

  async function handleProbeCustomToken() {
    if (!signer) {
      setStatus("error");
      setStatusMsg("Connect wallet first.");
      return;
    }
    if (!customTokenAddress) {
      setStatus("error");
      setStatusMsg("Enter token contract address first.");
      return;
    }
    try {
      setStatus("pending");
      setStatusMsg("Reading token metadata (symbol, decimals)…");
      const { ethers } = await import("ethers");
      const token = new ethers.Contract(customTokenAddress, [
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ], signer);
      const [symbol, decimals] = await Promise.all([
        token.symbol(),
        token.decimals()
      ]);
      setCustomTokenSymbol(symbol);
      setCustomTokenDecimals(decimals);
      setStatus("success");
      setStatusMsg(`Detected token: ${symbol} (decimals: ${decimals})`);
      pushLog(`[CUSTOM] Detected token ${symbol} with ${decimals} decimals.`);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setStatusMsg("Failed to read token metadata: " + (e.message || e));
      pushLog("[CUSTOM][ERROR] metadata: " + (e.message || e));
    }
  }

  async function handleSendCustomToken() {
    if (!signer) {
      setStatus("error");
      setStatusMsg("Connect wallet first.");
      return;
    }
    if (!walletAddr || !customTokenAddress || !customTokenRecipient || !customTokenAmount) {
      setStatus("error");
      setStatusMsg("Fill all custom token fields.");
      return;
    }
    try {
      setStatus("pending");
      setStatusMsg("Sending custom token via execute()…");
      pushLog(
        `[CUSTOM] Sending ${customTokenAmount} units from token ${customTokenAddress} to ${customTokenRecipient}…`
      );
      const receipt = await sendCustomTokenExecute(
        signer,
        walletAddr,
        customTokenAddress,
        customTokenRecipient,
        customTokenAmount
      );
      const ok = receipt.status === 1n || receipt.status === 1;
      setStatus(ok ? "success" : "error");
      setStatusMsg(
        (ok ? "✅ Custom token sent." : "❌ Custom token transaction failed.") +
          " Tx: " +
          receipt.transactionHash
      );
      pushLog("[CUSTOM] Tx: " + receipt.transactionHash);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setStatusMsg("Custom token send error: " + (e.message || e));
      pushLog("[CUSTOM][ERROR] " + (e.message || e));
    }
  }

  function handleChainChange(e) {
    const key = e.target.value;
    setSelectedChainKey(key);
    setStatus(null);
    setStatusMsg("");
    setLog("");
    setEthBalance(null);
  }

  return (
    <>
      <Header
        address={address}
        onConnect={handleConnect}
        chainName={
          selectedChainKey === "custom"
            ? activeChain.name
            : baseChains[selectedChainKey].name
        }
      />

      <div className="card">
        <div className="header-row" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h3>WalletConnect Project ID</h3>
            <p className="muted">
              Each user needs their own WalletConnect Cloud Project ID. This app never stores it
              anywhere, so it&apos;s safe to open-source and safe for users.
            </p>
            <label>
              Project ID
              <input
                placeholder="Paste your WalletConnect Project ID"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </label>
            {activeProjectId && (
              <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                Using Project ID: <code>{activeProjectId}</code>
              </p>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                marginTop: 4,
                padding: 14,
                borderRadius: 12,
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(148,163,184,0.55)",
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              <strong style={{ fontSize: 14 }}>
                How to get your WalletConnect Project ID
              </strong>
              <br />
              <br />
              WalletConnect requires each user to have their own Project ID. It&apos;s free and
              takes less than 15 seconds:
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                <li>
                  1. Visit{" "}
                  <a
                    href="https://cloud.walletconnect.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    cloud.walletconnect.com
                  </a>
                </li>
                <li>2. Sign in with Google, GitHub, or Email</li>
                <li>3. Click &quot;Create New Project&quot;</li>
                <li>4. Copy your &quot;Project ID&quot;</li>
                <li>5. Paste it into the field on the left</li>
              </ul>
              <div style={{ marginTop: 10, opacity: 0.8 }}>
                Nothing is saved in localStorage or sent to any backend.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-row">
          <div>
            <h3>Chain & Smart Wallet</h3>
            <p className="muted">
              Choose an EVM chain or define a custom one, then target any smart account that exposes{" "}
              <code>execute(address,uint256,bytes)</code>.
            </p>
          </div>
          <div style={{ minWidth: 220 }}>
            <label>
              Chain
              <select value={selectedChainKey} onChange={handleChainChange}>
                {Object.entries(baseChains).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name}
                  </option>
                ))}
                <option value="custom">Custom network…</option>
              </select>
            </label>
          </div>
        </div>

        {selectedChainKey === "custom" && (
          <>
            <label>
              Custom network name
              <input
                placeholder="MyChain"
                value={customChainName}
                onChange={(e) => setCustomChainName(e.target.value)}
              />
            </label>
            <label>
              Custom chain ID
              <input
                placeholder="e.g. 59144 for Linea, 8453 for Base"
                value={customChainId}
                onChange={(e) => setCustomChainId(e.target.value)}
              />
            </label>
            <p className="muted" style={{ marginTop: 6 }}>
              Your wallet must support this chain ID. This app does not store or validate any RPC URLs.
            </p>
          </>
        )}

        <label>
          dGEN1 wallet address
          <input
            placeholder="0x… smart account that exposes execute(target,value,data)"
            value={walletAddr}
            onChange={(e) => setWalletAddr(e.target.value)}
          />
        </label>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <button className="secondary" onClick={handleRefreshEth} disabled={!address}>
            Refresh {activeChain.nativeSymbol} balance
          </button>
          <span className="muted" style={{ fontSize: 12 }}>
            {ethBalance !== null
              ? `Balance in smart wallet: ${ethBalance} ${activeChain.nativeSymbol}`
              : "Balance not loaded yet."}
          </span>
        </div>
      </div>

      <div className="app-grid">
        <div>
          <div className="card">
            <h3>Send ETH</h3>
            <p className="muted">
              Sends native gas token ({activeChain.nativeSymbol}) from the smart wallet using{" "}
              <code>execute(recipient, value, "0x")</code>.
            </p>
            <label>
              Recipient address
              <input
                placeholder="0x…"
                value={ethRecipient}
                onChange={(e) => setEthRecipient(e.target.value)}
              />
            </label>
            <label>
              Amount ({activeChain.nativeSymbol})
              <input
                placeholder="0.01"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
              />
            </label>
            <div style={{ marginTop: 12 }}>
              <button onClick={handleSendEth} disabled={!address}>
                <span>Send {activeChain.nativeSymbol} via execute()</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Send ERC-20 (any token)</h3>
            <p className="muted">
              Paste any ERC-20 token contract address on the selected chain. This app will read{" "}
              <code>symbol()</code> and <code>decimals()</code> automatically, then send tokens via{" "}
              <code>execute(token, 0, transferData)</code>.
            </p>
            <label>
              Token contract address
              <input
                placeholder="0x…"
                value={customTokenAddress}
                onChange={(e) => setCustomTokenAddress(e.target.value)}
              />
            </label>
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button className="secondary" onClick={handleProbeCustomToken} disabled={!address}>
                Detect symbol & decimals
              </button>
              <span className="muted" style={{ fontSize: 12 }}>
                {customTokenSymbol
                  ? `Detected: ${customTokenSymbol} (decimals: ${customTokenDecimals})`
                  : "Not detected yet."}
              </span>
            </div>
            <label>
              Recipient address
              <input
                placeholder="0x…"
                value={customTokenRecipient}
                onChange={(e) => setCustomTokenRecipient(e.target.value)}
              />
            </label>
            <label>
              Amount (token units)
              <input
                placeholder="100"
                value={customTokenAmount}
                onChange={(e) => setCustomTokenAmount(e.target.value)}
              />
            </label>
            <div style={{ marginTop: 12 }}>
              <button onClick={handleSendCustomToken} disabled={!address}>
                <span>Send token via execute()</span>
              </button>
            </div>
          </div>

          <div className="card"><h3>Status</h3><div>Success or Error will appear here.</div></div>
        </div>
      </div>
    </>
  );
}
