import { useEffect, useMemo, useState } from "react";
import {
  Star,
  Plus,
  BookOpen,
  Users,
  ChevronRight,
  X,
  CheckCircle2,
} from "lucide-react";
import HRNavbar from "./HRNavbar";
import api from "../../services/api";

export default function LearningPathsPage() {
  const [paths, setPaths] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [catalogSkills, setCatalogSkills] = useState([]);

  const [selectedPath, setSelectedPath] = useState(null);
  const [pathDetails, setPathDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creatingPath, setCreatingPath] = useState(false);

  const [skillSearch, setSkillSearch] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assigningPath, setAssigningPath] = useState(false);
  

  const [newSkillName, setNewSkillName] = useState("");
const [newSkillDescription, setNewSkillDescription] = useState("");
const [addingCustomSkill, setAddingCustomSkill] = useState(false);


  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [createSkillsInput, setCreateSkillsInput] = useState("");
  const [editTitle, setEditTitle] = useState("");
const [editDescription, setEditDescription] = useState("");
const [savingPath, setSavingPath] = useState(false);

const normalizedSearch = skillSearch.trim().toLowerCase();

const exactSkillExists = (catalogSkills || []).some(
  (skill) => skill.name.trim().toLowerCase() === normalizedSearch
);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pathsRes, employeesRes, catalogRes] = await Promise.all([
        api.get("/learning-paths").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/skills/catalog").catch(() => ({ data: [] })),
      ]);

      setPaths(pathsRes.data || []);
      setEmployees(employeesRes.data || []);
      setCatalogSkills(catalogRes.data || []);
    } catch (err) {
      console.error("Failed to load learning paths page", err);
      setFeedback({
        type: "error",
        message: "Could not load learning paths data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openPath = async (path) => {
  try {
    setSelectedPath(path);
    setDetailsLoading(true);
    setFeedback({ type: "", message: "" });
    setAssignEmployeeId("");

    const res = await api.get(`/learning-paths/${path.id}`);
    setPathDetails(res.data);
    setEditTitle(res.data.title || "");
    setEditDescription(res.data.description || "");
  } catch (err) {
    console.error("Failed to load learning path details", err);
    setPathDetails(null);
    setFeedback({
      type: "error",
      message: "Could not load learning path details.",
    });
  } finally {
    setDetailsLoading(false);
  }
};

  const handleCreatePath = async () => {
  if (!createTitle.trim()) {
    setFeedback({ type: "error", message: "Path title is required." });
    return;
  }

  try {
    setCreatingPath(true);
    setFeedback({ type: "", message: "" });

    const skillsList = createSkillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 1) create the path
    const pathRes = await api.post("/learning-paths", {
      title: createTitle.trim(),
      description: createDescription.trim() || null,
    });

    const pathId = pathRes.data?.id;

    if (!pathId) {
      throw new Error("Learning path was created but no path id was returned.");
    }

    // 2) refresh catalog first
    const catalogRes = await api.get("/skills/catalog");
    let currentCatalog = catalogRes.data || [];

    // 3) create missing skills + add all skills to path in order
    for (let i = 0; i < skillsList.length; i++) {
      const skillName = skillsList[i];

      let existingSkill = currentCatalog.find(
        (skill) => skill.name.toLowerCase() === skillName.toLowerCase()
      );

      if (!existingSkill) {
        const newSkillRes = await api.post("/skills", {
          name: skillName,
          description: null,
          skill_source: "company",
        });

        existingSkill = newSkillRes.data;
        currentCatalog = [...currentCatalog, existingSkill];
      }

      await api.post(`/learning-paths/${pathId}/skills`, {
        skill_id: existingSkill.id,
        sort_order: i + 1,
      });
    }

    setCreateTitle("");
    setCreateDescription("");
    setCreateSkillsInput("");
    setShowCreateModal(false);

    await fetchData();

    const createdPath = {
      id: pathId,
      title: createTitle.trim(),
      description: createDescription.trim() || null,
    };

    await openPath(createdPath);

    setFeedback({
      type: "success",
      message: "Learning path created successfully.",
    });
  } catch (err) {
    console.error("Failed to create learning path", err);
    setFeedback({
      type: "error",
      message:
        err.response?.data?.detail || "Failed to create learning path.",
    });
  } finally {
    setCreatingPath(false);
  }
};

  const handleAddSkillToPath = async (skillId) => {
    if (!selectedPath || !pathDetails) return;

    const existingSkills = pathDetails.skills || [];
    const nextOrder = existingSkills.length + 1;

    try {
      setFeedback({ type: "", message: "" });

      await api.post(`/learning-paths/${selectedPath.id}/skills`, {
        skill_id: skillId,
        sort_order: nextOrder,
      });

      const updated = await api.get(`/learning-paths/${selectedPath.id}`);
      setPathDetails(updated.data);

      await fetchData();

      setFeedback({
        type: "success",
        message: "Skill added to learning path.",
      });
    } catch (err) {
      console.error("Failed to add skill to learning path", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Failed to add skill.",
      });
    }
  };



  const handleCreateAndAddSkillToPath = async () => {
  await handleCreateAndAddSkillToPathWithName(newSkillName);
};

