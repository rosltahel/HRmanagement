import React, { useState, useEffect, useCallback, useRef } from "react";
import HRNavbar from "./HRNavbar";
import api from "../../services/api";
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Upload,
  Loader,
  CheckCircle,
  X,
  Building2,
  Sparkles
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEPTH_STYLES = [
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-slate-100 text-slate-700 border-slate-200",
];

const LINE_COLORS = [
  "border-purple-200",
  "border-blue-200",
  "border-teal-200",
  "border-indigo-200",
  "border-slate-200",
];

function depthStyle(d) {
  return DEPTH_STYLES[Math.min(d, DEPTH_STYLES.length - 1)];
}

function lineColor(d) {
  return LINE_COLORS[Math.min(d, LINE_COLORS.length - 1)];
}

// function StarRating({ count }) {
//   return (
//     <span className="flex items-center gap-px">
//       {[1, 2, 3, 4, 5].map((i) => (
//         <span
//           key={i}
//           className={`text-sm leading-none ${
//             i <= count ? "text-yellow-400" : "text-slate-200"
//           }`}
//         >
//           ★
//         </span>
//       ))}
//     </span>
//   );
// }

function ActionBtn({ title, onClick, hoverBg, hoverText, icon }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-6 h-6 flex items-center justify-center rounded text-slate-400 transition-colors ${hoverBg} ${hoverText}`}
    >
      {icon}
    </button>
  );
}

// ─── Role Node ────────────────────────────────────────────────────────────────

function RoleNode({
  role,
  allRoles,
  depth,
  onEdit,
  onDelete,
  onAssign,
  onRemoveEmployee,
}) {
  const [expanded, setExpanded] = useState(true);

  const children = allRoles.filter((r) => r.parent_role_id === role.id);
  const employees = role.employees || [];
  const hasContent = children.length > 0 || employees.length > 0;

  return (
    <div>
      <div className="group flex items-center gap-1.5 rounded-lg px-1 py-1 hover:bg-slate-50 transition-colors">
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ${hasContent ? "" : "invisible pointer-events-none"
            }`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span
          className={`px-3 py-1 rounded-lg text-sm font-semibold border ${depthStyle(
            depth
          )} flex-shrink-0`}
        >
          {role.title}
        </span>

        <span className="text-xs text-slate-400 flex-1">
          {employees.length > 0 &&
            `${employees.length} member${employees.length !== 1 ? "s" : ""}`}
          {children.length > 0 && employees.length > 0 && " · "}
          {children.length > 0 &&
            `${children.length} sub-role${children.length !== 1 ? "s" : ""}`}
        </span>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBtn
            title="Add sub-role"
            onClick={() => onAssign("sub", role)}
            hoverBg="hover:bg-green-100"
            hoverText="hover:text-green-700"
            icon={<Plus size={13} />}
          />
          <ActionBtn
            title="Assign employee"
            onClick={() => onAssign("emp", role)}
            hoverBg="hover:bg-blue-100"
            hoverText="hover:text-blue-700"
            icon={<UserPlus size={13} />}
          />
          <ActionBtn
            title="Edit role"
            onClick={() => onEdit(role)}
            hoverBg="hover:bg-amber-100"
            hoverText="hover:text-amber-700"
            icon={<Pencil size={13} />}
          />
          <ActionBtn
            title="Delete role"
            onClick={() => onDelete(role)}
            hoverBg="hover:bg-red-100"
            hoverText="hover:text-red-500"
            icon={<Trash2 size={13} />}
          />
        </div>

      </div>

      {expanded && hasContent && (
        <div
          className={`ml-[13px] pl-4 border-l-2 ${lineColor(
            depth
          )} mt-0.5 space-y-0.5`}
        >
          {employees.map((emp) => (
            <div
              key={emp.assignment_id || emp.employee_id || emp.id}
              className="group/emp flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {emp.name?.[0]?.toUpperCase() || "E"}
              </div>

              <span className="text-sm text-slate-700 font-medium flex-1 min-w-0 truncate">
                {emp.name}
                {emp.is_active === false && (
                  <span className="ml-1.5 text-[10px] font-normal text-amber-500">
                    (pending)
                  </span>
                )}
              </span>

              {emp.title && (
                <span className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[120px]">
                  {emp.title}
                </span>
              )}

              <div className="text-right mr-1">
                <p className="text-sm text-slate-700 font-medium">
                  ⭐ {emp.completed_skills_count || 0}
                </p>
                <p className="text-[11px] text-slate-500">
                  {emp.in_progress_count || 0} in progress
                </p>
              </div>

              <button
                onClick={() =>
                  onRemoveEmployee(role.id, emp.assignment_id || emp.id)
                }
                title="Remove from role"
                className="w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover/emp:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          {children.map((child) => (
            <RoleNode
              key={child.id}
              role={child}
              allRoles={allRoles}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAssign={onAssign}
              onRemoveEmployee={onRemoveEmployee}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function RoleModal({ mode, role, allRoles, onClose, onSave }) {
  const [title, setTitle] = useState(role?.title || "");
  const [parentId, setParentId] = useState(role?.parent_role_id ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await onSave({
      title: title.trim(),
      parent_role_id: parentId === "" ? null : parseInt(parentId),
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={18} className="text-purple-500" />
            {mode === "create" ? "Create Role" : "Edit Role"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Role Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. VP Engineering"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Parent Role{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">— None (top-level) —</option>
              {allRoles
                .filter((r) => r.id !== role?.id)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? "Saving…" : mode === "create" ? "Create Role" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubRoleModal({ parentRole, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await onSave({ title: title.trim(), parent_role_id: parentRole.id });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Plus size={15} className="text-green-500" />
            Sub-role under{" "}
            <span className="text-purple-700 ml-1">"{parentRole.title}"</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Developer"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ role, employees, onClose, onAssign }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);


  const assignedIds = new Set((role.employees || []).map((e) => e.employee_id));
  const available = employees.filter(
    (e) =>
      !assignedIds.has(e.id) &&
      ((e.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.email || "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleAssign = async (empId) => {
    setLoading(true);
    await onAssign(role.id, empId);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-500" />
            Assign to <span className="text-purple-700 ml-1">"{role.title}"</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees…"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 mb-3"
        />

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {available.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">
              No available employees found.
            </p>
          ) : (
            available.map((emp) => (
              <button
                key={emp.id}
                disabled={loading}
                onClick={() => handleAssign(emp.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-200 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {emp.name?.[0]?.toUpperCase() || "E"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {emp.name || emp.email}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {emp.title || emp.email}
                  </div>
                </div>
                {emp.is_active === false && (
                  <span className="text-[10px] text-amber-500 border border-amber-200 rounded px-1">
                    pending
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}




function UploadHierarchyModal({ onClose, onSuccess }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef();

  const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

  const pickFile = (f) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type) && !f.name.endsWith('.pdf')) {
      toast.error('Please upload a PNG, JPG, WEBP, or PDF file');
      return;
    }
    setFile(f);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post('/hierarchy/roles/parse-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(res.data);
      setStatus('done');
      toast.success(`Created ${res.data.created} roles from your org chart!`);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Upload failed. Please try again.';
      setErrorMsg(detail);
      setStatus('error');
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} />
            <h2 className="font-bold text-base">AI Org Chart Builder</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {status !== 'done' && (
            <>
              <p className="text-sm text-slate-500 leading-relaxed">
                Upload a photo or screenshot of any org chart and AI will read it and automatically create all the roles in your hierarchy.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all
                  ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'}
                  ${file ? 'p-2' : 'p-8'}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
                  className="hidden"
                  onChange={e => pickFile(e.target.files[0])}
                />

                {file && preview ? (
                  <div className="relative">
                    <img src={preview} alt="org chart preview" className="w-full max-h-56 object-contain rounded-lg" />
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-white rounded-full shadow p-1 text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                    <div className="mt-2 text-xs text-center text-slate-500">{file.name}</div>
                  </div>
                ) : file ? (
                  <div className="flex items-center gap-3 px-3 py-4 justify-center">
                    <div className="text-3xl">📄</div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">{file.name}</div>
                      <div className="text-xs text-slate-400">PDF — click to change</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="ml-auto text-slate-400 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">Drop your org chart here</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP, or PDF · Click to browse</p>
                  </div>
                )}
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              {status === 'uploading' && (
                <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <Loader size={16} className="text-purple-500 animate-spin flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-purple-800">Reading your org chart…</div>
                    <div className="text-xs text-purple-500 mt-0.5">AI is analysing the image, this may take 10–20 seconds</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-50 font-medium">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || status === 'uploading'}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                    disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {status === 'uploading' ? (
                    <><Loader size={15} className="animate-spin" /> Analysing…</>
                  ) : (
                    <><Sparkles size={15} /> Build Hierarchy</>
                  )}
                </button>
              </div>
            </>
          )}

          {status === 'done' && result && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {result.created} role{result.created !== 1 ? 's' : ''} created!
              </h3>
              <p className="text-sm text-slate-500 mb-5">
                Your org chart hierarchy has been built. You can now assign employees to each role.
              </p>
              <div className="bg-slate-50 rounded-xl p-3 mb-5 text-left space-y-1 max-h-48 overflow-y-auto">
                {result.roles.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {r.title}
                  </div>
                ))}
              </div>
              <button
                onClick={handleDone}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                View Org Chart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



function DeleteConfirm({ role, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">
          Delete "{role.title}"?
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Child roles will be moved up. Employee assignments will be removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onConfirm(role.id);
            }}
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Hierarchy() {
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [rolesRes, usersRes] = await Promise.all([
        api.get("/hierarchy/roles"),
        api.get("/users"),
      ]);

      const users = usersRes.data || [];
      const roles = rolesRes.data || [];

      const usersMap = new Map(users.map((u) => [u.id, u]));

      const mergedRoles = roles.map((role) => ({
        ...role,
        employees: (role.employees || []).map((emp) => {
          const fullUser =
            usersMap.get(emp.employee_id) ||
            usersMap.get(emp.id);

          return {
            ...emp,
            completed_skills_count: fullUser?.completed_skills_count || 0,
            in_progress_count: fullUser?.in_progress_count || 0,
            department: fullUser?.department || emp.department,
            email: fullUser?.email || emp.email,
            is_active:
              fullUser?.is_active !== undefined ? fullUser.is_active : emp.is_active,
          };
        }),
      }));

      setRoles(mergedRoles);
      setEmployees(users);
    } catch (err) {
      console.error("Failed to load hierarchy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const roots = roles.filter((r) => r.parent_role_id === null);

  const handleCreateRole = async (data) => {
    try {
      await api.post("/hierarchy/roles", data);
      setCreateModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditRole = async (data) => {
    try {
      await api.put(`/hierarchy/roles/${editModal.id}`, data);
      setEditModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await api.delete(`/hierarchy/roles/${roleId}`);
      setDeleteModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setDeleteModal(null);
    }
  };

  const handleAssignEmployee = async (roleId, employeeId) => {
    try {
      await api.post(`/hierarchy/roles/${roleId}/assign`, {
        employee_id: employeeId,
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveEmployee = async (roleId, assignmentId) => {
    try {
      await api.delete(`/hierarchy/roles/${roleId}/assignments/${assignmentId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <HRNavbar />

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Organization Chart</h2>
              <p className="text-sm text-slate-500 mt-1">
                {roles.length} role{roles.length !== 1 ? "s" : ""} · Hover a role to see actions
              </p>
            </div>




            <button
              onClick={() => setUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
            >
              <Sparkles size={14} /> AI Import
            </button>







            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus size={15} /> New Role
            </button>
          </div>
        </header>

        <div className="p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-wrap items-center gap-3 mb-5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ChevronRight size={12} className="text-slate-400" />
                Click arrow to expand/collapse
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Plus size={12} className="text-green-500" />
                Add sub-role
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <UserPlus size={12} className="text-blue-500" />
                Assign employee
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Pencil size={12} className="text-amber-500" />
                Edit
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Trash2 size={12} className="text-red-400" />
                Delete
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-slate-400">
                  <div className="text-4xl mb-3 animate-pulse">🏢</div>
                  <p className="text-sm">Loading org chart…</p>
                </div>
              </div>
            ) : roots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                <Building2 size={36} className="mb-3 text-slate-300" />
                <p className="text-base font-medium text-slate-500">No roles defined yet</p>
                <p className="text-sm mt-1 mb-4 text-center">
                  Create roles manually or let AI read an org chart image for you
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <Sparkles size={14} /> AI Import
                  </button>

                  <button
                    onClick={() => setCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Create First Role
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-0.5 max-w-3xl">
                {roots.map((role) => (
                  <RoleNode
                    key={role.id}
                    role={role}
                    allRoles={roles}
                    depth={0}
                    onEdit={setEditModal}
                    onDelete={setDeleteModal}
                    onAssign={(type, r) => setAssignModal({ type, role: r })}
                    onRemoveEmployee={handleRemoveEmployee}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {createModal && (
        <RoleModal
          mode="create"
          role={null}
          allRoles={roles}
          onClose={() => setCreateModal(false)}
          onSave={handleCreateRole}
        />
      )}

      {editModal && (
        <RoleModal
          mode="edit"
          role={editModal}
          allRoles={roles}
          onClose={() => setEditModal(null)}
          onSave={handleEditRole}
        />
      )}

      {deleteModal && (
        <DeleteConfirm
          role={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDeleteRole}
        />
      )}

      {assignModal?.type === "emp" && (
        <AssignModal
          role={assignModal.role}
          employees={employees}
          onClose={() => setAssignModal(null)}
          onAssign={handleAssignEmployee}
        />
      )}

      {assignModal?.type === "sub" && (
        <SubRoleModal
          parentRole={assignModal.role}
          onClose={() => setAssignModal(null)}
          onSave={handleCreateRole}
        />
      )}

      {uploadModal && (
        <UploadHierarchyModal onClose={() => setUploadModal(false)} onSuccess={fetchData} />
      )}


    </div>
  );
}