import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/" className="text-sm font-semibold tracking-wide">
            CSC · Crime Scene Collector
          </Link>
          {user && (
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>
                {user.username} <span className="text-gray-500">· {user.role}</span>
              </span>
              <button onClick={logout} className="text-gray-300 hover:text-white">
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
