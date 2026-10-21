import { useId } from "react";

export default function Modal({ title, danger = false, onClose, children }) {
  const titleId = useId();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className={
          "max-h-full w-full max-w-xl overflow-y-auto rounded-3xl border-3 bg-neutral-900 p-7 text-stone-200 " +
          (danger ? "border-red-500" : "border-pink-500")
        }
      >
        <h2
          id={titleId}
          className={
            "text-3xl font-extrabold " +
            (danger ? "text-red-300" : "text-pink-300")
          }
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border-2 border-pink-500 bg-stone-950 px-3 text-white outline-none focus:bg-pink-500/10";
export const labelClass = "mb-1.5 block text-sm font-bold text-pink-300";
export const hintClass = "mt-1.5 text-sm text-stone-400";
export const btnClass =
  "min-h-11 cursor-pointer rounded-full border-2 border-pink-500 px-4 font-bold text-pink-300 hover:bg-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimaryClass =
  "min-h-11 cursor-pointer rounded-full border-2 border-pink-500 bg-pink-500 px-4 font-bold text-pink-950 hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDangerClass =
  "min-h-11 cursor-pointer rounded-full border-2 border-red-500 px-4 font-bold text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDangerFillClass =
  "min-h-11 cursor-pointer rounded-full border-2 border-red-700 bg-red-700 px-4 font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50";
