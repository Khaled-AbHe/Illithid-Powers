import { isUnlockable } from "../../assets/data";
import ClaimButton from "./ClaimButton";

export default function PowerDesc(props) {
  const canUnlock = isUnlockable(props.powerKey, props.data);

  return (
    <>
      <div className="fixed top-0 right-[-73%] bottom-0 z-10 w-screen cursor-auto bg-black/50 select-none">
        <div className="absolute top-0 right-0 bottom-0 left-0 m-auto h-150 w-300 rounded-4xl border-3 border-pink-500 bg-radial from-neutral-800 to-neutral-950">
          {/* Escape */}
          <p
            className="absolute top-3 right-3 w-fit rounded-full px-2 font-bold text-pink-500 hover:cursor-pointer"
            onClick={() => props.toggleInfo()}
          >
            X
          </p>
          {/* Photo */}
          <img
            className="absolute top-0 bottom-10 left-20 m-auto scale-150"
            src={props.imgPath}
          />
          {/* Description */}
          <div className="absolute top-10 mx-[40%] my-10 h-100 w-150 text-xl">
            <p className="mb-10 font-serif text-5xl font-extrabold text-pink-500">
              {props.name}
            </p>
            <div className="m-2 text-white">
              <p className="inline font-bold text-pink-500">Description: </p>
              {props.desc}
            </div>
            <div className="m-2 text-white">
              <p className="inline font-bold text-pink-500">Requirements: </p>
              {props.cntrl.req}
            </div>
          </div>
          {/* Claim Button */}
          <ClaimButton
            claim={props.claim}
            handleClaim={props.handleClaim}
            canUnlock={canUnlock}
          />
        </div>
      </div>
    </>
  );
}
