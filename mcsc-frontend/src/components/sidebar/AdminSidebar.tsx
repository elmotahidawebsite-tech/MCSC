import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "node_modules/react-i18next";
import {
  LayoutDashboard,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Users,
  Settings,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/Button";

export function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation("sidebar");
  const isRtl = i18n.resolvedLanguage === "ar";

  const menu = [
    {
      title: t("sidebar:menu.dashboard"),
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("sidebar:menu.cases"),
      path: "/admin/cases",
      icon: FolderOpen,
    },
    // {
    //   title: t("sidebar:menu.users"),
    //   path: "/admin/users",
    //   icon: Users,
    // },
    // {
    //   title: t("sidebar:menu.settings"),
    //   path: "/admin/settings",
    //   icon: Settings,
    // },
  ];

  const isDashboardActive =
    location.pathname === "/admin/dashboard";

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className={`fixed top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[#e5edf2] bg-white shadow-sm text-[#475569] hover:bg-[#f1f5f9] transition xl:hidden ${
          isRtl ? "right-4" : "left-4"
        }`}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm xl:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 z-40 flex h-full w-72 flex-col border-[#e5edf2] bg-white p-5 transition-transform duration-300 ease-in-out xl:static xl:translate-x-0 ${
          isRtl ? "border-l right-0" : "border-r left-0"
        } ${
          isRtl
            ? isOpen
              ? "translate-x-0"
              : "translate-x-full"
            : isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Top: Brand */}
        <div className={`my-7 border-b border-[#eef3f7] pb-5`}>
          <div className="w-full text-center">
            <div className="text-[2.5rem] font-extrabold tracking-[0.05em] text-[#005588] leading-none">
              CSC
            </div>
            <div className={`mt-2 text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-[#3a7ca8]`}>
              {t("sidebar:brand.titleLong")}
            </div>
            <div className={`mt-4 flex items-center justify-center gap-3`}>
              <div className="h-px w-10 bg-[#b8d8eb]" />
              <div className="text-[1rem] font-bold tracking-[0.3em] uppercase text-[#005588]">
                {t("sidebar:brand.subtitle")}
              </div>
              <div className="h-px w-10 bg-[#b8d8eb]" />
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
                    ? "bg-slate-100 text-[#005588]"
                    : "text-gray-600 hover:bg-slate-50"
                  }`
                }
              >
                <Icon size={20} />

                <span>{item.title}</span>
              </NavLink>
            );
          })}

        </nav>
        <div className="flex-1" />

        {/* Bottom: Station ID + Log Out */}
        <div className={`border-t border-[#eef3f7] pt-4 space-y-3`}>

          <Button

            variant="destructive"
            className="w-full "
            onClick={() => {
              logout();
              closeSidebar();
            }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[#64748b] group-hover:bg-[#fee2e2]`}>
              <LogOut size={15} />
            </div>
            {t("sidebar:footer.logout")}
          </Button>
        </div>

      </aside>
    </>
  );
}
