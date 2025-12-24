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
      <div className="w-50 rounded-2xl border-3 border-purple-500">
        <p className="m-0 w-full text-center text-2xl font-bold text-purple-500">
          Vials
        </p>
        <div className="flex flex-row-reverse content-center justify-center">
          {/* Image */}
          <img className="m-0 size-[40%]" src={purpleVial} />
          {/* Counter */}
          <VialCounter vials={vials} increase={incVials} decrease={decVials} />
        </div>
      </div>
      <div className="flex justify-center text-purple-500">
        <button
          className="m-2 cursor-pointer rounded-2xl border-3 border-purple-500 px-2 py-1 text-center font-bold hover:bg-purple-500/20"
          onClick={() => reset()}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default Vials;