const handleQuickCreateFromSearch = async () => {
  const trimmed = skillSearch.trim();
  if (!trimmed) return;

  setNewSkillName(trimmed);
  await handleCreateAndAddSkillToPathWithName(trimmed);
};

const handleCreateAndAddSkillToPathWithName = async (skillName) => {
  if (!selectedPath || !pathDetails) return;

  const trimmedName = skillName.trim();
  const trimmedDescription = newSkillDescription.trim();

  if (!trimmedName) {
    setFeedback({
      type: "error",
      message: "Please enter a skill name.",
    });
    return;
  }

  try {
    setAddingCustomSkill(true);
    setFeedback({ type: "", message: "" });

    let currentCatalog = catalogSkills || [];

    let existingSkill = currentCatalog.find(
      (skill) => skill.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (!existingSkill) {
      const newSkillRes = await api.post("/skills", {
        name: trimmedName,
        description: trimmedDescription || null,
        skill_source: "company",
      });

      existingSkill = newSkillRes.data;
    }

    const usedSkillIds = new Set((pathDetails.skills || []).map((s) => s.skill_id));

    if (usedSkillIds.has(existingSkill.id)) {
      setFeedback({
        type: "error",
        message: "This skill is already in the learning path.",
      });
      return;
    }

    const nextOrder = (pathDetails.skills || []).length + 1;

    await api.post(`/learning-paths/${selectedPath.id}/skills`, {
      skill_id: existingSkill.id,
      sort_order: nextOrder,
    });

    const [updatedPathRes, catalogRes] = await Promise.all([
      api.get(`/learning-paths/${selectedPath.id}`),
      api.get("/skills/catalog"),
    ]);

    setPathDetails(updatedPathRes.data);
    setCatalogSkills(catalogRes.data || []);
    await fetchData();

    setNewSkillName("");
    setNewSkillDescription("");
    setSkillSearch("");

    setFeedback({
      type: "success",
      message: "Skill created and added to learning path successfully.",
    });
  } catch (err) {
    console.error("Failed to create and add skill", err);
    setFeedback({
      type: "error",
      message: err.response?.data?.detail || "Failed to create and add skill.",
    });
  } finally {
    setAddingCustomSkill(false);
  }
};

const handleUpdatePath = async () => {
  if (!selectedPath) return;

  try {
    setSavingPath(true);
    setFeedback({ type: "", message: "" });

    await api.put(`/learning-paths/${selectedPath.id}`, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
    });

    await fetchData();

    const updated = await api.get(`/learning-paths/${selectedPath.id}`);
    setPathDetails(updated.data);

    setFeedback({
      type: "success",
      message: "Learning path updated successfully.",
    });
  } catch (err) {
    console.error("Failed to update learning path", err);
    setFeedback({
      type: "error",
      message: err.response?.data?.detail || "Failed to update learning path.",
    });
  } finally {
    setSavingPath(false);
  }
};

const handleDeletePath = async () => {
  if (!selectedPath) return;

  const confirmed = window.confirm("Delete this learning path?");
  if (!confirmed) return;

  try {
    setFeedback({ type: "", message: "" });

    await api.delete(`/learning-paths/${selectedPath.id}`);

    setSelectedPath(null);
    setPathDetails(null);
    setEditTitle("");
    setEditDescription("");

    await fetchData();

    setFeedback({
      type: "success",
      message: "Learning path deleted successfully.",
    });
  } catch (err) {
    console.error("Failed to delete learning path", err);
    setFeedback({
      type: "error",
      message: err.response?.data?.detail || "Failed to delete learning path.",
    });
  }
};

