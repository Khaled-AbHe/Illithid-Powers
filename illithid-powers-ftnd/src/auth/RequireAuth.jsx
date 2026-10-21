import { Navigate } from "react-router-dom";
import FullScreenMessage from "../components/FullScreenMessage";
import { homeFor, useAuth } from "./authContext";

const buttonClass =
  "cursor-pointer rounded-2xl border-3 border-pink-500 px-3 py-1 font-bold text-pink-500 hover:bg-pink-500/20";

/** Route guard: needs a logged-in user, and optionally a specific role. */
export default function RequireAuth({ role, children }) {
  const { user, status, logout, retry } = useAuth();

  if (status === "loading") {
    return <FullScreenMessage>Loading…</FullScreenMessage>;
  }
  if (status === "error") {
    return (
      <FullScreenMessage>
        <p>Can&apos;t reach the server.</p>
        <div className="flex gap-3">
          <button className={buttonClass} onClick={retry}>
            Try again
          </button>
          <button className={buttonClass} onClick={logout}>
            Log out
          </button>
        </div>
      </FullScreenMessage>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return children;
}
