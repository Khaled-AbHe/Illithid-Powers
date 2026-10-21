import { useContext } from "react";
import purpleVial from "/src/assets/photos/purpleVial.png";
import VialCounter from "./VialCounter";
import { DataContext } from "../DataContext";

function Vials() {
  const { vials } = useContext(DataContext);

  return (
    <div className="absolute top-10 right-10">
      <div className="w-50 rounded-2xl border-3 border-purple-500">
        <p className="m-0 w-full text-center text-2xl font-bold text-purple-500">
          Vials
        </p>
        <div className="flex flex-row-reverse content-center justify-center">
          {/* Image */}
          <img className="m-0 size-[40%]" src={purpleVial} />
          {/* Counter */}
          <VialCounter vials={vials} />
        </div>
      </div>
    </div>
  );
}

export default Vials;
