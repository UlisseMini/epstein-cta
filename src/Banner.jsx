/**
 * CTA Banner component for embedding on jmail.world pages.
 *
 * Usage:
 *   import { Banner } from "./Banner";
 *   <Banner />
 *
 * Renders a slim top-bar style banner linking to /act.
 */

export function Banner() {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, #0d0d12 0%, #14141f 50%, #0d0d12 100%)",
        borderBottom: "1px solid rgba(220,38,38,0.2)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 13,
        position: "relative",
        zIndex: 1000,
      }}
    >
      <span style={{ color: "#94a3b8", letterSpacing: 0.3 }}>
        <span style={{ color: "#dc2626", fontWeight: 700 }}>6+ names</span> hidden from the Epstein files.
      </span>

      <a
        href="/act"
        style={{
          background: "#dc2626",
          color: "#fff",
          padding: "6px 16px",
          borderRadius: 4,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 1,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          transition: "background 0.15s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#b91c1c")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#dc2626")}
      >
        Call your rep &rarr; free sticker
      </a>
    </div>
  );
}
