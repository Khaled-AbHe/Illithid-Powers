function VialCounter(props) {
  return (
    <div className="flex flex-col content-center justify-center">
      <button
        className="size-8 cursor-pointer rounded-full border-3 border-purple-500 font-bold text-purple-500 hover:bg-purple-500/20"
        onClick={() => props.increase()}
      >
        ⋀
      </button>
      <p className="m-0 w-8 text-center text-2xl font-bold text-purple-500">
        {props.vials}
      </p>
      <button
        className="size-8 cursor-pointer rounded-full border-3 border-purple-500 font-bold text-purple-500 hover:bg-purple-500/20"
        onClick={() => props.decrease()}
      >
        ⋁
      </button>
    </div>
  );
}

export default VialCounter;