const handleRemoveSkillFromPath = async (pathSkillId) => {
  if (!selectedPath) return;

  try {
    setFeedback({ type: "", message: "" });

    await api.delete(`/learning-paths/skills/${pathSkillId}`);

    const updated = await api.get(`/learning-paths/${selectedPath.id}`);
    setPathDetails(updated.data);
    await fetchData();

    setFeedback({
      type: "success",
      message: "Skill removed from learning path.",
    });
  } catch (err) {
    console.error("Failed to remove skill from learning path", err);
    setFeedback({
      type: "error",
      message: err.response?.data?.detail || "Failed to remove skill.",
    });
  }
};



  const handleAssignPath = async () => {
    if (!selectedPath || !assignEmployeeId) {
      setFeedback({
        type: "error",
        message: "Please select an employee to assign this path.",
      });
      return;
    }

    try {
      setAssigningPath(true);
      setFeedback({ type: "", message: "" });

      await api.post(`/learning-paths/${selectedPath.id}/assign`, {
        user_id: Number(assignEmployeeId),
      });

      await fetchData();

      setFeedback({
        type: "success",
        message: "Learning path assigned successfully and notification sent.",
      });

      setAssignEmployeeId("");
    } catch (err) {
      console.error("Failed to assign learning path", err);
      setFeedback({
        type: "error",
        message:
          err.response?.data?.detail || "Failed to assign learning path.",
      });
    } finally {
      setAssigningPath(false);
    }
  };

  const filteredSkills = useMemo(() => {
    const text = skillSearch.toLowerCase().trim();
    const usedSkillIds = new Set((pathDetails?.skills || []).map((s) => s.skill_id));

    return catalogSkills.filter((skill) => {
      const matches =
        skill.name?.toLowerCase().includes(text) ||
        skill.description?.toLowerCase().includes(text);

      return matches && !usedSkillIds.has(skill.id);
    });
  }, [catalogSkills, pathDetails, skillSearch]);

  const totalPaths = paths.length;
  const totalAssigned = paths.reduce((sum, path) => sum + (path.assigned_count || 0), 0);
  const totalSkillsAcrossPaths = paths.reduce(
    (sum, path) => sum + (path.skills_count || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <HRNavbar />

      <main className="flex-1 p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Learning Paths
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Create company learning journeys, organize skills in order, and
                assign them to employees when needed.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition"
            >
              <Plus size={18} />
              Create Learning Path
            </button>
          </div>
        </div>

        {feedback.message && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Paths</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              {totalPaths}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Skills Across Paths</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              {totalSkillsAcrossPaths}
            </h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Assignments</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">
              {totalAssigned}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Path Library
              </h2>
              <span className="text-xs text-slate-400">
                {paths.length} total
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-slate-500">Loading learning paths...</div>
            ) : paths.length === 0 ? (
              <div className="p-6 text-slate-500">
                No learning paths yet. Create your first one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {paths.map((path) => (
                  <button
                    key={path.id}
                    onClick={() => openPath(path)}
                    className={`text-left rounded-2xl border p-4 transition hover:shadow-md ${
                      selectedPath?.id === path.id
                        ? "border-purple-300 bg-purple-50"
                        : "border-slate-200 bg-white hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-400 flex-shrink-0"
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-slate-800">
                      {path.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500 min-h-[40px]">
                      {path.description || "No description yet."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {path.skills_count || 0} skills
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {path.assigned_count || 0} assigned
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>








          <div className="bg-white rounded-2xl border border-slate-200 p-5">
  {!selectedPath ? (
    <div className="text-slate-500">
      Select a learning path to manage its skills and assignments.
    </div>
  ) : detailsLoading ? (
    <div className="text-slate-500">Loading learning path...</div>
  ) : pathDetails ? (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
          <Star size={22} />
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-800">
            {pathDetails.title}
          </h3>
          <p className="text-sm text-slate-500">
            {pathDetails.description || "No description yet."}
          </p>
        </div>
      </div>

      {/* ADD IT HERE */}
      <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
        <h4 className="font-semibold text-slate-800">Edit path</h4>

        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Path title"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Path description"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <div className="flex gap-3">
          <button
            onClick={handleUpdatePath}
            disabled={savingPath}
            className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition disabled:opacity-60"
          >
            {savingPath ? "Saving..." : "Save Changes"}
          </button>

          <button
            onClick={handleDeletePath}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition"
          >
            Delete Path
          </button>
        </div>
      </div>

      <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
        <h4 className="font-semibold text-slate-800 mb-3">
          Assign this path
        </h4>

        <div className="flex flex-col gap-3">
          <select
            value={assignEmployeeId}
            onChange={(e) => setAssignEmployeeId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">Optional: select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.title ? `- ${emp.title}` : ""}
              </option>
            ))}
          </select>

          <button
            onClick={handleAssignPath}
            disabled={assigningPath || !assignEmployeeId}
            className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium transition"
          >
            <Users size={16} />
            {assigningPath ? "Assigning..." : "Assign to Employee"}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <h4 className="font-semibold text-slate-800 mb-3">
          Skills in this path
        </h4>

        {pathDetails.skills?.length ? (
          <div className="space-y-3">
            {pathDetails.skills.map((skill) => (
              <div
                key={skill.id}
                className="border border-slate-200 rounded-xl p-3 bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {skill.sort_order}. {skill.name}
                    </p>
                    {skill.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {skill.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveSkillFromPath(skill.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No skills added yet. Add skills below in learning order.
          </p>
        )}
      </div>

      <div className="border-t border-slate-200 pt-5">
  <h4 className="font-semibold text-slate-800 mb-3">
    Add skills to this path
  </h4>

  <input
  type="text"
  placeholder="Search company skills..."
  value={skillSearch}
  onChange={(e) => setSkillSearch(e.target.value)}
  className="w-full mb-4 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
/>

{skillSearch.trim() && !exactSkillExists && (
  <button
    onClick={handleQuickCreateFromSearch}
    disabled={addingCustomSkill}
    className="w-full mb-4 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium transition"
  >
    {addingCustomSkill ? "Creating skill..." : `+ Create "${skillSearch.trim()}" and add`}
  </button>
)}

  <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
    <h5 className="text-sm font-semibold text-slate-800 mb-3">
      Add a new skill to database + path
    </h5>

    <div className="space-y-3">
      <input
        type="text"
        value={newSkillName}
        onChange={(e) => setNewSkillName(e.target.value)}
        placeholder="New skill name"
        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
      />

      <textarea
        rows={2}
        value={newSkillDescription}
        onChange={(e) => setNewSkillDescription(e.target.value)}
        placeholder="Optional skill description"
        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
      />

      <button
        onClick={handleCreateAndAddSkillToPath}
        disabled={addingCustomSkill}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium transition"
      >
        <Plus size={16} />
        {addingCustomSkill ? "Adding..." : "Create Skill and Add"}
      </button>
    </div>
  </div>

  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
    {filteredSkills.length === 0 ? (
      <p className="text-sm text-slate-500">
        No more matching skills available.
      </p>
    ) : (
      filteredSkills.map((skill) => (
        <div
          key={skill.id}
          className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3"
        >
          <div>
            <p className="font-medium text-slate-800">{skill.name}</p>
            {skill.description && (
              <p className="text-sm text-slate-500 mt-1">
                {skill.description}
              </p>
            )}
          </div>

          <button
            onClick={() => handleAddSkillToPath(skill.id)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      ))
    )}
  </div>
</div>
    </div>
  ) : (
    <div className="text-red-500">
      Could not load the selected learning path.
    </div>
  )}
</div>
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">
                Create Learning Path
              </h3>

              <button
                onClick={() => setShowCreateModal(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Path Title
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Frontend Developer Path"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Describe this learning journey..."
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>
              <div className="mb-5">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Skills (comma-separated)
  </label>
  <textarea
    rows={3}
    value={createSkillsInput}
    onChange={(e) => setCreateSkillsInput(e.target.value)}
    placeholder="Python, FastAPI, JavaScript"
    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
  />
  <p className="text-xs text-slate-500 mt-2">
    Enter the skills in the order employees should learn them.
  </p>
</div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
  setShowCreateModal(false);
  setCreateTitle("");
  setCreateDescription("");
  setCreateSkillsInput("");
}}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreatePath}
                  disabled={creatingPath}
                  className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium transition"
                >
                  {creatingPath ? "Creating..." : "Create Path"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}