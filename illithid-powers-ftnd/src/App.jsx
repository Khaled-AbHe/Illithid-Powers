import { Navigate, Route, Routes } from "react-router-dom";
import { homeFor, useAuth } from "./auth/authContext";
import RequireAuth from "./auth/RequireAuth";
import FullScreenMessage from "./components/FullScreenMessage";
import Brain from "./pages/Brain";
import DmLayout from "./dm/DmLayout";
import DmPlayers from "./pages/DmPlayers";
import DmPowers from "./pages/DmPowers";
import Login from "./pages/Login";

function Home() {
  const { user, status } = useAuth();
  if (status === "loading") {
    return <FullScreenMessage>Loading…</FullScreenMessage>;
  }
  return <Navigate to={user ? homeFor(user.role) : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/brain"
        element={
          <RequireAuth role="player">
            <Brain />
          </RequireAuth>
        }
      />
      <Route
        path="/dm"
        element={
          <RequireAuth role="dm">
            <DmLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="powers" replace />} />
        <Route path="powers" element={<DmPowers />} />
        <Route path="players" element={<DmPlayers />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
