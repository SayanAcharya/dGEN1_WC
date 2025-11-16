export default function Header({ address, onConnect, chainName }) {
  return (
    <div className="card">
      <div className="header-row">
              <img src="/logo.png" alt="logo" style={{height:40,marginRight:12,borderRadius:8}}/>

        <div>
          <h2>dGEN1_WC · Multi-Chain Recovery Console</h2>
          <div className="tagline">
            Execute <code>execute(target, value, data)</code> on any smart wallet across major EVM chains.
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 230 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
            Active chain: <strong>{chainName}</strong>
          </div>
          {address ? (
            <>
              <div className="badge">
                <span className="badge-dot" /> Connected
              </div>
              <div
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  maxWidth: 260,
                  wordBreak: "break-all",
                  color: "#9ca3af"
                }}
              >
                {address}
              </div>
            </>
          ) : (
            <button onClick={onConnect}>
              <span>Connect WalletConnect</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
