import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

/** Where each role lands after logging in. */
export const homeFor = (role) => (role === "dm" ? "/dm" : "/brain");
