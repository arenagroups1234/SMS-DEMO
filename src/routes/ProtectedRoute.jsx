// ProtectedRoute — passes through for now; add real auth check later
import { Outlet } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  return children ?? <Outlet />;
}
