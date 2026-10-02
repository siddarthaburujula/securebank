import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Wallet, 
  Send, 
  Receipt, 
  FileText, 
  ShieldCheck, 
  ShieldAlert,
  HelpCircle, 
  Lock, 
  ChevronRight, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyAcc = () => {
    if (user?.accountNumber) {
      navigator.clipboard.writeText(user.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="w-72 shrink-0 hidden lg:block space-y-4">
      {/* 1. Account Summary Tile */}
      {!isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-[#004c8f] flex items-center justify-center font-bold">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800">Savings Account</span>
                <span className="block text-[10px] text-slate-500">Preferred Banking</span>
              </div>
            </div>
            {user?.accountStatus === 'DORMANT' ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                🛡️ DORMANT
              </span>
            ) : user?.accountStatus === 'FROZEN' ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                FROZEN
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">A/C Number:</span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-mono text-sm font-bold text-[#002e6e]">
                  {user?.accountNumber || '100100000001'}
                </span>
                <button
                  onClick={copyAcc}
                  className="text-slate-400 hover:text-[#004c8f] p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Copy Account Number"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
              <span>IFSC Code:</span>
              <strong className="font-mono text-slate-800">SECURE000001</strong>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Branch:</span>
              <span className="font-medium text-slate-700">Central Banking Unit</span>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/transfer"
              className="text-center py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-[#004c8f] rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Transfer</span>
            </Link>
            <Link
              to="/statements"
              className="text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <FileText className="w-3 h-3" />
              <span>Passbook</span>
            </Link>
          </div>

          {user?.accountStatus === 'DORMANT' && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Dormant Scam Shield</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-tight">
                Debits are blocked to stop unauthorized account takeover scams.
              </p>
              <Link
                to="/dormant"
                className="block text-center py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold transition-all shadow-xs"
              >
                Re-KYC Verification
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. Quick Services Menu */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Quick Banking Services
        </h4>
        <ul className="space-y-1 text-xs">
          <li>
            <Link
              to="/transfer"
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700 hover:text-[#004c8f] font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Instant IMPS / NEFT Transfer</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </li>
          <li>
            <Link
              to="/bills"
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700 hover:text-[#004c8f] font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>Electricity & Mobile BillPay</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </li>
          <li>
            <Link
              to="/beneficiaries"
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700 hover:text-[#004c8f] font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Manage Beneficiaries</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </li>
          <li>
            <Link
              to="/dormant"
              className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-slate-700 hover:text-[#004c8f] font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Dormant Re-KYC Verification</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </li>
        </ul>
      </div>

      {/* 3. Safe Banking Guidelines Banner (Official Indian Bank Style) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-amber-950 mb-1">
          <Lock className="w-3.5 h-3.5 text-amber-700" />
          <span>Safe Banking Tips</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          SecureBank staff will <strong>never call or message</strong> asking for your password, One Time Password (OTP), or CVV. Report suspicious calls to <span className="underline font-semibold">1800 202 6161</span>.
        </p>
      </div>

      {/* 4. Regulatory Info */}
      <div className="p-3 text-[11px] text-slate-500 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
        <div className="font-semibold text-slate-700">Bank Assurance</div>
        <p>• 100% ACID Double-Entry Bookkeeping</p>
        <p>• RBI Regulatory Sandbox Model</p>
        <p>• 256-bit AES Encrypted Data Stores</p>
      </div>
    </aside>
  );
};
