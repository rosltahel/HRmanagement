import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, forgotPassword } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();

  const validateLogin = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required.";
    if (!password.trim()) newErrors.password = "Password is required.";
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const validationErrors = validateLogin();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSuccessMsg("");

    try {
      const res = await loginUser({ email, password });

      setSuccessMsg("Login successful! Redirecting...");

      const { role, name, access_token, user_id } = res.data;
      console.log("logged in role:", role);

      localStorage.setItem("token", access_token);
      localStorage.setItem("userName", name);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", user_id);

      setTimeout(() => {
        if (role === "ADMIN") {
          navigate("/admin");
        } else if (role === "HR") {
          navigate("/hr");
        } else {
          navigate(`/employee-profile/${name}`);
        }
      }, 800);
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        const fieldErrors = {};
        let generalError = "";

        detail.forEach((d) => {
          const field = d.loc[d.loc.length - 1];
          if (field === "body") generalError += `${d.msg}, `;
          else fieldErrors[field] = d.msg;
        });

        setErrors({
          ...fieldErrors,
          general: generalError ? generalError.slice(0, -2) : "Login failed",
        });
      } else {
        setErrors({ general: detail || "Login failed" });
      }
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    setErrors({});
    setSuccessMsg("");

    try {
      const res = await forgotPassword({ email });
      setSuccessMsg(res.data.message || "Check your email for reset link!");
    } catch (err) {
      setErrors({
        general: err.response?.data?.detail || "Failed to send reset email",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Skill<span className="text-indigo-400">Galaxy</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {forgotMode ? "Reset your password" : "Sign in to your account"}
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">
          {errors.general && (
            <p className="text-red-400 text-sm mb-2">{errors.general}</p>
          )}
          {successMsg && (
            <p className="text-green-400 text-sm mb-2">{successMsg}</p>
          )}

          {!forgotMode ? (
            <>
              <form onSubmit={handleLogin} noValidate>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-500 border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.email ? "border-red-500" : "border-slate-600"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-500 border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.password ? "border-red-500" : "border-slate-600"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 text-sm shadow-lg shadow-indigo-900/40"
                >
                  Sign In
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-400 text-center">
                New company?{" "}
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                  onClick={() => navigate("/request-access")}
                >
                  Request access
                </button>
              </p>
            </>
          ) : (
            <form onSubmit={handleForgot}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Enter your email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white placeholder-slate-500 border border-slate-600 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition duration-200 text-sm shadow-lg shadow-indigo-900/40"
              >
                Send Reset Link
              </button>

              <p className="mt-4 text-xs text-slate-400 text-center">
                Remember your password?{" "}
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition"
                  onClick={() => setForgotMode(false)}
                >
                  Go back
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}