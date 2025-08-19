import Menu from "./components/Menu";
import { users } from "./assets/data";
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Example: Replace this with real API call
    if (username === "Srosu" && password === "Paladin123") {
      setUser({ username });
      navigate("/brain");
    } else {
      alert("Invalid login");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col gap-2 max-w-xs mx-auto mt-20"
    >
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-500 text-white rounded p-2">
        Login
      </button>
    </form>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null); // keeps track of who is logged in

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route
          path="/brain"
          element={
            <ProtectedRoute user={user}>
              <Menu user={user} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
