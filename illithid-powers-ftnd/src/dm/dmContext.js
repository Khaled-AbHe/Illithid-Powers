import { createContext, useContext } from "react";

export const DmContext = createContext(null);

/** Shared by both DM pages: catalog, players, which player is selected, refresh. */
export const useDm = () => useContext(DmContext);
