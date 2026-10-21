import { useAuth } from "../auth/authContext";

export default function UserBar() {
  const { user, logout } = useAuth();
  return (
    <div className="absolute top-10 left-10 z-2 flex items-center gap-3 text-pink-500">
      <span className="font-bold">{user.username}</span>
      <button
        className="cursor-pointer rounded-2xl border-3 border-pink-500 px-2 py-1 font-bold hover:bg-pink-500/20"
        onClick={logout}
      >
        Log out
      </button>
    </div>
  );
}
