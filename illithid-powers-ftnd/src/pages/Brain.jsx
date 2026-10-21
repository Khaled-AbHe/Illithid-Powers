import { useContext } from "react";
import { DataContext, DataProvider } from "../components/DataContext";
import FullScreenMessage from "../components/FullScreenMessage";
import Menu from "../components/Menu";

function BrainContent() {
  const { status, error, reload } = useContext(DataContext);

  if (status === "loading") {
    return <FullScreenMessage>Loading…</FullScreenMessage>;
  }
  if (status === "error") {
    return (
      <FullScreenMessage>
        <p>{error.message}</p>
        <button
          className="cursor-pointer rounded-2xl border-3 border-pink-500 px-3 py-1 font-bold hover:bg-pink-500/20"
          onClick={reload}
        >
          Try again
        </button>
      </FullScreenMessage>
    );
  }
  return <Menu />;
}

export default function Brain() {
  return (
    <DataProvider>
      <BrainContent />
    </DataProvider>
  );
}
