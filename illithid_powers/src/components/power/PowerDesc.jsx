export default function PowerDesc(props) {
  return (
    <>
      <div className="fixed left-0 right-0 top-0 bottom-0 bg-black/50 select-none cursor-auto z-10 ">
        <div className="absolute rounded-4xl border-pink-500 border-3 bg-radial from-neutral-800 to-neutral-950 left-0 right-0 top-0 bottom-0 h-150 w-300 m-auto">
          {/* Escape */}
          <p
            className="absolute right-3 top-3 px-2 rounded-full w-fit text-pink-500 font-bold hover:cursor-pointer"
            onClick={() => props.toggleInfo()}
          >
            X
          </p>
          {/* Photo */}
          <img
            className="absolute top-0 bottom-10 left-20 m-auto scale-150"
            src={props.link}
          />
          {/* Description */}
          <div className="absolute mx-[40%] my-10 top-10 w-150 h-100 text-xl">
            <p className="text-pink-500 font-extrabold font-serif mb-10 text-center text-5xl">
              {props.name}
            </p>
            <p className="text-white m-2">
              <p className="inline text-pink-500 font-bold">Cost: </p>
              {props.cost}
            </p>
            <p className="text-white m-2">
              <p className="inline text-pink-500 font-bold">Charges: </p>
              {props.charges}
            </p>
            <p className="text-white m-2">
              <p className="inline text-pink-500 font-bold">Duration: </p>
              {props.duration}
            </p>
            <p className="text-white m-2">
              <p className="inline text-pink-500 font-bold">Description: </p>
              {props.description}
            </p>
            <p className="text-white m-2">
              <p className="inline text-pink-500 font-bold">Requirements: </p>
              {props.req == null ? "None" : props.req}
            </p>
          </div>
          {/* Claim Button */}
          <p
            className={
              "text-pink-500 absolute bottom-10 mx-[49%] border-2 px-3 py-1 rounded-full w-21 text-center hover:cursor-pointer " +
              `${props.claim ? " bg-neutral-950/50" : undefined}`
            }
            onClick={() => props.toggleClaim()}
          >
            {props.claim ? "Claimed" : "Claim"}
          </p>
        </div>
      </div>
    </>
  );
}
