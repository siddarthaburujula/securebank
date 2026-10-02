import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  X, 
  FileWarning, 
  UserCheck, 
  Mail, 
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';

export const ProblemStatementModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#002e6e] via-[#004c8f] to-[#002855] text-white px-6 py-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-300/30">
                System Thesis & Security Protocol
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                Dormant Account Safety & Rogue Insider Scam Defense
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* Problem Statement Box */}
          <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm sm:text-base">
              <FileWarning className="w-5 h-5 text-rose-600 shrink-0" />
              <span>The Problem Statement: Insider Exploitation of Inactive Bank Accounts</span>
            </div>
            <p className="text-rose-900 text-xs sm:text-sm">
              In commercial banking, <strong>dormant accounts</strong> (accounts inactive for 90+ days with no customer transactions) are high-value fraud targets. Rogue bank employees or insider actors exploit internal database access to alter customer KYC documents (modifying Aadhaar, PAN, phone number, email address, and home address) without the genuine customer's awareness.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-white p-3 rounded-lg border border-rose-200">
                <strong className="text-rose-700 block mb-1">🚨 Rogue Insider Attack Vector</strong>
                Bank officer changes phone/email on dormant account &rarr; Diverts OTPs to fraudster's mailbox &rarr; Reactivates account &rarr; Siphons customer funds undetected.
              </div>
              <div className="bg-white p-3 rounded-lg border border-rose-200">
                <strong className="text-rose-700 block mb-1">⚠️ The Customer Dilemma</strong>
                How does the legitimate customer know an officer altered their records if notifications were redirected to the fraudster's new email/phone?
              </div>
            </div>
          </div>

          {/* 4-Pillar Security Architecture */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#004c8f]" />
              <span>Our 4-Pillar Cryptographic & Procedural Defense</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Pillar 1 */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#002e6e] text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-full bg-[#004c8f] text-white flex items-center justify-center text-xs font-mono">1</div>
                  <span>Old Credentials Authentication First</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Whenever a dormant account customer or officer attempts Re-KYC or document updates, the customer <strong>must authenticate with their existing/old registered credentials</strong> (Aadhaar & OTP dispatched to the old contact address) before entering any new details.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-mono">2</div>
                  <span>Bifurcated Real-time Fraud Alerts</span>
                </div>
                <p className="text-slate-600 text-xs">
                  If sensitive details (email, phone, Aadhaar) are modified during Re-KYC, an emergency <strong>Tamper & Fraud Alert is immediately dispatched to the original old email</strong> in real-time, preventing silent account hijacking.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-mono">3</div>
                  <span>Officer Dual 2FA Verification</span>
                </div>
                <p className="text-slate-600 text-xs">
                  Bank compliance officers <strong>cannot unilaterally approve</strong> reactivations or changes. Approval requires entering a dynamic <strong>Officer 2FA Security Key</strong> dispatched to compliance headquarters (<code className="font-mono text-emerald-700">admin@securebank.com</code>).
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-purple-900 text-xs sm:text-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-mono">4</div>
                  <span>SecureMail Webmail & Dynamic OTPs</span>
                </div>
                <p className="text-slate-600 text-xs">
                  A standalone Webmail engine (<code className="font-mono text-purple-700">/mail</code>) simulates real-time mail servers with unique, non-static 6-digit OTPs persisted in database with 10-minute expiry and attempt tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Sequence Diagram */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl space-y-3 font-mono text-[11px] sm:text-xs">
            <div className="text-amber-400 font-bold flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>End-to-End Cryptographic Re-KYC Execution Pipeline</span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">[Customer]</span> &rarr; Enters Old Aadhaar &rarr; Dispatches OTP to Old Email (SecureMail)
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">[Validation]</span> &rarr; Old OTP verified &rarr; Customer provides New Aadhaar/PAN/Email &rarr; New OTP verified
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400">[Security Alert]</span> &rarr; Real-time Fraud Notification automatically delivered to Old Email
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">[Admin Review]</span> &rarr; Officer inspects request + requests Officer 2FA Security Key
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">[Activation]</span> &rarr; Officer 2FA verified &rarr; Account restored to ACTIVE &rarr; Confirmation OTP issued
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Database-backed with MySQL InnoDB, JPA Pessimistic Concurrency, and REST APIs.
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/mail"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-blue-50 text-[#004c8f] hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 border border-blue-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Open SecureMail Webmail</span>
              </a>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-[#004c8f] hover:bg-[#003666] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
