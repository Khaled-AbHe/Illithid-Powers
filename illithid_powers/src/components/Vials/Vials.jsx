import { useState, useContext } from "react";

import purpleVial from "/src/assets/photos/purpleVial.png";
import VialCounter from "./VialCounter";
import { DataContext } from "../DataContext";

function Vials() {
  const { vials, increase, decrease } = useContext(DataContext);
  const [vial, setVials] = useState(vials);

  function incVials() {
    setVials((prev) => {
      return prev + 1;
    });
    increase(1);
  }

  function decVials() {
    setVials((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return 0;
    });
    decrease(1);
  }

  return (
    <div className="absolute top-10 right-10 w-50 border-purple-500 border-3 rounded-2xl">
      <p className="m-0 font-bold w-full text-center text-2xl text-purple-500">
        Vials
      </p>
      <div className="flex flex-row-reverse justify-center content-center">
        {/* Image */}
        <img className="size-[40%] m-0" src={purpleVial} />
        {/* Counter */}
        <VialCounter vials={vial} increase={incVials} decrease={decVials} />
      </div>
    </div>
  );
}

export default Vials;
