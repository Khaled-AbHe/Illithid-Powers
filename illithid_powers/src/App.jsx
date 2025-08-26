import Menu from "./components/Menu";
import { useState, useEffect } from "react";

function App() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {}, []);

  console.log(userData);
  return (
    <div>
      <Menu />
    </div>
  );
}

export default App;
