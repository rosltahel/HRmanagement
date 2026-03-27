import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signup as signupApi } from '../services/authService';
import { toast } from 'react-toastify';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'hr', title: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await signupApi(form);
      login(data.access_token, data.user);
      if (data.user.role === 'hr') navigate('/hr');
      else navigate('/employee');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌌</div>
          <h1 className="text-4xl font-bold text-white">SkillGalaxy</h1>
          <p className="text-purple-300 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-200 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="John Doe"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-200 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="••••••••"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-200 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="hr" className="text-black">HR Manager</option>
              <option value="employee" className="text-black">Employee</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-1">Job Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="e.g. HR Director"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center mt-4 text-purple-300 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-200 hover:text-white underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
