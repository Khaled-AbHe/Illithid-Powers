// Google Identity Services ("Sign in with Google"), used by DMs. Players keep logging in
// with the name and password their DM gives them. The button only appears when
// VITE_GOOGLE_CLIENT_ID is set.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/** Loads Google's script once. Rejects if it can't be loaded (offline, blocked by an extension). */
export function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () =>
        reject(
          new Error("Couldn't load Google sign-in. Check your connection.")
        ),
      { once: true }
    );
  });
}

// Google must be initialised only once, but the page that shows the button can come and go,
// so the callback is a slot the current page fills in.
let credentialHandler = null;
let initialised = false;

export function setCredentialHandler(handler) {
  credentialHandler = handler;
}

export function initGoogle() {
  if (initialised) return;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => credentialHandler?.(response.credential),
  });
  initialised = true;
}
