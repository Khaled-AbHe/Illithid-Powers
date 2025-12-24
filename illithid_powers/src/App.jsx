import Menu from "./components/Menu";
import { DataProvider } from "./components/DataContext.jsx";

function App() {
  return (
    <DataProvider>
      <Menu />
    </DataProvider>
  );
}

export default App;
