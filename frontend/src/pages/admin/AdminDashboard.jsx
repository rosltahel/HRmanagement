import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
  Building2,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
  Mail,
  MapPin,
  CalendarDays,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

export default function AdminDashboard() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const navigate = useNavigate();

  const fetchCompanies = async (mode = filter) => {
    try {
      setLoading(true);
      setError("");

      const endpoint =
        mode === "pending" ? "/admin/companies/pending" : "/admin/companies/all";

      const res = await api.get(endpoint);
      setCompanies(res.data || []);
    } catch (err) {
      console.error("Failed to load companies", err);
      setError(err.response?.data?.detail || "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(filter);
  }, [filter]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((company) => {
      const companyName = company.company_name?.toLowerCase() || "";
      const companyEmail = company.company_email?.toLowerCase() || "";
      const hrName = company.hr_name?.toLowerCase() || "";
      const hrEmail = company.hr_email?.toLowerCase() || "";
      const location = company.company_location?.toLowerCase() || "";

      return (
        companyName.includes(q) ||
        companyEmail.includes(q) ||
        hrName.includes(q) ||
        hrEmail.includes(q) ||
        location.includes(q)
      );
    });
  }, [companies, search]);

  const stats = useMemo(() => {
    const pending = companies.filter((c) => c.status === "pending").length;
    const approved = companies.filter((c) => c.status === "approved").length;
    const rejected = companies.filter((c) => c.status === "rejected").length;

    return {
      total: companies.length,
      pending,
      approved,
      rejected,
    };
  }, [companies]);

  const approvedCompanies = useMemo(() => {
    return companies.filter((c) => c.status === "approved");
  }, [companies]);

  const recentApproved = useMemo(() => {
    return [...approvedCompanies]
      .sort((a, b) => {
        const aDate = new Date(a.approved_at || a.updated_at || a.created_at || 0).getTime();
        const bDate = new Date(b.approved_at || b.updated_at || b.created_at || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [approvedCompanies]);

  const handleApprove = async (companyId) => {
    try {
      setActionLoadingId(companyId);
      setMessage("");
      setError("");

      await api.patch(`/admin/companies/${companyId}/approve`);

      setMessage("Company approved successfully and HR email was sent.");
      await fetchCompanies(filter);
    } catch (err) {
      console.error("Failed to approve company", err);
      setError(err.response?.data?.detail || "Failed to approve company");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (companyId) => {
    try {
      setActionLoadingId(companyId);
      setMessage("");
      setError("");

      await api.patch(`/admin/companies/${companyId}/reject`);

      setMessage("Company rejected successfully.");
      await fetchCompanies(filter);
    } catch (err) {
      console.error("Failed to reject company", err);
      setError(err.response?.data?.detail || "Failed to reject company");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const getStatusClasses = (status) => {
    if (status === "approved") {
      return "bg-green-100 text-green-700 border-green-200";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-700 border-red-200";
    }
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  const formatDate = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review company registrations, approve access, and manage platform onboarding.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search companies or HR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-72"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">Pending Only</option>
              <option value="all">All Companies</option>
            </select>

            <button
              onClick={() => fetchCompanies(filter)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 p-6 text-white shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100">
                <Sparkles size={13} />
                Platform control center
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                Manage onboarding for every company using SkillGalaxy
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-200">
                Approve HR managers, monitor company start dates, and keep track of active platform customers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-indigo-100">Total</p>
                <p className="mt-2 text-2xl font-bold">{loading ? "..." : stats.total}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-indigo-100">Pending</p>
                <p className="mt-2 text-2xl font-bold">{loading ? "..." : stats.pending}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-indigo-100">Approved</p>
                <p className="mt-2 text-2xl font-bold">{loading ? "..." : stats.approved}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-indigo-100">Rejected</p>
                <p className="mt-2 text-2xl font-bold">{loading ? "..." : stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">Company Requests</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review companies, HR managers, requested start dates, and approval status.
              </p>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading companies...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No company requests found.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex flex-col gap-5 px-6 py-5 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Company
                        </p>
                        <div className="flex items-start gap-2">
                          <Building2 size={16} className="mt-1 text-indigo-500" />
                          <div>
                            <p className="font-semibold text-slate-800">{company.company_name}</p>
                            <p className="text-sm text-slate-500">{company.company_email}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          HR Manager
                        </p>
                        <div className="flex items-start gap-2">
                          <Mail size={16} className="mt-1 text-purple-500" />
                          <div>
                            <p className="font-semibold text-slate-800">{company.hr_name || "N/A"}</p>
                            <p className="text-sm text-slate-500">{company.hr_email || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Location & Start
                        </p>
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-sm text-slate-700">
                            <MapPin size={14} className="text-slate-400" />
                            {company.company_location || "No location"}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays size={14} className="text-slate-400" />
                            Start: {formatDate(company.start_date)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Approval
                        </p>
                        <div className="space-y-1">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              company.status
                            )}`}
                          >
                            {company.status}
                          </span>
                          <p className="text-sm text-slate-500">
                            Approved: {formatDate(company.approved_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        onClick={() => handleApprove(company.id)}
                        disabled={company.status === "approved" || actionLoadingId === company.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        {actionLoadingId === company.id ? "Working..." : "Approve"}
                      </button>

                      <button
                        onClick={() => handleReject(company.id)}
                        disabled={company.status === "rejected" || actionLoadingId === company.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        {actionLoadingId === company.id ? "Working..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">Platform Snapshot</h3>

              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Clock3 size={15} className="text-amber-500" />
                    Pending approvals
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {stats.pending} compan{stats.pending === 1 ? "y is" : "ies are"} waiting for your decision.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <CheckCircle2 size={15} className="text-green-500" />
                    Approved companies
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {stats.approved} compan{stats.approved === 1 ? "y has" : "ies have"} been approved to use the platform.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <XCircle size={15} className="text-red-500" />
                    Rejected requests
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {stats.rejected} compan{stats.rejected === 1 ? "y was" : "ies were"} rejected.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">Recently Approved</h3>

              {recentApproved.length === 0 ? (
                <p className="text-sm text-slate-500">No approved companies yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentApproved.map((company) => (
                    <div
                      key={company.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <p className="font-semibold text-slate-800">{company.company_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{company.hr_email || "No HR email"}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-500">
                          Approved: {formatDate(company.approved_at)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Start date: {formatDate(company.start_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}