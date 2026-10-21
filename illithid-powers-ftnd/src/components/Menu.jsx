import Power from "./power/Power";
import { useContext } from "react";
import { DataContext } from "./DataContext";
import Vials from "./Vials/Vials";
import UserBar from "./UserBar";
import BrainTree from "./BrainTree";

import brain from "../assets/photos/brain.png";

function Menu() {
  const { data } = useContext(DataContext);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-radial from-red-950 to-black select-none">
      <img
        className="absolute top-0 right-0 bottom-0 left-0 z-0 m-auto scale-78"
        src={brain}
      />
      <Vials />
      <UserBar />
      <BrainTree
        renderPower={(key) => <Power power={data.abilities[key]} data={data} />}
      />
    </div>
  );
}

export default Menu;
