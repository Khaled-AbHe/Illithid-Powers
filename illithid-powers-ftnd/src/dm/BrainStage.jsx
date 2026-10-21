import { useLayoutEffect, useRef, useState } from "react";
import BrainTree from "../components/BrainTree";
import brain from "../assets/photos/brain.png";

const BOX_W = 760;
const BOX_H = 880;

export default function BrainStage({ renderPower }) {
  const stage = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width && height) {
        setScale(Math.min(1, (width - 24) / BOX_W, (height - 24) / BOX_H));
      }
    };
    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stage}
      className="relative min-w-0 flex-1 overflow-hidden bg-radial from-red-950 to-black"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-220 w-190 shrink-0" style={{ scale }}>
          <img
            className="absolute top-0 right-0 bottom-0 left-0 z-0 m-auto scale-102"
            src={brain}
            alt=""
          />
          <BrainTree renderPower={renderPower} />
        </div>
      </div>
    </div>
  );
}
