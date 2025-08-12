import { useState } from "react";

export default function Power(props) {
  const [info, setInfo] = useState(false);

  return (
    <>
      <div className="bg-stone-900 rounded-full border-pink-500 border-2 size-15 z-2 hover:cursor-pointer">
        <img src={props.link} onClick={() => setInfo((prev) => !prev)} />
        {info && (
          <div>
            <p className="bg-white">abc</p>
          </div>
        )}
      </div>
    </>
  );
}
