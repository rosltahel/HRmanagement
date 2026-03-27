import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Star,
  Rocket,
  Trophy,
  Users,
  X,
} from "lucide-react";
import api from "../../services/api";

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-indigo-700",
  "from-teal-500 to-cyan-700",
  "from-rose-500 to-pink-700",
  "from-amber-500 to-orange-700",
  "from-emerald-500 to-green-700",
  "from-sky-500 to-blue-700",
  "from-fuchsia-500 to-purple-700",
];

function getGradient(id) {
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}

function getPersonalStarColor(name) {
  const colors = ["#00E5FF", "#FF6EC7", "#39FF14", "#BF5FFF", "#FF8C00", "#00FFCC"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function SkillBadge({ skill }) {
  const [showNote, setShowNote] = useState(false);
  const isCompany = skill.skill_source === "company";
  const color = isCompany ? "#FFD700" : getPersonalStarColor(skill.name);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNote((s) => !s)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
        style={{
          background: `${color}18`,
          border: `1px solid ${color}50`,
          color,
        }}
      >
        <span>{isCompany ? "⭐" : "✦"}</span>
        <span className="max-w-[90px] truncate">{skill.name}</span>
      </button>

      {showNote && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-60 bg-slate-800 border border-white/10 rounded-xl p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color }}>
              What they learned
            </span>
            <button onClick={() => setShowNote(false)}>
              <X size={10} className="text-slate-400" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {skill.completion_note || "No note added yet."}
          </p>
        </div>
      )}
    </div>
  );
}

function EmployeeCard({ employee }) {
  const gradient = getGradient(employee.id);
  const initials = (employee.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasSkills = employee.completed_skills?.length > 0;

  return (
    <div className="group relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-purple-900/20 hover:-translate-y-0.5">
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg`}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-tight truncate">
            {employee.name}
          </h3>

          <div className="flex flex-wrap gap-2 mt-1">
            {employee.title && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300">
                {employee.title}
              </span>
            )}

            {employee.department && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-300">
                {employee.department}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 py-3 border-y border-white/5">
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-yellow-400" />
          <span className="text-yellow-300 font-bold text-lg">{employee.stars}</span>
          <span className="text-slate-500 text-xs">stars</span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-1.5">
          <Rocket size={13} className="text-purple-400" />
          <span className="text-purple-300 font-semibold">{employee.in_progress}</span>
          <span className="text-slate-500 text-xs">learning</span>
        </div>

        {employee.stars === 0 && employee.in_progress === 0 && (
          <span className="text-slate-600 text-xs ml-auto">Just starting 🌱</span>
        )}

        {employee.stars >= 5 && (
          <span className="ml-auto text-xs text-yellow-400 flex items-center gap-1">
            <Trophy size={11} /> Top achiever
          </span>
        )}
      </div>

      {hasSkills ? (
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
            Mastered Skills
          </p>

          <div className="flex flex-wrap gap-1.5">
            {employee.completed_skills.map((skill, i) => (
              <SkillBadge key={i} skill={skill} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-slate-600 text-xs">No completed skills yet</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${color}`}>
      <Icon size={18} className="flex-shrink-0" />
      <div>
        <div className="text-xl font-bold text-white leading-none">{value}</div>
        <div className="text-xs opacity-70 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function TeamAchievements() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/users/achievements")
      .then((res) => setEmployees(res.data))
      .catch((err) => {
        console.error("Failed to load achievements", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;

    return employees.filter((emp) =>
      (emp.name || "").toLowerCase().includes(q) ||
      (emp.title || "").toLowerCase().includes(q) ||
      (emp.department || "").toLowerCase().includes(q)
    );
  }, [search, employees]);

  const totalStars = employees.reduce((a, e) => a + (e.stars || 0), 0);
  const totalLearning = employees.reduce((a, e) => a + (e.in_progress || 0), 0);
  const topAchiever = employees.reduce(
    (best, e) => (!best || e.stars > best.stars ? e : best),
    null
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/employee-dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">My Universe</span>
          </button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h1 className="text-lg font-bold text-white">Team Achievements</h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Users size={13} />
            <span>{employees.length} members</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white mb-2">
            Galaxy of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Champions
            </span>
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Explore what other employees have mastered and what they learned.
          </p>
        </div>

        {!loading && employees.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <StatCard
              icon={Star}
              label="Stars earned"
              value={totalStars}
              color="bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            />
            <StatCard
              icon={Rocket}
              label="Skills in progress"
              value={totalLearning}
              color="bg-purple-500/10 border-purple-500/20 text-purple-400"
            />
            <StatCard
              icon={Users}
              label="Team members"
              value={employees.length}
              color="bg-blue-500/10 border-blue-500/20 text-blue-400"
            />
            {topAchiever && topAchiever.stars > 0 && (
              <StatCard
                icon={Trophy}
                label={`Top: ${topAchiever.name.split(" ")[0]}`}
                value={`${topAchiever.stars}⭐`}
                color="bg-amber-500/10 border-amber-500/20 text-amber-400"
              />
            )}
          </div>
        )}

        <div className="relative mb-8 max-w-xl mx-auto">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, role, or department..."
            autoFocus
            className="w-full bg-white/5 border border-white/15 hover:border-white/25 focus:border-purple-500 rounded-2xl pl-11 pr-10 py-3.5 text-white placeholder-slate-500 focus:outline-none transition-all text-sm shadow-lg"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {search && (
          <p className="text-center text-slate-500 text-sm mb-6">
            {filtered.length === 0
              ? `No results for "${search}"`
              : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"`}
          </p>
        )}

        {loading ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4 animate-spin inline-block">🌌</div>
            <p className="text-slate-400">Loading team achievements...</p>
          </div>
        ) : filtered.length === 0 && !search ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🌱</div>
            <p className="text-slate-400 text-lg font-semibold">No team members yet</p>
            <p className="text-slate-600 text-sm mt-1">
              Ask your HR to add employees to the platform.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔭</div>
            <p className="text-slate-400 text-lg font-semibold">Nothing found</p>
            <p className="text-slate-600 text-sm mt-1">
              Try a different employee name, role, or department.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-slate-600 text-xs flex items-center justify-center gap-1.5">
              <span className="text-yellow-500">⭐</span> Gold = company skill
              <span className="mx-2 text-white/20">|</span>
              <span style={{ color: "#00E5FF" }}>✦</span> Colored = personal skill
              <span className="mx-2 text-white/20">|</span>
              Click a badge to read the learning note
            </p>
          </div>
        )}
      </div>
    </div>
  );
}