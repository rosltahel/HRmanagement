import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Star,
  GitBranch,
  BarChart3,
  LogOut,
} from "lucide-react";

export default function HRNavbar() {
  const navigate = useNavigate();

  const user = {
    name: localStorage.getItem("userName") || "Rosol",
    title: "HR Manager",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  const navItems = [
    { to: "/hr", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/hr/employees", label: "Team Members", icon: Users },
    { to: "/hr/skills", label: "Learning Paths", icon: Star },
    { to: "/hr/hierarchy", label: "Org Chart", icon: GitBranch },
    // { to: "/hr/reports", label: "Reports", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-slate-800 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="text-2xl font-bold text-white">🌌 SkillGalaxy</div>
        <div className="text-xs text-slate-400 mt-1">HR Dashboard</div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-purple-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>

          <div>
            <div className="text-sm font-medium text-white">{user?.name}</div>
            <div className="text-xs text-slate-400">
              {user?.title || "HR Manager"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}