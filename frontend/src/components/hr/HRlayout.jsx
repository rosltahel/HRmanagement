import { useNavigate, Outlet } from "react-router-dom";

export default function HRLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">

      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 p-6">
        <h1 className="text-2xl font-bold mb-8">
          Skill<span className="text-indigo-400">Galaxy</span>
        </h1>

        <nav className="space-y-4 text-sm">
          <p
            onClick={() => navigate("/hr")}
            className="hover:text-indigo-400 cursor-pointer"
          >
            Dashboard
          </p>

          <p className="hover:text-indigo-400 cursor-pointer">
            Employees
          </p>

          <p
            onClick={() => navigate("/hr/hierarchy")}
            className="hover:text-indigo-400 cursor-pointer"
          >
            Hierarchy
          </p>

          <p className="hover:text-indigo-400 cursor-pointer">
            Skills
          </p>

          <p className="hover:text-indigo-400 cursor-pointer">
            Reports
          </p>
        </nav>
      </div>

      {/* Page Content */}
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}