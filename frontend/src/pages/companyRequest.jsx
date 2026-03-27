import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CompanyRequest() {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [hrName, setHrName] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (
      !companyName.trim() ||
      !companyEmail.trim() ||
      !companyLocation.trim() ||
      !hrName.trim() ||
      !hrEmail.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/companies/request", {
        company_name: companyName.trim(),
        company_email: companyEmail.trim(),
        company_location: companyLocation.trim(),
        start_date: startDate || null,
        hr_name: hrName.trim(),
        hr_email: hrEmail.trim(),
      });

      setSuccessMsg(
        res.data.message ||
          "Company request submitted successfully. Please wait for admin approval."
      );

      setCompanyName("");
      setCompanyEmail("");
      setCompanyLocation("");
      setStartDate("");
      setHrName("");
      setHrEmail("");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(", "));
      } else {
        setError(detail || "Failed to submit company request.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Join <span className="text-indigo-400">SkillGalaxy</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Request access for your company and start building a smarter learning culture.
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          {successMsg && <p className="text-green-400 text-sm mb-4">{successMsg}</p>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="email"
              placeholder="Company Email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="Company Location"
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="text"
              placeholder="HR Manager Name"
              value={hrName}
              onChange={(e) => setHrName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="email"
              placeholder="HR Manager Email"
              value={hrEmail}
              onChange={(e) => setHrEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white border border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="md:col-span-2 flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-1/3 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition duration-200 text-sm"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl transition duration-200 text-sm shadow-lg shadow-indigo-900/40"
              >
                {loading ? "Submitting..." : "Request Access"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}