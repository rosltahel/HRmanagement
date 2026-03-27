import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { setPassword } from "../services/authService";
export default function SetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

const token = searchParams.get("token"); // grab token

  const email = searchParams.get("email"); // ✅ not token

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await setPassword({
  email,
  token,         // send the token
  password: newPassword,
});

    setMessage(res.data.message);

    setTimeout(() => navigate("/"), 2000);
  } catch (err) {
    setError(err.response?.data?.detail || "Something went wrong");
  }
};

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Set Your Password</h1>

        {message && <p className="text-green-400 mb-4">{message}</p>}
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white mb-4 border border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl"
          >
            Set Password
          </button>
        </form>
      </div>
    </div>
  );
}