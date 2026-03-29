
import { useEffect, useMemo, useState } from "react";
import HRNavbar from "./HRNavbar";
import { registerUser } from "../../services/authService";
import api from "../../services/api";
import {
  Sparkles,
  Bot,
  Send,
  Target,
  Award,
  Users,
  Brain,
  Lightbulb,
  Briefcase,
  Search,
} from "lucide-react";

export default function HRDashboard() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [addError, setAddError] = useState("");
  const [addMsg, setAddMsg] = useState("");

  const [companyGoal, setCompanyGoal] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [aiError, setAiError] = useState("");

  const [jobDescription, setJobDescription] = useState("");
  const [jobMatchLoading, setJobMatchLoading] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState(null);
  const [jobMatchError, setJobMatchError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const savedGoal = localStorage.getItem("company_goal");
    if (savedGoal) {
      setCompanyGoal(savedGoal);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);

        const [deptRes, roleRes, usersRes, achievementsRes] = await Promise.all([
          api.get("/departments"),
          api.get("/roles"),
          api.get("/users"),
          api.get("/users/achievements"),
        ]);

        setDepartments(deptRes.data || []);
        setRoles(roleRes.data || []);
        setEmployees(usersRes.data || []);
        setAchievements(achievementsRes.data || []);
      } catch (err) {
        console.error("Failed to load HR dashboard data", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredRoles = selectedDept
    ? roles.filter((role) => String(role.department_id) === String(selectedDept))
    : roles;

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((employee) => {
      const name = employee.name?.toLowerCase() || "";
      const email = employee.email?.toLowerCase() || "";
      const title = employee.title?.toLowerCase() || "";
      const department = employee.department?.toLowerCase() || "";

      return (
        name.includes(q) ||
        email.includes(q) ||
        title.includes(q) ||
        department.includes(q)
      );
    });
  }, [employees, search]);

  const stats = useMemo(() => {
    let totalEmployees = employees.length;
    let inProgress = 0;
    let completed = 0;
    let activeEmployees = 0;

    employees.forEach((employee) => {
      inProgress += employee.in_progress_count || 0;
      completed += employee.completed_skills_count || 0;
      if (employee.is_active) activeEmployees += 1;
    });

    return {
      totalEmployees,
      inProgress,
      completed,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
    };
  }, [employees]);

  const topPerformers = useMemo(() => {
    return [...achievements]
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 3);
  }, [achievements]);

  const employeesBehindSchedule = useMemo(() => {
    return achievements.filter((employee) => (employee.in_progress || 0) >= 3);
  }, [achievements]);

  const companySkillsCount = useMemo(() => {
    return achievements.reduce(
      (acc, employee) => acc + ((employee.completed_skills || []).length || 0),
      0
    );
  }, [achievements]);

  const welcomeMessage = useMemo(() => {
    if (stats.totalEmployees === 0) {
      return "Start by adding employees, defining clear company goals, and building a learning culture.";
    }

    if (employeesBehindSchedule.length > 0) {
      return `You currently have ${employeesBehindSchedule.length} employee${employeesBehindSchedule.length > 1 ? "s" : ""
        } who may need extra support in their learning journey.`;
    }

    return "Your team is moving well. Keep tracking progress, celebrating wins, and guiding development paths.";
  }, [stats.totalEmployees, employeesBehindSchedule.length]);

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setSelectedDept("");
    setSelectedRole("");
    setAddError("");
    setAddMsg("");
  };

  const handleCloseModal = () => {
    setShowAdd(false);
    resetForm();
  };

  const refreshDashboardLists = async () => {
    try {
      const [usersRes, achievementsRes] = await Promise.all([
        api.get("/users"),
        api.get("/users/achievements"),
      ]);

      setEmployees(usersRes.data || []);
      setAchievements(achievementsRes.data || []);
    } catch (err) {
      console.error("Failed to refresh dashboard lists", err);
    }
  };

  const fetchAiAdvice = async (goalText = companyGoal) => {
    try {
      setAiAdviceLoading(true);
      setAiError("");

      const res = await api.post("/ai/dashboard-advice", {
        company_goal: goalText || "",
      });

      setAiAdvice(res.data || null);

      const summary = res.data?.summary;
      if (summary) {
        setChatMessages([
          {
            id: 1,
            role: "assistant",
            text: `Hi HR Manager 👋 ${summary}`,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load AI dashboard advice", err);
      setAiError(err.response?.data?.detail || "Failed to generate AI advice.");
    } finally {
      setAiAdviceLoading(false);
    }
  };

  useEffect(() => {
    if (!dashboardLoading) {
      fetchAiAdvice(companyGoal);
    }
  }, [dashboardLoading]);

  const handleSaveGoal = async () => {
    if (!companyGoal.trim()) return;

    localStorage.setItem("company_goal", companyGoal.trim());
    setGoalSaved(true);

    await fetchAiAdvice(companyGoal.trim());

    setTimeout(() => {
      setGoalSaved(false);
    }, 2000);
  };

  const handleAddEmployee = async () => {
    setAddError("");
    setAddMsg("");

    if (!newName.trim() || !newEmail.trim() || !selectedRole) {
      setAddError("Name, email, and role are required");
      return;
    }

    try {
      await registerUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role_id: Number(selectedRole),
      });

      setAddMsg("Employee added and invite email sent!");
      await refreshDashboardLists();

      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setAddError(detail.map((d) => d.msg).join(", "));
      } else {
        setAddError(detail || "Failed to add employee");
      }
    }
  };

  const appendAssistantMessage = (text) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "assistant",
        text,
      },
    ]);
  };

  const handleQuickQuestion = async (question) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        text: question,
      },
    ]);

    try {
      setChatLoading(true);

      const res = await api.post("/ai/chat", {
        message: question,
        company_goal: companyGoal,
      });

      const data = res.data || {};

      let finalText = data.answer || "I could not generate a response.";

      if (data.recommended_employees?.length) {
        finalText += `\n\nRecommended employees:\n${data.recommended_employees
          .map((emp) => `• ${emp.employee_name}: ${emp.reason}`)
          .join("\n")}`;
      }

      if (data.recommended_skills?.length) {
        finalText += `\n\nRecommended skills: ${data.recommended_skills.join(", ")}`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: finalText,
        },
      ]);
    } catch (err) {
      console.error("AI quick question failed", err);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            err.response?.data?.detail ||
            "Something went wrong while asking the AI assistant.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: chatInput.trim(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentMessage = chatInput.trim();
    setChatInput("");

    try {
      setChatLoading(true);

      const res = await api.post("/ai/chat", {
        message: currentMessage,
        company_goal: companyGoal,
      });

      const data = res.data || {};

      let finalText = data.answer || "I could not generate a response.";

      if (data.recommended_employees?.length) {
        finalText += `\n\nRecommended employees:\n${data.recommended_employees
          .map((emp) => `• ${emp.employee_name}: ${emp.reason}`)
          .join("\n")}`;
      }

      if (data.recommended_skills?.length) {
        finalText += `\n\nRecommended skills: ${data.recommended_skills.join(", ")}`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: finalText,
        },
      ]);
    } catch (err) {
      console.error("AI chat failed", err);

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            err.response?.data?.detail ||
            "Something went wrong while talking to the AI assistant.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleJobMatch = async () => {
    if (!jobDescription.trim()) {
      setJobMatchError("Please paste a job description first.");
      return;
    }

    try {
      setJobMatchLoading(true);
      setJobMatchError("");
      setJobMatchResult(null);

      const res = await api.post("/ai/job-match", {
        job_description: jobDescription.trim(),
      });

      setJobMatchResult(res.data || null);
    } catch (err) {
      console.error("Failed to match job description", err);
      setJobMatchError(err.response?.data?.detail || "Failed to generate job match.");
    } finally {
      setJobMatchLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <HRNavbar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">
                Track your people, shape company growth, and guide learning progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 sm:w-72"
                />
              </div>

              <button
                onClick={() => setShowAdd(true)}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-500"
              >
                Add Employee
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-6 text-white shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-purple-200">People Growth Command Center</p>
                <h2 className="mt-2 text-3xl font-bold">
                  Build a stronger team with clear goals and visible progress
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-slate-200">
                  See how employees are growing, which skills are being completed,
                  and where HR should focus next.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:min-w-[320px]">
                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-purple-200">
                    Active Employees
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stats.activeEmployees}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-purple-200">
                    Inactive Employees
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stats.inactiveEmployees}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Employees</p>
                  <h3 className="mt-1 text-3xl font-bold text-slate-800">
                    {dashboardLoading ? "..." : stats.totalEmployees}
                  </h3>
                </div>
                <span className="text-3xl">👥</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Skills in Progress</p>
                  <h3 className="mt-1 text-3xl font-bold text-slate-800">
                    {dashboardLoading ? "..." : stats.inProgress}
                  </h3>
                </div>
                <span className="text-3xl">📚</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Completed Skills</p>
                  <h3 className="mt-1 text-3xl font-bold text-slate-800">
                    {dashboardLoading ? "..." : stats.completed}
                  </h3>
                </div>
                <span className="text-3xl">⭐</span>
              </div>
            </div>

            {/* <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Top Skills Earned</p>
                  <h3 className="mt-1 text-3xl font-bold text-slate-800">
                    {dashboardLoading ? "..." : companySkillsCount}
                  </h3>
                </div>
                <span className="text-3xl">🚀</span>
              </div>
            </div> */}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Target size={18} className="text-purple-600" />
                  Company Goal
                </h3>

                <button
                  onClick={handleSaveGoal}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500"
                >
                  Save Goal
                </button>
              </div>

              <textarea
                rows={4}
                value={companyGoal}
                onChange={(e) => setCompanyGoal(e.target.value)}
                placeholder="Write your company goal... for example: Improve employee skills by 40% this quarter and finish leadership training for all managers."
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />

              {goalSaved && (
                <p className="mt-2 text-sm text-green-600">
                  Goal saved successfully.
                </p>
              )}

              <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={16} className="text-purple-600" />
                  <p className="font-medium text-purple-800">AI Goal Guidance</p>
                </div>

                {aiAdviceLoading ? (
                  <p className="text-sm text-purple-700">Generating AI guidance...</p>
                ) : aiError ? (
                  <p className="text-sm text-red-600">{aiError}</p>
                ) : aiAdvice?.priority_skills?.length ? (
                  <div className="space-y-2">
                    <p className="text-sm text-purple-700">{aiAdvice.summary}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {aiAdvice.priority_skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-purple-700">
                    Save your goal and AI will suggest skills and guidance.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                Quick Insights
              </h3>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-medium text-slate-800">Today’s Summary</p>
                  <p className="mt-1 text-slate-500">{welcomeMessage}</p>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <p className="font-medium text-amber-800">
                    Employees needing attention
                  </p>
                  <p className="mt-1 text-amber-700">
                    {employeesBehindSchedule.length} employee
                    {employeesBehindSchedule.length === 1 ? "" : "s"} have 3 or more
                    skills in progress.
                  </p>
                </div>

                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <p className="font-medium text-green-800">Best momentum</p>
                  <p className="mt-1 text-green-700">
                    {topPerformers[0]
                      ? `${topPerformers[0].name} is leading with ${topPerformers[0].stars} completed skill${topPerformers[0].stars === 1 ? "" : "s"
                      }.`
                      : "No performance data yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Award size={18} className="text-yellow-500" />
                  Top Performers
                </h3>
                <span className="text-sm text-slate-500">Most completed skills</span>
              </div>

              <div className="space-y-3">
                {topPerformers.length === 0 ? (
                  <p className="text-sm text-slate-500">No performance data yet.</p>
                ) : (
                  topPerformers.map((employee, index) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700">
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-medium text-slate-800">{employee.name}</p>
                          <p className="text-sm text-slate-500">
                            {employee.title || "No role"} • {employee.department || "No department"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-800">
                          {employee.stars} ⭐
                        </p>
                        <p className="text-xs text-slate-500">
                          {employee.in_progress} in progress
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-indigo-500" />
                  Employees Preview
                </h3>
                <span className="text-sm text-slate-500">
                  {filteredEmployees.length} shown
                </span>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredEmployees.length === 0 ? (
                  <p className="text-sm text-slate-500">No matching employees found.</p>
                ) : (
                  filteredEmployees.slice(0, 6).map((employee) => (
                    <div
                      key={employee.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">{employee.name}</p>
                          <p className="text-sm text-slate-500">{employee.email}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {employee.title || "No role"} •{" "}
                            {employee.department || "No department"}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${employee.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-600"
                            }`}
                        >
                          {employee.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-4 text-xs text-slate-500">
                        <span>
                          Completed:{" "}
                          <strong className="text-slate-700">
                            {employee.completed_skills_count || 0}
                          </strong>
                        </span>
                        <span>
                          In Progress:{" "}
                          <strong className="text-slate-700">
                            {employee.in_progress_count || 0}
                          </strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-700">
                AI Job Description Matcher
              </h3>
            </div>

            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job description here and AI will find the best employee matches from your current team..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleJobMatch}
                disabled={jobMatchLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <Search size={16} />
                {jobMatchLoading ? "Matching..." : "Find Best Match"}
              </button>
            </div>

            {jobMatchError && (
              <p className="mt-3 text-sm text-red-600">{jobMatchError}</p>
            )}

            {jobMatchResult && (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="font-medium text-indigo-800">AI Job Summary</p>
                  <p className="mt-1 text-sm text-indigo-700">
                    {jobMatchResult.job_summary}
                  </p>
                </div>

                {jobMatchResult.top_matches?.length > 0 && (
                  <div className="space-y-3">
                    {jobMatchResult.top_matches.map((match, index) => (
                      <div
                        key={`${match.employee_name}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {match.employee_name}
                            </p>
                            <p className="text-sm text-slate-500">{match.role || "No role"}</p>
                          </div>

                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                            {match.score}/100
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-700">{match.reason}</p>

                        {match.missing_skills?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Missing skills
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {match.missing_skills.map((skill, skillIndex) => (
                                <span
                                  key={`${skill}-${skillIndex}`}
                                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {jobMatchResult.overall_skill_gaps?.length > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <p className="font-medium text-amber-800">Overall Team Skill Gaps</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {jobMatchResult.overall_skill_gaps.map((gap, index) => (
                        <span
                          key={`${gap}-${index}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="hidden w-96 border-l border-slate-200 bg-white p-6 xl:block">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700">AI HR Assistant</h3>
            <p className="text-xs text-slate-500">Smart guidance based on your dashboard</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            "Give me a dashboard summary",
            "Who is behind schedule?",
            "What skills support our goal?",
            "Who is the top performer?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-purple-100 hover:text-purple-700"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 h-[620px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                    }`}
                >
                  {msg.text}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-white border border-slate-200 text-slate-700">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChat();
              }}
              placeholder="Ask about employees, skills, or goals..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={handleSendChat}
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-white transition hover:bg-purple-500"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </aside>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Add New Employee
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in the employee details below.
                </p>
              </div>
            </div>

            {addError && (
              <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                {addError}
              </p>
            )}

            {addMsg && (
              <p className="mb-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
                {addMsg}
              </p>
            )}

            <input
              type="text"
              placeholder="Employee Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <input
              type="email"
              placeholder="Employee Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">Select Role</option>
              {filteredRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={handleAddEmployee}
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}