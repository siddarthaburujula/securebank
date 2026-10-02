import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProblemStatementModal } from '../components/ProblemStatementModal';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  KeyRound,
  Building,
  PhoneCall,
  Check,
  Mail,
  ShieldAlert,
  ExternalLink,
  Info
} from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProblemModal, setShowProblemModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      setError('Please enter both Customer ID / Username and Password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userData = await login(username, password);
      if (userData.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Invalid Customer ID or Password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col font-sans">
      
      {/* 1. Official Bank Header */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#004c8f] rounded flex items-center justify-center relative">
              <div className="w-4.5 h-4.5 bg-[#ed1c24] rounded-xs flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-xs"></div>
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-[#002e6e] font-heading">
                Secure<span className="text-[#ed1c24]">Bank</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">NetBanking Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <button
              onClick={() => setShowProblemModal(true)}
              className="hidden md:flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-300 font-bold transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>🛡️ Problem Statement & Architecture</span>
            </button>

            <a
              href="/mail"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#004c8f] px-3 py-1.5 rounded-lg border border-blue-200 font-bold transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>✉️ SecureMail Webmail (Live OTPs)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Login Area (Two-Column HDFC Style) */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col md:flex-row gap-8 items-center justify-center">
        
        {/* Left Side: Trust & Credentials Directory (No Auto-Fill) */}
        <div className="w-full md:w-1/2 space-y-5">
          <div>
            <span className="text-xs uppercase font-extrabold px-2.5 py-1 rounded bg-blue-100 text-[#004c8f] tracking-wider">
              Online Banking Login
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Welcome to SecureBank NetBanking
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Experience atomic fund transfers with instant double-entry ledger bookkeeping, 24x7 settlements, and dormant account scam protection.
            </p>
          </div>

          {/* Authorized Credentials Reference Directory (Manual Typing Required) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Authorized Credentials Directory (Type Manually)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">No Auto-Fill</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Please enter your assigned Customer ID and password in the login form on the right.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Siddartha Rao (Active Customer)</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">siddartha</strong>
                    {' '}· Pass: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">Password@123</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                    ACTIVE
                  </span>
                  <button
                    type="button"
                    onClick={() => { setUsername('siddartha'); setPassword('Password@123'); }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-[#004c8f] rounded transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Rahul Sharma (Active Customer)</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">rahul</strong>
                    {' '}· Pass: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">Password@123</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                    ACTIVE
                  </span>
                  <button
                    type="button"
                    onClick={() => { setUsername('rahul'); setPassword('Password@123'); }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-[#004c8f] rounded transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-950">Vikram Malhotra (Dormant Account)</div>
                  <div className="text-[11px] text-amber-800 font-mono">
                    ID: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">vikram</strong>
                    {' '}· Pass: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300">Password@123</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-950 animate-pulse">
                    DORMANT
                  </span>
                  <button
                    type="button"
                    onClick={() => { setUsername('vikram'); setPassword('Password@123'); }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-purple-950">Bank Compliance Officer (Admin)</div>
                  <div className="text-[11px] text-purple-800 font-mono">
                    ID: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-purple-300">admin</strong>
                    {' '}· Pass: <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-purple-300">Admin@123</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-200 text-purple-950">
                    ADMIN
                  </span>
                  <button
                    type="button"
                    onClick={() => { setUsername('admin'); setPassword('Admin@123'); }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-purple-200 hover:bg-purple-300 text-purple-950 rounded transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Problem Statement & Mailbox Links */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowProblemModal(true)}
              className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 text-left transition-colors cursor-pointer"
            >
              <div className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Scam Threat Model</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Read how the system stops insider rogue officer document tampering on dormant accounts.
              </p>
            </button>

            <a
              href="/mail"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-left transition-colors"
            >
              <div className="font-bold text-blue-950 flex items-center gap-1.5 mb-1">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Live Webmail Portal</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-tight">
                Check incoming dynamic OTPs and fraud change alerts across all mailboxes.
              </p>
            </a>
          </div>

          {/* Safe Banking Reminder */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Safe Banking Tip</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Always verify that the website URL is legitimate before logging in. Do not click on unknown SMS or WhatsApp links.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Login Card (HDFC NetBanking Form) */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            
            {/* Card Header Strip */}
            <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">NetBanking Login</h2>
                <p className="text-xs text-slate-500">Enter your Customer ID & Password</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-50 text-[#004c8f] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer ID / User ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Customer ID or Username"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password / IPIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter NetBanking password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] disabled:bg-slate-300 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating Credentials...' : 'LOGIN TO NETBANKING'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-600">
              <div>
                Don't have an online banking account?{' '}
                <Link to="/register" className="text-[#004c8f] font-bold hover:underline">
                  Open Instant Account
                </Link>
              </div>
              <div className="text-[11px] text-slate-400">
                Authorized educational simulation under ISO 27001 standard.
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[11px] text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© 2026 SecureBank Ltd. All rights reserved.</div>
          <div className="flex gap-4 text-slate-600">
            <span>Security Guidelines</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* Problem Statement Modal */}
      <ProblemStatementModal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
      />
    </div>
  );
};
