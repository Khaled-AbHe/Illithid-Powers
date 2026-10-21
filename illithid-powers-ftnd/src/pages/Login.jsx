import { useState } from "react";
import { Navigate } from "react-router-dom";
import { homeFor, useAuth } from "../auth/authContext";
import { googleEnabled } from "../auth/google";
import GoogleSignIn from "../auth/GoogleSignIn";
import brain from "../assets/photos/brain.png";

export default function Login() {
  const { user, login, loginWithGoogle } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      // Logging in sets the user, which re-renders into the redirect above.
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  async function handleGoogle(credential) {
    setError("");
    try {
      await loginWithGoogle(credential);
    } catch (err) {
      setError(err.message);
    }
  }

  const inputClass =
    "mb-4 w-full rounded-xl border-2 border-pink-500 bg-black/40 px-3 py-2 text-white outline-none focus:bg-pink-500/10";

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-radial from-red-950 to-black select-none">
      <img
        className="absolute top-0 right-0 bottom-0 left-0 z-0 m-auto scale-200 opacity-40"
        src={brain}
        alt=""
      />
      <form
        onSubmit={handleSubmit}
        className="z-1 w-96 rounded-4xl border-3 border-pink-500 bg-radial from-neutral-800 to-neutral-950 p-8"
      >
        <h1 className="mb-6 text-center text-4xl font-extrabold text-pink-500">
          Illithid Powers
        </h1>

        <label
          htmlFor="username"
          className="mb-1 block font-bold text-pink-500"
        >
          Username
        </label>
        <input
          id="username"
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
        />

        <label
          htmlFor="password"
          className="mb-1 block font-bold text-pink-500"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p role="alert" className="mb-4 text-center text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-full border-3 border-pink-500 py-2 text-xl font-bold text-pink-500 hover:bg-pink-500/20 disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        {googleEnabled && (
          <div className="mt-6 border-t-2 border-stone-700 pt-4">
            <p className="mb-3 text-center text-sm text-stone-400">
              DM? Sign in with Google
            </p>
            <GoogleSignIn onCredential={handleGoogle} onError={setError} />
          </div>
        )}
      </form>
    </div>
  );
}
