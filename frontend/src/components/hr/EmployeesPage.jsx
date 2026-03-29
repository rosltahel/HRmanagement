import { useEffect, useMemo, useState } from "react";
import HRNavbar from "./HRNavbar";
import api from "../../services/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState("");
  const [notificationError, setNotificationError] = useState("");

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeActionMessage, setEmployeeActionMessage] = useState("");
  const [employeeActionError, setEmployeeActionError] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      const [departmentsRes, rolesRes] = await Promise.all([
        api.get("/departments"),
        api.get("/roles"),
      ]);

      setDepartments(departmentsRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      console.error("Failed to load departments/roles", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const text = search.toLowerCase().trim();

    if (!text) return employees;

    return employees.filter((emp) => {
      const name = emp.name?.toLowerCase() || "";
      const email = emp.email?.toLowerCase() || "";
      const department = (emp.department || "No department").toLowerCase();
      const title = (emp.title || "No role").toLowerCase();
      const status = emp.is_active ? "active" : "inactive";

      return (
        name.includes(text) ||
        email.includes(text) ||
        department.includes(text) ||
        title.includes(text) ||
        status.includes(text)
      );
    });
  }, [employees, search]);



  const refreshSelectedEmployee = async (userId) => {
    const res = await api.get(`/users/${userId}`);
    setEmployeeDetails(res.data);

    setEditName(res.data.name || "");
    setEditEmail(res.data.email || "");
    setEditDepartmentId(res.data.department_id || "");
    setEditRoleId(res.data.role_id || "");
  };

  const handleSelectEmployee = async (employee) => {
    setSelectedEmployee(employee);
    setDetailsLoading(true);
    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationSuccess("");
    setNotificationError("");
    setEmployeeActionMessage("");
    setEmployeeActionError("");

    try {
      await refreshSelectedEmployee(employee.id);
    } catch (err) {
      console.error("Failed to load employee details", err);
      setEmployeeDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };







  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setSavingEmployee(true);
      setEmployeeActionError("");
      setEmployeeActionMessage("");

      await api.put(`/users/${selectedEmployee.id}`, {
        name: editName.trim(),
        email: editEmail.trim(),
        department_id: editDepartmentId ? Number(editDepartmentId) : null,
        role_id: editRoleId ? Number(editRoleId) : null,
        is_active: employeeDetails?.is_active,
      });

      await fetchEmployees();
      await refreshSelectedEmployee(selectedEmployee.id);

      setEmployeeActionMessage("Employee updated successfully.");
    } catch (err) {
      console.error("Failed to update employee", err);
      setEmployeeActionError(
        err.response?.data?.detail || "Failed to update employee."
      );
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleToggleEmployeeStatus = async () => {
    if (!selectedEmployee || !employeeDetails) return;

    try {
      setEmployeeActionError("");
      setEmployeeActionMessage("");

      await api.patch(`/users/${selectedEmployee.id}/status`, {
        is_active: !employeeDetails.is_active,
      });

      await fetchEmployees();
      await refreshSelectedEmployee(selectedEmployee.id);

      setEmployeeActionMessage(
        !employeeDetails.is_active
          ? "Employee activated successfully."
          : "Employee deactivated successfully."
      );
    } catch (err) {
      console.error("Failed to update employee status", err);
      setEmployeeActionError(
        err.response?.data?.detail || "Failed to update employee status."
      );
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedEmployee.name}?`
    );
    if (!confirmed) return;

    try {
      setEmployeeActionError("");
      setEmployeeActionMessage("");

      await api.delete(`/users/${selectedEmployee.id}`);
      await fetchEmployees();

      setSelectedEmployee(null);
      setEmployeeDetails(null);
      setEditName("");
      setEditEmail("");
      setEditDepartmentId("");
      setEditRoleId("");

      setEmployeeActionMessage("Employee deleted successfully.");
    } catch (err) {
      console.error("Failed to delete employee", err);
      setEmployeeActionError(
        err.response?.data?.detail || "Failed to delete employee."
      );
    }
  };


  const handleSendNotification = async () => {
    if (!selectedEmployee) return;

    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      setNotificationError("Please enter both a title and a message.");
      setNotificationSuccess("");
      return;
    }

    try {
      setSendingNotification(true);
      setNotificationError("");
      setNotificationSuccess("");

      await api.post("/notifications", {
        user_id: selectedEmployee.id,
        title: notificationTitle.trim(),
        message: notificationMessage.trim(),
        sent_by: localStorage.getItem("userName") || "HR Manager",
      });

      setNotificationSuccess("Notification sent successfully.");
      setNotificationTitle("");
      setNotificationMessage("");
    } catch (err) {
      console.error("Failed to send notification", err);
      setNotificationError(
        err.response?.data?.detail || "Failed to send notification."
      );
      setNotificationSuccess("");
    } finally {
      setSendingNotification(false);
    }
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.is_active).length;
  const totalCompleted = employees.reduce(
    (sum, e) => sum + (e.completed_skills_count || 0),
    0
  );
  const totalInProgress = employees.reduce(
    (sum, e) => sum + (e.in_progress_count || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <HRNavbar />

      <main className="flex-1 p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
              <p className="text-sm text-slate-500 mt-1">
                View your team members and explore their learning progress.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Employees</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalEmployees}</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Active Employees</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{activeEmployees}</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Completed Skills</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalCompleted}</h3>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Skills In Progress</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalInProgress}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.8fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">Employee Directory</h2>
            </div>

            {loading ? (
              <div className="p-6 text-slate-500">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-6 text-slate-500">No employees found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition ${selectedEmployee?.id === emp.id ? "bg-purple-50" : ""
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800">{emp.name}</h3>
                        <p className="text-sm text-slate-500">{emp.email}</p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {emp.title || "No role"}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {emp.department || "No department"}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${emp.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                              }`}
                          >
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-700 font-medium">
                          ⭐ {emp.completed_skills_count || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {emp.in_progress_count || 0} in progress
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            {!selectedEmployee ? (
              <div className="text-slate-500">
                Select an employee to view more details.
              </div>
            ) : detailsLoading ? (
              <div className="text-slate-500">Loading details...</div>
            ) : employeeDetails ? (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg">
                    {employeeDetails.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {employeeDetails.name}
                    </h3>
                    <p className="text-sm text-slate-500">{employeeDetails.email}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Role</span>
                    <span className="text-slate-800 font-medium">
                      {employeeDetails.title || "Not assigned"}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Department</span>
                    <span className="text-slate-800 font-medium">
                      {employeeDetails.department || "Not assigned"}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className="text-slate-800 font-medium">
                      {employeeDetails.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Profile Created</span>
                    <span className="text-slate-800 font-medium">
                      {employeeDetails.created_at
                        ? new Date(employeeDetails.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>




                <div className="mb-6 border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <h4 className="font-semibold text-slate-800">Edit Employee</h4>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Employee name"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />

                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Employee email"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />

                  <select
                    value={editDepartmentId}
                    onChange={(e) => setEditDepartmentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Select department</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title}
                      </option>
                    ))}
                  </select>

                  {employeeActionMessage && (
                    <div className="text-sm text-green-600">{employeeActionMessage}</div>
                  )}

                  {employeeActionError && (
                    <div className="text-sm text-red-600">{employeeActionError}</div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleUpdateEmployee}
                      disabled={savingEmployee}
                      className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium transition"
                    >
                      {savingEmployee ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      onClick={handleToggleEmployeeStatus}
                      className={`px-4 py-2.5 rounded-lg text-white font-medium transition ${employeeDetails.is_active
                          ? "bg-amber-600 hover:bg-amber-500"
                          : "bg-green-600 hover:bg-green-500"
                        }`}
                    >
                      {employeeDetails.is_active ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={handleDeleteEmployee}
                      className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition"
                    >
                      Delete Employee
                    </button>
                  </div>
                </div>





                <div className="mb-6">
                  <h4 className="font-semibold text-slate-800 mb-3">Skills</h4>

                  {employeeDetails.skills?.length ? (
                    <div className="space-y-2">
                      {employeeDetails.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="border border-slate-200 rounded-xl p-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800">{skill.name}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${skill.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                              {skill.status}
                            </span>
                          </div>

                          {skill.skill_source && (
                            <p className="text-xs text-slate-500 mt-1">
                              Source: {skill.skill_source}
                            </p>
                          )}

                          {skill.completion_note && (
                            <p className="text-sm text-slate-600 mt-2">
                              {skill.completion_note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No skills assigned yet.</p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Send Notification
                  </h4>

                  <input
                    type="text"
                    placeholder="Notification title"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    className="w-full mb-3 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />

                  <textarea
                    rows={4}
                    placeholder="Write a message for this employee..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    className="w-full mb-3 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />

                  {notificationSuccess && (
                    <div className="mb-3 text-sm text-green-600">
                      {notificationSuccess}
                    </div>
                  )}

                  {notificationError && (
                    <div className="mb-3 text-sm text-red-600">
                      {notificationError}
                    </div>
                  )}

                  <button
                    onClick={handleSendNotification}
                    disabled={sendingNotification}
                    className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-medium transition"
                  >
                    {sendingNotification ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-red-500">Could not load employee details.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}