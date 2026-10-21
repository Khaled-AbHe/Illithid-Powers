import { useEffect, useRef } from "react";
import {
  googleEnabled,
  initGoogle,
  loadGoogleScript,
  setCredentialHandler,
} from "./google";

/** Google's own "Continue with Google" button. Renders nothing when Google sign-in isn't configured. */
export default function GoogleSignIn({ onCredential, onError }) {
  const container = useRef(null);
  const latest = useRef({ onCredential, onError });
  latest.current = { onCredential, onError };

  useEffect(() => {
    if (!googleEnabled) return;
    let cancelled = false;
    setCredentialHandler((credential) =>
      latest.current.onCredential(credential)
    );
    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current) return;
        initGoogle();
        window.google.accounts.id.renderButton(container.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 280,
        });
      })
      .catch((err) => {
        if (!cancelled) latest.current.onError(err.message);
      });
    return () => {
      cancelled = true;
      setCredentialHandler(null);
    };
  }, []);

  if (!googleEnabled) return null;
  return <div ref={container} className="flex justify-center" />;
}
