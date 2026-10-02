import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProblemStatementModal } from './ProblemStatementModal';
import { 
  ShieldCheck, 
  LogOut, 
  Lock, 
  PhoneCall, 
  AlertTriangle, 
  LayoutDashboard, 
  Send, 
  Users, 
  FileText, 
  Receipt, 
  ShieldAlert, 
  SlidersHorizontal,
  CreditCard,
  Mail,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showProblemModal, setShowProblemModal] = useState(false);

  const customerNav = [
    { to: '/dashboard', label: 'Accounts & Overview', icon: LayoutDashboard },
    { to: '/transfer', label: 'Fund Transfer', icon: Send },
    { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
    { to: '/bills', label: 'BillPay & Recharge', icon: Receipt },
    { to: '/statements', label: 'Statements & Reports', icon: FileText },
    { to: '/dormant', label: 'Account Security', icon: ShieldAlert, badge: user?.accountStatus === 'DORMANT' ? 'DORMANT' : null },
  ];

  const adminNav = [
    { to: '/admin', label: 'Admin Governance Portal', icon: SlidersHorizontal },
    { to: '/dashboard', label: 'Customer Dashboard', icon: LayoutDashboard },
    { to: '/dormant', label: 'Account Security & Re-KYC', icon: ShieldAlert },
  ];

  const navLinks = isAdmin ? adminNav : customerNav;

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      {/* 1. Topmost Utility & Security Ribbon (Real Bank Standard) */}
      <div className="bg-[#002855] text-slate-200 text-xs px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between border-b border-[#001d3d] gap-2">
        <div className="flex items-center gap-4 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 text-slate-300">
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">24x7 Customer Care:</span>
            <strong className="text-white font-medium">1800 202 6161</strong>
          </span>
          <span className="hidden md:inline-block text-slate-400">|</span>
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>256-Bit SSL Encrypted NetBanking</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] sm:text-xs">
          {/* Problem Statement Modal Trigger */}
          <button
            onClick={() => setShowProblemModal(true)}
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded border border-amber-400/30 font-bold transition-colors cursor-pointer"
            title="Read Dormant Account Safety & Insider Threat Thesis"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>🛡️ Problem Statement & Architecture</span>
          </button>

          {/* SecureMail Webmail Link (Opens in new tab) */}
          <a
            href="/mail"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 px-2.5 py-0.5 rounded border border-blue-400/30 font-bold transition-colors"
            title="View Live OTPs and Security Communications"
          >
            <Mail className="w-3.5 h-3.5 text-blue-300" />
            <span>✉️ SecureMail Webmail (Live OTP Inbox)</span>
            <ExternalLink className="w-2.5 h-2.5 text-blue-300" />
          </a>

          <span className="hidden xl:inline text-slate-400 text-[11px]">
            IFSC: <strong className="text-slate-200 font-mono">SECURE000001</strong>
          </span>
        </div>
      </div>

      {/* 2. Main Brand Header with Bank Emblem and Customer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Crest */}
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
          {/* HDFC-inspired Corporate Geometric Emblem */}
          <div className="w-10 h-10 bg-[#004c8f] rounded flex items-center justify-center relative shadow-sm border border-[#003666]">
            <div className="w-5 h-5 bg-[#ed1c24] rounded-sm flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-xs"></div>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-[#002e6e] font-heading">
                Secure<span className="text-[#ed1c24]">Bank</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#004c8f] border border-blue-200">
                NetBanking
              </span>
            </div>
            <p className="text-[11px] text-slate-500 tracking-tight font-medium">
              We Understand Your World
            </p>
          </div>
        </Link>

        {/* User Greeting & Quick Actions */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Account Status Badge */}
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">Welcome,</div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {user.fullName || user.username}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Customer ID: <strong className="text-slate-800">{user.accountNumber ? user.accountNumber : user.username}</strong>
              </div>
            </div>

            {/* Status Pill */}
            {user.accountStatus && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border inline-flex items-center gap-1.5 shadow-xs ${
                user.accountStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : user.accountStatus === 'DORMANT'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  user.accountStatus === 'ACTIVE' ? 'bg-emerald-500' : user.accountStatus === 'DORMANT' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></span>
                {user.accountStatus}
              </span>
            )}

            {/* Logout Action */}
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="End session safely"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs text-[#004c8f] hover:text-[#002e6e] font-bold px-3 py-2 rounded hover:bg-blue-50 transition-colors"
            >
              NetBanking Login
            </Link>
            <Link
              to="/register"
              className="text-xs text-white font-bold px-4 py-2 rounded bg-[#004c8f] hover:bg-[#003666] shadow-sm transition-all"
            >
              Open Instant Account
            </Link>
          </div>
        )}
      </div>

      {/* 3. Primary Navigation Bar (HDFC Signature Navy Blue Strip) */}
      {user && (
        <nav className="bg-[#004c8f] text-white shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold tracking-wide border-b-3 transition-colors shrink-0 ${
                      isActive
                        ? 'bg-[#003666] text-white border-[#ed1c24]'
                        : 'text-blue-100 hover:bg-[#003d73] hover:text-white border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-blue-200" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 font-black animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}

      {/* Dormant Account Insider Scam Thesis Modal */}
      <ProblemStatementModal 
        isOpen={showProblemModal} 
        onClose={() => setShowProblemModal(false)} 
      />
    </header>
  );
};
