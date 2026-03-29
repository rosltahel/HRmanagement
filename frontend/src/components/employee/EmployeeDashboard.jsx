import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Star,
  Zap,
  BookOpen,
  Plus,
  X,
  ChevronRight,
  CheckCircle,
  Clock,
  Info,
  Sparkles,
  Search,
  Rocket,
  Bell,
} from "lucide-react";
import UniverseScene from "./UniverseScene";

const TAB = {
  MY_SKILLS: "my",
  LEARNING_PATHS: "paths",
  CATALOG: "catalog",
};

// const companyCatalogSeed = [
//   {
//     id: 1,
//     name: "Communication",
//     description: "Improve verbal and written communication at work.",
//     skill_source: "company",
//   },
//   {
//     id: 2,
//     name: "Leadership",
//     description: "Develop decision-making, teamwork, and mentoring skills.",
//     skill_source: "company",
//   },
//   {
//     id: 3,
//     name: "Time Management",
//     description: "Learn how to prioritize tasks and meet deadlines.",
//     skill_source: "company",
//   },
//   {
//     id: 4,
//     name: "Problem Solving",
//     description: "Strengthen analytical and critical thinking abilities.",
//     skill_source: "company",
//   },
//   {
//     id: 5,
//     name: "React",
//     description: "Build modern frontend interfaces with React.",
//     skill_source: "company",
//   },
// ];

// const initialEmployeeSkills = [
//   {
//     id: 101,
//     name: "Communication",
//     description: "Improve communication with teammates and managers.",
//     status: "learning",
//     progress: 45,
//     skill_source: "company",
//     deadline: "2026-04-10",
//     completion_note: "",
//   },
//   {
//     id: 102,
//     name: "React",
//     description: "Build modern UI features with reusable components.",
//     status: "learning",
//     progress: 70,
//     skill_source: "company",
//     deadline: "2026-04-25",
//     completion_note: "",
//   },
//   {
//     id: 103,
//     name: "Public Speaking",
//     description: "Become more confident in presentations.",
//     status: "completed",
//     progress: 100,
//     skill_source: "personal",
//     deadline: null,
//     completion_note: "I learned how to organize my thoughts and speak more confidently in front of people.",
//   },
// ];

function getStarColor(skill) {
  if (skill.skill_source === "company") return "#FFD700";
  const colors = ["#00E5FF", "#FF6EC7", "#39FF14", "#BF5FFF", "#FF4500", "#00FFCC"];
  return colors[skill.id % colors.length];
}

function StatusBadge({ status }) {
  if (status === "completed") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-semibold">
        ⭐ Mastered
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
      🪐 Learning
    </span>
  );
}

