function VialCounter(props) {
  return (
    <div className="flex flex-col justify-center content-center">
      <button
        className="font-bold text-purple-500 border-purple-500 border-3 rounded-full size-8 cursor-pointer hover:bg-purple-500/20"
        onClick={() => props.increase()}
      >
        ⋀
      </button>
      <p className="m-0 font-bold w-8 text-center text-2xl text-purple-500">
        {props.vials}
      </p>
      <button
        className="font-bold text-purple-500 border-purple-500 border-3 rounded-full size-8 cursor-pointer hover:bg-purple-500/20"
        onClick={() => props.decrease()}
      >
        ⋁
      </button>
    </div>
  );
}

export default VialCounter;
