export default function FullScreenMessage({ children }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-radial from-red-950 to-black text-xl text-pink-500 select-none">
      {children}
    </div>
  );
}