function SkillDetailModal({
  skill,
  onClose,
  onCompleteRequest,
  onDelete,
  onMarkLearning,
  onMarkCompleted,
}) {
  if (!skill) return null;

  const isCompleted = skill.status === "completed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">{skill.name}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {skill.skill_source === "company" ? "🏢 Company skill" : "🙋 Personal skill"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {skill.description && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm text-slate-300">{skill.description}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Status</span>
              <span>{isCompleted ? "Completed" : "Learning"}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${skill.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Progress: {Math.round(skill.progress || 0)}%
            </p>
          </div>

          {skill.completion_note && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-xs text-yellow-400 uppercase tracking-wide mb-1">
                Completion Note
              </p>
              <p className="text-sm text-yellow-100">{skill.completion_note}</p>
            </div>
          )}
        </div>

        <div className="p-5 pt-0 space-y-3">
          {!isCompleted ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onCompleteRequest(skill);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold transition"
              >
                Finish Learning With Note
              </button>

              <button
                onClick={() => onMarkCompleted(skill)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition"
              >
                Mark as Completed
              </button>
            </>
          ) : (
            <button
              onClick={() => onMarkLearning(skill)}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition"
            >
              Move Back to Learning
            </button>
          )}

          <button
            onClick={() => onDelete(skill.id)}
            className="w-full py-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 transition"
          >
            Delete Skill
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteModal({ skill, onClose, onConfirm }) {
  const [note, setNote] = useState("");

  if (!skill) return null;

  const handleSubmit = () => {
    if (!note.trim()) return;
    onConfirm(skill.id, note.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-lg">Turn into a Star ✨</h2>
            <p className="text-slate-400 text-sm mt-0.5">"{skill.name}"</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-slate-300 text-sm">
            Describe what you learned. This note will stay with your skill forever.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you learn from this skill?"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500 transition-colors"
            rows={4}
            autoFocus
          />
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Sparkles size={15} /> Create My Star
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSkillModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      description: description.trim(),
      skill_source: "personal",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-lg">Add a Personal Skill 🙋</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              This skill is not in the company system, but you want to learn it.
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Skill Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Machine Learning"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you planning to learn?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500 transition-colors"
              rows={3}
            />
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
            <p className="text-cyan-300 text-xs flex items-start gap-2">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              Personal skills become colorful stars, not gold stars.
            </p>
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Add to Universe
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(TAB.MY_SKILLS);
  const [panelOpen, setPanelOpen] = useState(true);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [completeSkill, setCompleteSkill] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedLearningPath, setSelectedLearningPath] = useState(null);


  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [learningPaths, setLearningPaths] = useState([]);
  const userName = localStorage.getItem("userName") || "Employee";
  const userId = localStorage.getItem("userId");

  const handleOpenLearningPath = (path) => { setSelectedLearningPath(path); };
  const handleBackToPaths = () => { setSelectedLearningPath(null); };
  const refreshDashboardData = async () => {
    const [skillsRes, catalogRes, learningPathsRes] = await Promise.all([
      api.get("/skills/my"),
      api.get("/skills/catalog"),
      api.get("/learning-paths/my").catch(() => ({ data: [] })),
    ]);

    setSkills(skillsRes.data || []);
    setCatalog(catalogRes.data || []);
    setLearningPaths(learningPathsRes.data || []);
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        await refreshDashboardData();
      } catch (err) {
        console.error("Failed to load employee dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const storedUserId = localStorage.getItem("userId");

      console.log("userId from localStorage:", storedUserId);

      if (!storedUserId || isNaN(Number(storedUserId))) {
        console.warn("Invalid or missing userId, skipping notifications fetch.");
        return;
      }

      try {
        setLoadingNotifications(true);
        const res = await api.get(`/notifications/my/${storedUserId}`);
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleSkillClick = (skill) => setSelectedSkill(skill);

  const handleCompleteWithNote = async (skillId, note) => {
    try {
      await api.put("/skills/complete-with-note", {
        skill_id: skillId,
        note,
      });

      await refreshDashboardData();
      setCompleteSkill(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLearnFromCatalog = async (catalogItem) => {
    const already = skills.find(
      (s) => s.name.toLowerCase() === catalogItem.name.toLowerCase()
    );

    if (already) return;

    try {
      await api.post("/skills/self-add", {
        skill_id: catalogItem.id,
      });

      const [skillsRes, catalogRes] = await Promise.all([
        api.get("/skills/my"),
        api.get("/skills/catalog"),
      ]);

      setSkills(skillsRes.data);
      setCatalog(catalogRes.data);
      setActiveTab(TAB.MY_SKILLS);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSkill = async (employeeSkillId, payload) => {
    try {
      await api.put(`/skills/${employeeSkillId}`, payload);
      await refreshDashboardData();
      setSelectedSkill(null);
    } catch (err) {
      console.error("Failed to update skill", err);
    }
  };

  const handleDeleteSkill = async (employeeSkillId) => {
    const confirmed = window.confirm("Are you sure you want to delete this skill?");
    if (!confirmed) return;

    try {
      await api.delete(`/skills/${employeeSkillId}`);
      await refreshDashboardData();
      setSelectedSkill(null);
    } catch (err) {
      console.error("Failed to delete skill", err);
    }
  };

  const handleMarkAsLearning = async (skill) => {
    await handleUpdateSkill(skill.id, {
      status: "learning",
      progress: 0,
      completion_note: null,
    });
  };

  const handleMarkAsCompleted = async (skill) => {
    await handleUpdateSkill(skill.id, {
      status: "completed",
      progress: 100,
    });
  };


  const handleStartLearningPath = async (path) => {
    try {
      const currentSkillIds = new Set(
        skills.map((s) => s.skill_id || s.id)
      );

      const missingSkills = (path.skills || []).filter(
        (skill) => !currentSkillIds.has(skill.id)
      );

      for (const skill of missingSkills) {
        await api.post("/skills/self-add", {
          skill_id: skill.id,
        });
      }

      const [skillsRes, catalogRes, learningPathsRes] = await Promise.all([
        api.get("/skills/my"),
        api.get("/skills/catalog"),
        api.get("/learning-paths/my"),
      ]);

      setSkills(skillsRes.data || []);
      setCatalog(catalogRes.data || []);
      setLearningPaths(learningPathsRes.data || []);

      setActiveTab(TAB.MY_SKILLS);
      setSelectedLearningPath(null);
    } catch (err) {
      console.error("Failed to start learning path", err);
    }
  };



  const handleAddPersonal = async (data) => {
    try {
      await api.post("/skills/self-add", {
        name: data.name,
        description: data.description,
        skill_source: "personal",
      });

      await refreshDashboardData();
      setShowAddModal(false);
      setActiveTab(TAB.MY_SKILLS);
    } catch (err) {
      console.error("Failed to add personal skill", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };


  const pathAlreadyStarted = (path) => {
    const currentSkillIds = new Set(skills.map((s) => s.skill_id || s.id));
    return (path.skills || []).every((skill) => currentSkillIds.has(skill.id));
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const stars = skills.filter((s) => s.status === "completed").length;
  const inProgress = skills.filter((s) => s.status !== "completed").length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const catalogFiltered = useMemo(() => {
    return catalog.filter((c) =>
      c.name.toLowerCase().includes(catalogSearch.toLowerCase())
    );
  }, [catalog, catalogSearch]);

  const mySkillNames = new Set(skills.map((s) => s.name.toLowerCase()));

  const tabs = [
    { id: TAB.MY_SKILLS, label: "My Skills", icon: <Zap size={14} />, count: skills.length },
    { id: TAB.LEARNING_PATHS, label: "Paths", icon: <BookOpen size={14} />, count: learningPaths.length, },
    { id: TAB.CATALOG, label: "Catalog", icon: <BookOpen size={14} />, count: catalog.length },
  ];

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌌</span>
          <span className="font-bold text-white hidden sm:block">SkillGalaxy</span>
          <span className="text-slate-500 text-sm hidden md:block">/ Employee Universe</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
              <Star size={12} className="text-yellow-400" />
              <span className="text-yellow-300 font-semibold">{stars}</span>
              <span className="text-yellow-600 text-xs hidden sm:block">stars</span>
            </div>

            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
              <Rocket size={12} className="text-purple-400" />
              <span className="text-purple-300 font-semibold">{inProgress}</span>
              <span className="text-purple-600 text-xs hidden sm:block">learning</span>
            </div>
          </div>

          <div className="relative">
            <button

              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Bell size={18} className="text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[360px] max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl z-50">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="font-semibold text-white">Notifications</h3>
                </div>

                {loadingNotifications ? (
                  <div className="p-4 text-sm text-slate-400">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 ${notification.is_read ? "bg-transparent" : "bg-purple-500/10"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                              {notification.sent_by
                                ? `From: ${notification.sent_by}`
                                : "From HR"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {notification.created_at
                                ? new Date(notification.created_at).toLocaleString()
                                : ""}
                            </p>
                          </div>

                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-purple-300 hover:text-white transition"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-xs font-bold">
              {userName?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden md:block">{userName}</span>
          </div>

          <button
            onClick={() => navigate("/employee/achievements")}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors"
          >
            Team Achievements
          </button>

          <button
            onClick={() => setPanelOpen((o) => !o)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300 transition-colors hidden sm:block"
          >
            {panelOpen ? "Hide Panel" : "Show Panel"}
          </button>

          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3 animate-spin">🌌</div>
                <p className="text-slate-400">Loading your universe...</p>
              </div>
            </div>
          ) : (
            <UniverseScene
              skills={skills}
              userName={userName?.split(" ")[0]}
              onSkillClick={handleSkillClick}
            />
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-xs text-slate-500 pointer-events-none">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              Drag to rotate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
              Scroll to zoom
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              Click to interact
            </span>
          </div>
        </div>

        <div
          className={`absolute top-0 right-0 h-full w-80 bg-slate-900/95 border-l border-white/10 flex flex-col z-10 transition-transform duration-300 ease-in-out shadow-2xl ${panelOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-shrink-0 p-4 border-b border-white/10">
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {tab.icon} {tab.label}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20" : "bg-white/10"
                        }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === TAB.MY_SKILLS && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-300">Your Skills</h3>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-lg transition-colors"
                    >
                      <Plus size={12} /> Add Personal
                    </button>
                  </div>

                  {skills.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <div className="text-3xl mb-2">🌱</div>
                      <p className="text-sm">No skills yet.</p>
                      <p className="text-xs mt-1">Browse the Catalog tab to start learning!</p>
                    </div>
                  ) : (
                    <>
                      {skills.filter((s) => s.status !== "completed").length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                            🪐 Learning
                          </p>
                          {skills
                            .filter((s) => s.status !== "completed")
                            .map((skill) => (
                              <div
                                key={skill.id}
                                onClick={() => setSelectedSkill(skill)}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors mb-2 border border-white/5"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium truncate">
                                    {skill.name}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {skill.skill_source === "company" ? "🏢" : "🙋"}{" "}
                                    {Math.round(skill.progress || 0)}% done
                                  </p>
                                </div>
                                <ChevronRight
                                  size={14}
                                  className="text-slate-600 flex-shrink-0 ml-2"
                                />
                              </div>
                            ))}
                        </div>
                      )}

                      {skills.filter((s) => s.status === "completed").length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                            ⭐ Mastered
                          </p>
                          {skills
                            .filter((s) => s.status === "completed")
                            .map((skill) => (
                              <div
                                key={skill.id}
                                onClick={() => setSelectedSkill(skill)}
                                className="flex items-center justify-between p-3 rounded-xl bg-yellow-500/5 hover:bg-yellow-500/10 cursor-pointer transition-colors mb-2 border border-yellow-500/10"
                              >
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm font-medium truncate"
                                    style={{ color: getStarColor(skill) }}
                                  >
                                    {skill.name}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {skill.skill_source === "company"
                                      ? "🏢 Golden star"
                                      : "🙋 Personal star"}
                                  </p>
                                </div>
                                <span className="text-lg ml-2">⭐</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}



              {activeTab === TAB.LEARNING_PATHS && (
                <div className="p-4 space-y-3">
                  {!selectedLearningPath ? (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">
                          Assigned Learning Paths
                        </h3>
                      </div>

                      {learningPaths.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                          <div className="text-3xl mb-2">🛤️</div>
                          <p className="text-sm">No learning paths assigned yet.</p>
                          <p className="text-xs mt-1">
                            When HR assigns a path, it will appear here.
                          </p>
                        </div>
                      ) : (
                        learningPaths.map((path) => {
                          const completedCount =
                            path.skills?.filter((skill) => skill.status === "completed").length || 0;

                          const alreadyStarted = pathAlreadyStarted(path);

                          return (
                            <div
                              key={path.id}
                              onClick={() => handleOpenLearningPath(path)}
                              className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-semibold">{path.title}</p>
                                  {path.description && (
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                      {path.description}
                                    </p>
                                  )}
                                </div>

                                <ChevronRight
                                  size={14}
                                  className="text-slate-500 flex-shrink-0 mt-0.5"
                                />
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-[11px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                                  {path.skills?.length || 0} skills
                                </span>
                                <span className="text-[11px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                                  {completedCount} completed
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartLearningPath(path);
                                }}
                                disabled={alreadyStarted}
                                className={`mt-3 w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${alreadyStarted
                                    ? "bg-green-500/10 text-green-400 cursor-not-allowed border border-green-500/20"
                                    : "bg-purple-600/80 hover:bg-purple-500 text-white"
                                  }`}
                              >
                                {alreadyStarted ? (
                                  <>
                                    <CheckCircle size={12} /> Already Learning
                                  </>
                                ) : (
                                  <>
                                    <Rocket size={12} /> Start Learning
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={handleBackToPaths}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        ← Back to Paths
                      </button>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-base text-white font-semibold">
                              {selectedLearningPath.title}
                            </p>
                            {selectedLearningPath.description && (
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {selectedLearningPath.description}
                              </p>
                            )}
                          </div>

                          <span className="text-[11px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 whitespace-nowrap">
                            {selectedLearningPath.skills?.length || 0} skills
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartLearningPath(selectedLearningPath)}
                        disabled={pathAlreadyStarted(selectedLearningPath)}
                        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${pathAlreadyStarted(selectedLearningPath)
                            ? "bg-green-500/10 text-green-400 cursor-not-allowed border border-green-500/20"
                            : "bg-purple-600 hover:bg-purple-500 text-white"
                          }`}
                      >
                        {pathAlreadyStarted(selectedLearningPath) ? (
                          <>
                            <CheckCircle size={14} /> Already Learning
                          </>
                        ) : (
                          <>
                            <Rocket size={14} /> Start Learning
                          </>
                        )}
                      </button>

                      {selectedLearningPath.skills?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedLearningPath.skills.map((skill) => (
                            <div
                              key={`${selectedLearningPath.id}-${skill.id}-${skill.sort_order}`}
                              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 border border-white/5"
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-white truncate">
                                  {skill.sort_order ? `${skill.sort_order}. ` : ""}
                                  {skill.name}
                                </p>
                                {skill.description && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                    {skill.description}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full ${skill.status === "completed"
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : "bg-purple-500/20 text-purple-300"
                                  }`}
                              >
                                {skill.status === "completed" ? "Done" : "Learning"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <p className="text-sm">No skills found in this path yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}





              {activeTab === TAB.CATALOG && (
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3">Company Skill Catalog</h3>
                    <div className="relative mb-3">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                      />
                      <input
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Search catalog..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  {catalogFiltered.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <div className="text-3xl mb-2">📚</div>
                      <p className="text-sm">
                        {catalog.length === 0 ? "No skills in catalog yet." : "No matches found."}
                      </p>
                    </div>
                  ) : (
                    catalogFiltered.map((item) => {
                      const alreadyLearning = mySkillNames.has(item.name.toLowerCase());

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors mb-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleLearnFromCatalog(item)}
                            disabled={alreadyLearning}
                            className={`mt-2 w-full py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${alreadyLearning
                                ? "bg-green-500/10 text-green-400 cursor-not-allowed border border-green-500/20"
                                : "bg-purple-600/80 hover:bg-purple-500 text-white"
                              }`}
                          >
                            {alreadyLearning ? (
                              <>
                                <CheckCircle size={12} /> Already Learning
                              </>
                            ) : (
                              <>
                                <Rocket size={12} /> Start Learning
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-yellow-500/10 rounded-xl py-2">
                  <div className="text-lg font-bold text-yellow-300">{stars}</div>
                  <div className="text-xs text-yellow-600">Stars</div>
                </div>
                <div className="bg-purple-500/10 rounded-xl py-2">
                  <div className="text-lg font-bold text-purple-300">{inProgress}</div>
                  <div className="text-xs text-purple-600">Orbiting</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl py-2">
                  <div className="text-lg font-bold text-blue-300">{skills.length}</div>
                  <div className="text-xs text-blue-600">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onCompleteRequest={(skill) => {
            setSelectedSkill(null);
            setCompleteSkill(skill);
          }}
          onDelete={handleDeleteSkill}
          onMarkLearning={handleMarkAsLearning}
          onMarkCompleted={handleMarkAsCompleted}
        />
      )}

      {completeSkill && (
        <CompleteModal
          skill={completeSkill}
          onClose={() => setCompleteSkill(null)}
          onConfirm={handleCompleteWithNote}
        />
      )}

      {showAddModal && (
        <AddSkillModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPersonal}
        />
      )}
    </div>
  );
}