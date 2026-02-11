import { useState, useEffect, useRef } from "react";

const SCRIPT = `Hi, my name is [YOUR NAME] and I'm a constituent from [YOUR CITY].

I'm calling because Representatives Massie and Raskin confirmed the DOJ is hiding co-conspirator names behind redactions in the Epstein files.

I'm asking [REP NAME] to demand public hearings where DOJ officials explain each redaction under oath.

This passed 427 to 1. This is about trafficked children. Thank you.`;

// ── API helpers ──

async function detectZip() {
  try {
    const res = await fetch("https://ipinfo.io/json");
    if (!res.ok) return null;
    const data = await res.json();
    if (data.postal && data.country === "US") {
      return { zip: data.postal, city: data.city, region: data.region };
    }
  } catch {
    // silent
  }
  return null;
}

async function fetchReps(zip) {
  // Try direct first
  for (const baseUrl of [
    `https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`)}`,
  ]) {
    try {
      const res = await fetch(baseUrl);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results?.length) {
        return data.results.map((r) => ({
          name: r.name?.trim(),
          party: r.party,
          phone: r.phone,
          district: r.district,
          state: r.state,
          type: r.district ? "House" : "Senate",
          link: r.link,
        }));
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ── Components ──

function RepCard({ rep, index, called, onCall, onUncall }) {
  const [dialed, setDialed] = useState(false);
  const phoneDigits = rep.phone?.replace(/\D/g, "") || "";
  const partyColor =
    rep.party?.startsWith("R") ? "#ef4444" :
    rep.party?.startsWith("D") ? "#3b82f6" : "#a855f7";
  const label = rep.type === "House" ? `${rep.state}-${rep.district}` : `${rep.state} Senator`;

  return (
    <div
      style={{
        padding: 16,
        background: called ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${called ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 10,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f0e8", marginBottom: 2 }}>
            {rep.name}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 0.5 }}>
            <span style={{ color: partyColor }}>{rep.party}</span> &middot; {label}
          </div>
        </div>

        {called ? (
          <button
            onClick={() => onUncall(index)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 8,
              padding: "12px 20px",
              color: "#4ade80",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Courier New', monospace",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            &#10003; Called
          </button>
        ) : (
          <a
            href={`tel:${phoneDigits}`}
            onClick={() => setDialed(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#dc2626",
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "'Courier New', monospace",
              textDecoration: "none",
              cursor: "pointer",
              flexShrink: 0,
              letterSpacing: 0.5,
            }}
          >
            &#9742; {rep.phone}
          </a>
        )}
      </div>

      {/* Confirm after dialing */}
      {dialed && !called && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontSize: 12, color: "#9ca3af", flex: 1 }}>Did you get through?</span>
          <button
            onClick={() => { onCall(index); setDialed(false); }}
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 6,
              padding: "6px 14px",
              color: "#4ade80",
              fontWeight: 700,
              fontSize: 12,
              fontFamily: "'Courier New', monospace",
              cursor: "pointer",
            }}
          >
            Yes, I called
          </button>
          <button
            onClick={() => setDialed(false)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 14px",
              color: "#8b95a5",
              fontSize: 12,
              fontFamily: "'Courier New', monospace",
              cursor: "pointer",
            }}
          >
            Not yet
          </button>
        </div>
      )}
    </div>
  );
}

function CallScript({ reps, calledSet }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pick next uncalled rep name for script
  let repName = "[REP NAME]";
  for (let i = 0; i < reps.length; i++) {
    if (!calledSet.has(i)) {
      repName = reps[i].name;
      break;
    }
  }
  if (repName === "[REP NAME]" && reps.length > 0) repName = reps[0].name;

  const scriptText = SCRIPT.replace("[REP NAME]", repName);

  const copy = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: 12,
          fontFamily: "'Courier New', monospace",
          cursor: "pointer",
          padding: "8px 0",
          letterSpacing: 1,
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
        }}
      >
        <span style={{ transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0)" }}>&#9654;</span>
        What to say (30-second script)
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <button
              onClick={copy}
              style={{
                background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: copied ? "#4ade80" : "#94a3b8",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                fontFamily: "'Courier New', monospace",
                letterSpacing: 0.5,
              }}
            >
              {copied ? "✓ Copied" : "Copy script"}
            </button>
          </div>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: 16,
              fontSize: 13,
              lineHeight: 1.8,
              color: "#b0b8c4",
              whiteSpace: "pre-wrap",
            }}
          >
            {scriptText.split(/(\[YOUR NAME\]|\[YOUR CITY\])/).map((part, i) =>
              part === "[YOUR NAME]" || part === "[YOUR CITY]" ? (
                <span key={i} style={{ color: "#fbbf24" }}>{part}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StickerForm({ zip }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: 16 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>&#x1F4EC;</div>
        <div style={{ fontSize: 16, color: "#4ade80", fontFamily: "Georgia, serif", marginBottom: 6 }}>
          Stickers on the way.
        </div>
        <p style={{ fontSize: 13, color: "#94a3b8", fontFamily: "Georgia, serif" }}>
          Now share this page and get 3 people to call.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" placeholder="Full name" autoComplete="name" style={inputStyle} />
        <input type="text" placeholder="Street address" autoComplete="street-address" style={inputStyle} />
        <div style={{ display: "flex", gap: 10 }}>
          <input type="text" placeholder="City" autoComplete="address-level2" style={inputStyle} />
          <input
            type="text"
            placeholder="ST"
            maxLength={2}
            autoComplete="address-level1"
            style={{ ...inputStyle, maxWidth: 70, textTransform: "uppercase" }}
          />
        </div>
        <input
          type="text"
          placeholder="Zip"
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          defaultValue={zip}
          style={{ ...inputStyle, maxWidth: 120, letterSpacing: 2 }}
        />
        <button
          onClick={() => setSubmitted(true)}
          style={{
            background: "#dc2626",
            border: "none",
            borderRadius: 8,
            padding: 14,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "'Courier New', monospace",
            cursor: "pointer",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          SEND MY FREE STICKERS
        </button>
      </div>
      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 10, lineHeight: 1.5 }}>
        US addresses only. Ships in ~2 weeks. Address used only for shipping.
      </p>
    </div>
  );
}

// ── Shared styles ──

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  padding: 24,
};

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  padding: "12px 14px",
  color: "#f5f0e8",
  fontSize: 14,
  fontFamily: "'Courier New', monospace",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

// ── Main App ──

export function App() {
  const [zip, setZip] = useState("");
  const [zipInfo, setZipInfo] = useState(null); // { city, region }
  const [reps, setReps] = useState(null); // null = not loaded, [] = empty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calledSet, setCalledSet] = useState(new Set());

  const repsRef = useRef(null);
  const doneRef = useRef(null);

  // Auto-detect zip on mount
  useEffect(() => {
    detectZip().then((info) => {
      if (info && !zip) {
        setZip(info.zip);
        setZipInfo({ city: info.city, region: info.region });
        // Auto-lookup
        doLookup(info.zip);
      }
    });
  }, []);

  const doLookup = async (zipCode) => {
    const z = zipCode || zip;
    if (!/^\d{5}$/.test(z)) {
      setError("Enter a 5-digit zip code");
      return;
    }
    setError(null);
    setLoading(true);
    setReps(null);

    const results = await fetchReps(z);
    setLoading(false);

    if (results) {
      setReps(results);
      setCalledSet(new Set());
      setTimeout(() => repsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } else {
      setError("Couldn't find reps. Try congress.gov/members/find-your-member");
    }
  };

  const markCalled = (i) => {
    setCalledSet((prev) => {
      const next = new Set(prev);
      next.add(i);
      // Check if all called — scroll to done
      if (reps && next.size >= reps.length) {
        setTimeout(() => doneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
      }
      return next;
    });
  };

  const unmarkCalled = (i) => {
    setCalledSet((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const allCalled = reps && reps.length > 0 && calledSet.size >= reps.length;

  const shareText = "The DOJ is hiding names from the Epstein files. 30 seconds to call your rep. Free sticker.\n\nhttps://jmail.world/act";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#c8c4b8",
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 20px" }}>
        {/* Hero */}
        <section style={{ textAlign: "center", padding: "60px 0 40px" }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#dc2626",
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            <span style={{ display: "inline-block", width: 20, height: 1, background: "#dc2626", verticalAlign: "middle", marginRight: 8 }} />
            ACT NOW
            <span style={{ display: "inline-block", width: 20, height: 1, background: "#dc2626", verticalAlign: "middle", marginLeft: 8 }} />
          </div>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(28px, 6vw, 44px)",
              fontWeight: 400,
              color: "#f5f0e8",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Call your rep.
            <br />
            Get a free sticker.
          </h1>
          <p
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 16,
              color: "#94a3b8",
              lineHeight: 1.6,
              maxWidth: 440,
              margin: "0 auto",
            }}
          >
            The DOJ is hiding names from the Epstein files. 30 seconds to call. We find the number for you.
          </p>
        </section>

        {/* Zip Input */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#8b95a5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            Your zip code
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="00000"
              autoComplete="postal-code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onKeyDown={(e) => e.key === "Enter" && doLookup()}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "14px 16px",
                color: "#f5f0e8",
                fontSize: 20,
                fontFamily: "'Courier New', monospace",
                letterSpacing: 6,
                textAlign: "center",
                outline: "none",
              }}
            />
            <button
              onClick={() => doLookup()}
              disabled={loading}
              style={{
                background: "#dc2626",
                border: "none",
                borderRadius: 8,
                padding: "14px 24px",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                fontFamily: "'Courier New', monospace",
                cursor: loading ? "default" : "pointer",
                letterSpacing: 1,
                opacity: loading ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "..." : "FIND"}
            </button>
          </div>
          {zipInfo && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, textAlign: "center" }}>
              Detected: {zipInfo.city}, {zipInfo.region}
            </div>
          )}
          {error && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 8, textAlign: "center" }}>{error}</div>
          )}
        </div>

        {/* Reps Section */}
        {(reps || loading) && (
          <div ref={repsRef}>
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#8b95a5", letterSpacing: 2, textTransform: "uppercase" }}>
                  Your representatives
                </div>
                {reps && reps.length > 0 && (
                  <div style={{ fontSize: 11, color: allCalled ? "#4ade80" : "#4a4a4a" }}>
                    {calledSet.size}/{reps.length} called
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {reps && reps.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {reps.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: calledSet.has(i) ? "#4ade80" : "rgba(255,255,255,0.15)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: "center", padding: 32, color: "#8b95a5", fontSize: 13 }}>
                  Finding your representatives...
                </div>
              )}

              {/* Rep list */}
              {reps && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reps.map((rep, i) => (
                    <RepCard
                      key={i}
                      rep={rep}
                      index={i}
                      called={calledSet.has(i)}
                      onCall={markCalled}
                      onUncall={unmarkCalled}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {reps && reps.length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: "#8b95a5", fontSize: 13 }}>
                  No representatives found. Try a different zip code.
                </div>
              )}
            </div>

            {/* Call Script */}
            {reps && reps.length > 0 && <CallScript reps={reps} calledSet={calledSet} />}
          </div>
        )}

        {/* Done Section */}
        {allCalled && (
          <div ref={doneRef}>
            {/* Success message */}
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <h3 style={{ color: "#4ade80", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>
                All called. You did the thing.
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 14, fontFamily: "Georgia, serif" }}>
                Every call is logged by staffers. You just made the report.
              </p>
            </div>

            {/* Sticker claim */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#8b95a5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Get your free sticker pack
              </div>
              <StickerForm zip={zip} />
            </div>

            {/* Share */}
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#8b95a5", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Multiply your impact
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={shareBtnStyle}
                >
                  Share on X
                </a>
                <a href={`sms:?body=${encodeURIComponent(shareText)}`} style={shareBtnStyle}>
                  Text a friend
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText("https://jmail.world/act")}
                  style={shareBtnStyle}
                >
                  Copy link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ padding: "40px 0 60px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: 40 }}>
          <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.7 }}>
            Not affiliated with any political party, campaign, or government entity.
            <br />
            <a href="https://jmail.world" style={{ color: "#8b95a5", textDecoration: "none" }}>
              Read the emails
            </a>
          </p>
        </footer>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; }
        input::placeholder { color: #6b7280; }
        input:focus { border-color: rgba(220,38,38,0.4) !important; outline: none; }
        @media (max-width: 480px) {
          .rep-card-wrap { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>
    </div>
  );
}

const shareBtnStyle = {
  flex: "1 1 100px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#c8c4b8",
  padding: "12px 14px",
  borderRadius: 6,
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 12,
  fontFamily: "'Courier New', monospace",
  cursor: "pointer",
  letterSpacing: 0.5,
};
