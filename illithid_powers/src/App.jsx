import { useState } from "react";
import Power from "./power/Power";
import illithidIdentification from "./assets/photos/illithid_identification.png";
import brain from "./assets/photos/brain.png";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="bg-radial from-red-950 to-black h-[925px] w-full flex overflow-hidden">
      <img
        className="absolute right-0 left-0 top-0 bottom-0 m-auto scale-200 z-1"
        src={brain}
      />
      <div className="right-0 left-0 m-auto h-220 w-190 z-2">
        <Power link={illithidIdentification} />
      </div>
    </div>
  );
}

export default App;
