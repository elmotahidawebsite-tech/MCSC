import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/navbar/Navbar";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import { UserSidebar } from "@/components/sidebar/UserSidebar";
import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/constants/roles";

export default function DashboardLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <div className={`flex h-screen ${isAdmin ? "bg-white" : "bg-slate-100"}`}>
      {isAdmin ? (
        <AdminSidebar />
      ) : (
        <UserSidebar />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />

        <main className={`flex-1 overflow-y-auto ${isAdmin ? "p-10" : "p-6"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}