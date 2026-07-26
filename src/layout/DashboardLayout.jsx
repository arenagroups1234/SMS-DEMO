import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <Outlet />
    </div>
  );
}
