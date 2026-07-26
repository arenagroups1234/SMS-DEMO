/* Reusable empty state for all dashboards and portals */
export default function EmptyState({ title, icon = "📄", description }) {
  return (
    <div>
      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20,
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: "#E0F2FE",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>{icon}</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1F2937" }}>{title}</h2>
            {description && <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#9CA3AF" }}>{description}</p>}
          </div>
        </div>
      </div>

      {/* Empty card */}
      <div style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        minHeight: 380,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          textAlign: "center",
          padding: "48px 32px",
          maxWidth: 400,
          border: "2px dashed #E5E7EB",
          borderRadius: 12,
          background: "#F9FAFB",
        }}>
          <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 14 }}>{icon}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
            {title} Module
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>
            This section is ready for development.<br />
            Features will appear here once implemented.
          </p>
          <div style={{
            marginTop: 16,
            display: "inline-block",
            padding: "4px 14px",
            background: "#E0F2FE",
            color: "#0284C7",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
          }}>Coming Soon</div>
        </div>
      </div>
    </div>
  );
}
