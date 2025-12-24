import { useContext } from "react";
import purpleVial from "/src/assets/photos/purpleVial.png";
import VialCounter from "./VialCounter";
import { DataContext } from "../DataContext";

function Vials() {
  const { vials, increase, decrease, reset } = useContext(DataContext);

  function incVials() {
    increase(1);
  }

  function decVials() {
    decrease(1);
  }

  return (
    <div className="absolute top-10 right-10">
      <div className="w-50 border-purple-500 border-3 rounded-2xl">
        <p className="m-0 font-bold w-full text-center text-2xl text-purple-500">
          Vials
        </p>
        <div className="flex flex-row-reverse justify-center content-center">
          {/* Image */}
          <img className="size-[40%] m-0" src={purpleVial} />
          {/* Counter */}
          <VialCounter vials={vials} increase={incVials} decrease={decVials} />
        </div>
      </div>
      <div className="flex justify-center text-purple-500">
        <button
          className="text-center m-2 px-2 py-1 rounded-2xl font-bold border-3 border-purple-500 cursor-pointer hover:bg-purple-500/20"
          onClick={() => reset()}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default Vials;
