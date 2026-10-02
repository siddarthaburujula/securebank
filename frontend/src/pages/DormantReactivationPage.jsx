import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  KeyRound, 
  HelpCircle,
  FileCheck,
  ChevronRight,
  RefreshCw,
  Lock,
  AlertTriangle,
  Building,
  CreditCard,
  Fingerprint,
  FileText,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DormantReactivationPage = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [dormancyStatus, setDormancyStatus] = useState(null);
  const [reason, setReason] = useState('Account reactivation required for salary credit and bill payments');
  const [kycMode, setKycMode] = useState('ONLINE_AADHAAR_PAN');
  const [branchName, setBranchName] = useState('Mumbai Main Branch - Fort');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  // Auto-redirect countdown after activation
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);

  // Stage 1: Existing / Old Registered Details Authentication
  const [oldAadhaarNumber, setOldAadhaarNumber] = useState('4589 1234 9012');
  const [oldOtp, setOldOtp] = useState('');
  const [sendingOldOtp, setSendingOldOtp] = useState(false);
  const [oldOtpStatus, setOldOtpStatus] = useState('');

  // Stage 2: Detail Changes Toggle & New Details
  const [hasDetailChanges, setHasDetailChanges] = useState(false);
  const [newAadhaarNumber, setNewAadhaarNumber] = useState('');
  const [newPanNumber, setNewPanNumber] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [sendingNewOtp, setSendingNewOtp] = useState(false);
  const [newOtpStatus, setNewOtpStatus] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send OTP to Old Registered Email (vikram@securebank.com)
  const handleSendOldOtp = async () => {
    setError('');
    setOldOtpStatus('');
    setSendingOldOtp(true);
    try {
      const email = user?.email || 'vikram@securebank.com';
      const phone = user?.phoneNumber || '+91-9876543212';
      const name = user?.fullName || 'Vikram Malhotra';
      const res = await api.post('/mail/send-otp', {
        email,
        phone,
        name,
        purpose: 'DORMANT_REKYC_OLD',
        action: 'Identity Re-Verification for Dormant Account #' + (dormancyStatus?.accountNumber || user?.accountNumber || '100100000003')
      });
      if (res.data?.success) {
        setOldOtpStatus(`✅ Dynamic OTP sent to ${email}! View in SecureMail Webmail (/mail).`);
        if (res.data.data?.otp) {
          setOldOtp(res.data.data.otp);
        }
      }
    } catch (err) {
      setOldOtpStatus('Failed to send OTP to old email: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingOldOtp(false);
    }
  };

  // Send OTP to New Email
  const handleSendNewOtp = async () => {
    setError('');
    setNewOtpStatus('');
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please provide a valid New Email Address before requesting OTP.');
      return;
    }
    setSendingNewOtp(true);
    try {
      const res = await api.post('/mail/send-otp', {
        email: newEmail.trim(),
        phone: newPhoneNumber.trim(),
        name: user?.fullName || 'Customer',
        purpose: 'DORMANT_REKYC_NEW',
        action: 'Verification for New Contact Details update on Dormant Account'
      });
      if (res.data?.success) {
        setNewOtpStatus(`✅ Dynamic OTP sent to new email ${newEmail}! View in SecureMail.`);
        if (res.data.data?.otp) {
          setNewOtp(res.data.data.otp);
        }
      }
    } catch (err) {
      setNewOtpStatus('Failed to send OTP to new email: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingNewOtp(false);
    }
  };

  // 1. Fetch live dormancy status of the logged-in customer
  const fetchStatus = async () => {
    try {
      const res = await api.get('/dormant/status');
      if (res.data?.success) {
        setDormancyStatus(res.data.data);
        if (res.data.data.status) {
          updateUserProfile({ accountStatus: res.data.data.status });
        }
      }
    } catch (err) {
      console.error('Failed to fetch account status:', err);
    }
  };

  // 2. Fetch history of reactivation requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dormant/requests');
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = () => {
    fetchStatus();
    fetchRequests();
  };

  // Start polling for ACTIVE status after submission (stops when ACTIVE or unmounted)
  const startPolling = () => {
    if (pollingRef.current) return; // already polling
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get('/dormant/status');
        if (res.data?.success) {
          const newStatus = res.data.data?.status;
          setDormancyStatus(res.data.data);
          if (newStatus === 'ACTIVE') {
            updateUserProfile({ accountStatus: 'ACTIVE' });
            // Stop polling and start redirect countdown
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setRedirectCountdown(5);
          }
        }
      } catch (_) {}
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  useEffect(() => {
    refreshAll();
    return () => stopPolling(); // cleanup on unmount
  }, []);

  // Countdown timer effect — triggers when redirectCountdown is set
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      navigate('/dashboard');
      return;
    }
    countdownRef.current = setTimeout(() => {
      setRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(countdownRef.current);
  }, [redirectCountdown, navigate]);

  // 3. Simulate Dormancy Lock (Interactive Demo Feature)
  const handleSimulateDormant = async () => {
    setError('');
    setSuccess('');
    setSimulating(true);
    try {
      const res = await api.post('/dormant/simulate-dormant');
      if (res.data?.success) {
        setSuccess('🛡️ Dormancy Anti-Scam Lock activated on your account. All debit and transfer capabilities are now locked for scam defense demonstration.');
        setDormancyStatus(res.data.data);
        updateUserProfile({ accountStatus: 'DORMANT' });
        fetchRequests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to simulate dormancy lock.');
    } finally {
      setSimulating(false);
    }
  };

  // 4. Submit Reactivation Request with 2-Stage Old & New Credentials Re-KYC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (dormancyStatus?.status !== 'DORMANT') {
      setError('Account is currently ACTIVE. Reactivation is only required for DORMANT accounts.');
      return;
    }

    if (!reason || reason.trim().length < 8) {
      setError('Please provide a descriptive reason for reactivation (min 8 characters).');
      return;
    }

    // Stage 1 Validation: Old Credentials Authentication
    const cleanOldAadhaar = (oldAadhaarNumber || '').replace(/\s+/g, '');
    if (cleanOldAadhaar.length !== 12) {
      setError('Stage 1 Error: Please enter your 12-digit existing registered Aadhaar number.');
      return;
    }
    if (!oldOtp || oldOtp.trim().length !== 6) {
      setError('Stage 1 Error: Please enter the 6-digit OTP sent to your old registered email/mobile. (Click "Request OTP to Registered Email" or check SecureMail)');
      return;
    }

    // Stage 2 Validation (If customer is modifying details)
    if (hasDetailChanges) {
      if (!newEmail && !newPhoneNumber && !newAadhaarNumber && !newPanNumber && !newAddress) {
        setError('Stage 2 Error: Detail change toggle is ON, but no new details were provided.');
        return;
      }
      if (newEmail && !newEmail.includes('@')) {
        setError('Stage 2 Error: Please enter a valid new email address.');
        return;
      }
      if (newPhoneNumber && newPhoneNumber.replace(/\D/g, '').length < 10) {
        setError('Stage 2 Error: Please enter a valid 10-digit new phone number.');
        return;
      }
      if (newAadhaarNumber && newAadhaarNumber.replace(/\s+/g, '').length !== 12) {
        setError('Stage 2 Error: New Aadhaar number must be 12 digits.');
        return;
      }
      if (newPanNumber && newPanNumber.trim().length !== 10) {
        setError('Stage 2 Error: New PAN number must be 10 characters.');
        return;
      }
      if (!newOtp || newOtp.trim().length !== 6) {
        setError('Stage 2 Error: Please enter the 6-digit verification OTP sent to your new email.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/dormant/reactivate', {
        reason: reason.trim(),
        kycMode,
        branchName: kycMode === 'BRANCH_IN_PERSON' ? branchName : null,
        oldAadhaarNumber: cleanOldAadhaar,
        oldOtp: oldOtp.trim(),
        hasDetailChanges: hasDetailChanges,
        newAadhaarNumber: hasDetailChanges && newAadhaarNumber ? newAadhaarNumber.replace(/\s+/g, '') : null,
        newPanNumber: hasDetailChanges && newPanNumber ? newPanNumber.trim().toUpperCase() : null,
        newEmail: hasDetailChanges && newEmail ? newEmail.trim() : null,
        newPhoneNumber: hasDetailChanges && newPhoneNumber ? newPhoneNumber.trim() : null,
        newAddress: hasDetailChanges && newAddress ? newAddress.trim() : null,
        newOtp: hasDetailChanges ? newOtp.trim() : null,
        otp: oldOtp.trim(),
        simulatedOtp: oldOtp.trim(),
        aadhaarNumber: cleanOldAadhaar,
        panNumber: (newPanNumber || 'ABCDE1234F').trim().toUpperCase(),
        aadhaarOtp: oldOtp.trim()
      });

      if (res.data?.success) {
        setSuccess('✅ 2-Stage Re-KYC verification request submitted successfully (Ref: ' + (res.data.data?.requestReference || 'Assigned') + '). Your request has been queued for Compliance Officer review under Dual 2FA protocol. This page will auto-refresh when the admin approves.');
        fetchStatus();
        fetchRequests();
        startPolling(); // begin watching for ACTIVE status
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to submit request. Account may already have a pending review.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isDormant = dormancyStatus?.status === 'DORMANT' || user?.accountStatus === 'DORMANT';
  const hasPending = dormancyStatus?.hasPendingReactivation;
  const latestApproved = requests.find(r => r.status === 'APPROVED');
  const isNowActive = dormancyStatus?.status === 'ACTIVE' && latestApproved;


  return (
    <div className="space-y-5">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/dashboard" className="hover:text-[#004c8f]">NetBanking</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">Account Security & Re-KYC</span>
        </div>

        <button
          onClick={refreshAll}
          className="text-xs text-slate-600 hover:text-[#004c8f] flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Dormant Account Re-KYC & Anti-Scam Shield
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Regulatory cybersecurity protocol preventing unauthorized account takeover and fraudulent balance siphoning.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <span>RBI Inactivity Threshold: 90 Days</span>
        </div>
      </div>

      {/* Primary Account Status Banner */}
      {isDormant ? (
        <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-950 font-mono">
                    🛡️ STATUS: DORMANT (SCAM LOCKED)
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    A/C: {dormancyStatus?.accountNumber || user?.accountNumber}
                  </span>
                  {dormancyStatus?.inactivityDays ? (
                    <span className="text-[11px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-medium">
                      Inactive for {dormancyStatus.inactivityDays} days
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                  Protective Anti-Scam Security Lock Active
                </h3>
                <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
                  Due to prolonged inactivity, outgoing transactions (Fund Transfers, Bill Payments, and Online Debits) are <strong>restricted</strong>. This prevents fraud syndicates from siphoning unattended balances. Complete the Step-Up Verification below to initiate reactivation.
                </p>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
              <span className="text-[11px] text-slate-500">Available Protected Balance</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                ₹{dormancyStatus?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '—'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono">
                    ✅ STATUS: ACTIVE (GOOD STANDING)
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    A/C: {dormancyStatus?.accountNumber || user?.accountNumber}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1.5">
                  Account is Fully Operational
                </h3>
                <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
                  Your account is in good standing with full debit, transfer, and bill payment capabilities. Dormant Account Scam Shield monitors for unauthorized activity in the background.
                </p>
              </div>
            </div>

            {/* Demo Simulation Action */}
            <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
              <button
                onClick={handleSimulateDormant}
                disabled={simulating}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                title="Simulate Dormant Lock to showcase anti-scam protection"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{simulating ? 'Enforcing Lock...' : '🧪 Simulate Dormancy Lock (Demo)'}</span>
              </button>
              <span className="text-[10px] text-slate-500">
                Click to turn account DORMANT and test fraud blocking
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 ACCOUNT ACTIVATED CELEBRATION — shows when dormant→ACTIVE after admin approval */}
      {isNowActive && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-[#004c8f] text-white rounded-2xl p-6 sm:p-8 shadow-2xl border-2 border-emerald-400 animate-in fade-in zoom-in-95">
          {/* Background sparkle effect */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] tracking-wider uppercase animate-pulse">
                  ✅ ACCOUNT REACTIVATED
                </span>
                <span className="text-xs text-emerald-200 font-mono">Ref: {latestApproved?.requestReference}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                🎉 Your Account is Now ACTIVE!
              </h2>
              <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
                The compliance officer verified your Aadhaar & PAN credentials under Dual 2FA and restored your account. All banking services — transfers, bill payments, and debits — are now fully operational.
              </p>
              <p className="text-xs text-emerald-200 font-semibold">
                🛡️ Your account was protected by Anti-Scam Dormancy Shield during inactivity.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0">
              {/* Countdown redirect circle */}
              <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-emerald-300 flex flex-col items-center justify-center shadow-lg">
                <span className="text-3xl font-black text-amber-300">{redirectCountdown ?? '✓'}</span>
                <span className="text-[10px] text-emerald-200 mt-0.5">
                  {redirectCountdown !== null ? 'seconds' : 'done'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-200 text-center">
                Auto-redirecting to Dashboard...
              </span>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 bg-white text-emerald-800 rounded-xl font-black text-sm hover:bg-emerald-50 shadow-md transition-all"
              >
                Go to Dashboard Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Polling indicator — shows while waiting for admin approval after submission */}
      {!isNowActive && pollingRef.current && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          <span className="font-semibold">
            ⏳ Waiting for Compliance Officer approval... This page updates automatically every 4 seconds.
            <span className="text-blue-600 ml-1">Do not close this tab.</span>
          </span>
        </div>
      )}

      {/* Approved banner for non-active cases (request approved but account already active before) */}
      {latestApproved && !isNowActive && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-[#004c8f] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-500/40 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] tracking-wider uppercase">
                  KYC Verified & Certified
                </span>
                <span className="text-xs text-emerald-200 font-mono">Ref: {latestApproved.requestReference}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black">
                🎉 Re-KYC Approved — Account Reactivated
              </h2>
              <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                Your account has been restored to ACTIVE status. All banking services are now fully operational.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="shrink-0 px-5 py-2.5 bg-white text-emerald-800 rounded-xl font-black text-sm hover:bg-emerald-50 shadow-md transition-all"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      )}


      {/* Global Alerts */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-start gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-xs text-red-950 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Step-Up OTP & Aadhaar/PAN Verification Form */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#004c8f]" />
                <span>Customer Self-Service Re-KYC Verification</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Admin cannot tamper with dormant accounts
              </span>
            </div>

            {hasPending ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Clock className="w-4 h-4" />
                  <span>Re-KYC Request Under Officer Review</span>
                </div>
                <p className="leading-relaxed">
                  Your Re-KYC verification request (Reference: <strong className="font-mono">{dormancyStatus?.pendingRequestReference}</strong>) has been forwarded to the bank compliance officer.
                </p>
                <p className="text-[11px] text-amber-800">
                  Once approved by the admin, your account will be activated and you will receive your Customer Confirmation OTP.
                </p>
                <div className="pt-2">
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004c8f] text-white rounded font-bold text-xs hover:bg-[#003666] transition-colors"
                  >
                    <span>Open Admin Portal to Review as Officer</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : !isDormant ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">
                  ℹ️ Account is Currently ACTIVE
                </p>
                <p className="leading-relaxed">
                  Re-KYC is only required when an account is flagged as <strong>DORMANT</strong>. To experience the customer Re-KYC flow, click the <strong>"Simulate Dormancy Lock (Demo)"</strong> button above or mark the account dormant in the <Link to="/admin" className="text-[#004c8f] font-semibold underline">Admin Portal</Link>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Mode Selector */}
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1.5">
                    Select Re-KYC Verification Channel <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setKycMode('ONLINE_AADHAAR_PAN')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        kycMode === 'ONLINE_AADHAAR_PAN'
                          ? 'border-[#004c8f] bg-blue-50/70 text-[#004c8f] ring-2 ring-[#004c8f]/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Fingerprint className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs">Online Aadhaar & PAN (2FA)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Instant digital authentication with Aadhaar OTP & PAN verification.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKycMode('BRANCH_IN_PERSON')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        kycMode === 'BRANCH_IN_PERSON'
                          ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <Building className="w-5 h-5 shrink-0 mt-0.5 text-purple-600" />
                      <div>
                        <div className="font-bold text-xs">In-Person Branch Verification</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Fallback if biometric or Aadhaar mobile OTP fails. Visit nearest bank branch.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Branch Fallback Details */}
                {kycMode === 'BRANCH_IN_PERSON' ? (
                  <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900">
                      <Building className="w-4 h-4 text-purple-700" />
                      <span>Branch Appointment & Physical Verification Protocol</span>
                    </div>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      If you experience Aadhaar OTP delivery failure, fingerprint sensor rejection, or have updated your phone number, you can verify directly at your bank branch with your original documents.
                    </p>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Select Nearest Bank Branch *
                      </label>
                      <select
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg bg-white focus:outline-none focus:border-purple-600"
                      >
                        <option value="Mumbai Main Branch - Fort">Mumbai Main Branch - Fort, Mumbai</option>
                        <option value="Bengaluru Cyber City Branch - Whitefield">Bengaluru Cyber City Branch - Whitefield</option>
                        <option value="New Delhi Connaught Place Branch">New Delhi Connaught Place Branch - New Delhi</option>
                        <option value="Hyderabad Financial District - Gachibowli">Hyderabad Financial District - Gachibowli</option>
                        <option value="Chennai Anna Salai Branch">Chennai Anna Salai Branch - Chennai</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Aadhaar Card Number *</label>
                        <input
                          type="text"
                          required
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value)}
                          placeholder="4589 1234 5678"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#004c8f] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">PAN Card Number *</label>
                        <input
                          type="text"
                          required
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#004c8f] font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2-STAGE RE-KYC AUTHENTICATION */
                  <div className="space-y-5 text-xs">
                    
                    {/* ──── STAGE 1: OLD CREDENTIALS IDENTITY AUTHENTICATION ──── */}
                    <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#004c8f] text-white flex items-center justify-center font-bold text-xs">
                            1
                          </span>
                          <span className="font-extrabold text-[#002e6e] text-xs uppercase tracking-wider">
                            Stage 1: Verify Existing Registered Identity (Mandatory)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#004c8f]">
                          Anti-Tamper Lock
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        To prevent rogue bank officers or unauthorized third parties from tampering with your dormant account, you must first verify identity with your <strong>existing registered credentials</strong>.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Existing Registered Aadhaar Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            maxLength="14"
                            value={oldAadhaarNumber}
                            onChange={(e) => setOldAadhaarNumber(e.target.value)}
                            placeholder="4589 1234 9012"
                            className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-[#004c8f] bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Current Registered Email & Phone
                          </label>
                          <div className="px-3 py-2 text-xs font-mono bg-slate-100 rounded-lg border border-slate-200 text-slate-700">
                            {user?.email || 'vikram@securebank.com'} ({user?.phoneNumber || '+91-9876543212'})
                          </div>
                        </div>
                      </div>

                      {/* OTP to Old Email */}
                      <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="font-bold text-slate-800">
                            OTP Sent to Registered Email (vikram@securebank.com) <span className="text-red-500">*</span>
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSendOldOtp}
                              disabled={sendingOldOtp}
                              className="px-3 py-1 bg-[#004c8f] hover:bg-[#003666] disabled:bg-slate-300 text-white rounded font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>{sendingOldOtp ? 'Sending OTP...' : 'Request OTP to Old Email'}</span>
                            </button>

                            <a
                              href="/mail"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[11px] flex items-center gap-1 border border-amber-300"
                              title="Open SecureMail Webmail in New Tab"
                            >
                              <span>Open Webmail (/mail)</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        {oldOtpStatus && (
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                            {oldOtpStatus}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            required
                            maxLength="6"
                            value={oldOtp}
                            onChange={(e) => setOldOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="w-48 px-3 py-2 text-base font-mono tracking-widest font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none text-center bg-white"
                          />
                          <span className="text-[11px] text-slate-500">
                            (Enter dynamic OTP from Webmail or fallback <code className="font-mono font-bold text-blue-700">123456</code>)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ──── STAGE 2: DETAIL CHANGES TOGGLE & NEW CREDENTIALS ──── */}
                    <div className="p-4 rounded-xl border-2 border-slate-200 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                            2
                          </span>
                          <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                            Stage 2: Update Registered Documents & Contacts (Optional)
                          </span>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasDetailChanges}
                            onChange={(e) => setHasDetailChanges(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-800">
                            I want to update my details
                          </span>
                        </label>
                      </div>

                      {hasDetailChanges ? (
                        <div className="space-y-4 pt-1 animate-in fade-in">
                          {/* Alert Notice */}
                          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-950 rounded-r-lg space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                              <ShieldAlert className="w-4 h-4 text-amber-700" />
                              <span>High-Security Protocol for Contact Updates</span>
                            </div>
                            <p className="text-[11px] text-amber-900 leading-relaxed">
                              Submitting new details on a dormant account triggers an <strong>immediate real-time fraud alert to your old email</strong> address. The bank compliance officer must also pass a <strong>Dual 2FA verification</strong> before any change is committed to the database.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                New Aadhaar Number (12 Digits)
                              </label>
                              <input
                                type="text"
                                maxLength="14"
                                value={newAadhaarNumber}
                                onChange={(e) => setNewAadhaarNumber(e.target.value)}
                                placeholder="e.g. 5678 1234 9999"
                                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-[#004c8f] bg-white"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                New PAN Card Number (10 Characters)
                              </label>
                              <input
                                type="text"
                                maxLength="10"
                                value={newPanNumber}
                                onChange={(e) => setNewPanNumber(e.target.value.toUpperCase())}
                                placeholder="e.g. ABCDE9999Z"
                                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:border-[#004c8f] bg-white"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                New Email Address <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="e.g. vikram_new@securebank.com"
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#004c8f] bg-white"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                New Mobile Number
                              </label>
                              <input
                                type="text"
                                value={newPhoneNumber}
                                onChange={(e) => setNewPhoneNumber(e.target.value)}
                                placeholder="e.g. +91-9811122233"
                                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-[#004c8f] bg-white"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-slate-700 mb-1">
                                New Residential Address
                              </label>
                              <input
                                type="text"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                placeholder="e.g. Flat 402, Highrise Tower, Cyber City, Bangalore"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#004c8f] bg-white"
                              />
                            </div>
                          </div>

                          {/* OTP for New Email */}
                          <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="font-bold text-slate-800">
                                Verification OTP for New Email <span className="text-red-500">*</span>
                              </label>

                              <button
                                type="button"
                                onClick={handleSendNewOtp}
                                disabled={sendingNewOtp || !newEmail}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>{sendingNewOtp ? 'Sending...' : 'Request OTP to New Email'}</span>
                              </button>
                            </div>

                            {newOtpStatus && (
                              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                                {newOtpStatus}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength="6"
                                value={newOtp}
                                onChange={(e) => setNewOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                className="w-48 px-3 py-2 text-base font-mono tracking-widest font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none text-center bg-white"
                              />
                              <span className="text-[11px] text-slate-500">
                                (Dynamic OTP delivered to new email or fallback <code className="font-mono font-bold text-amber-700">654321</code>)
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-[11px]">
                          Check the box above if you need to modify your registered Aadhaar, PAN, email, phone number, or address. Otherwise, your existing registered profile details will be retained.
                        </p>
                      )}
                    </div>

                  </div>
                )}

                {/* Reason */}
                <div className="text-xs pt-1">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Justification / Purpose for Reactivation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows="2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide purpose (e.g. salary deposit, utility payments, savings)..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] disabled:bg-slate-300 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Re-KYC...' : 'Submit 2-Stage Re-KYC for Compliance Review'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

        {/* Right 1 Col: Regulatory Explanations */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs space-y-3">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
              Why is an Account Flagged as Dormant?
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Under RBI Core Banking Guidelines, if no customer-induced transaction (debit/credit) takes place for <strong>90 consecutive days</strong>, the account is protected by marking it DORMANT.
            </p>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
              <div className="font-semibold text-slate-800">Scam Prevention Safeguards:</div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Unauthorized debit & transfer prevention</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Compulsory step-up 2FA re-verification</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Mandatory administrator audit review</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* History of Reactivation Requests */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
          My Reactivation Request History ({requests.length})
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            Loading request history...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            No previous reactivation requests submitted.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Officer Review Notes</th>
                  <th className="py-3 px-4 text-center">Customer Activation OTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {r.requestReference}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {r.accountNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {r.reviewNotes || 'Under officer evaluation'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.status === 'APPROVED' ? (
                        <span className="font-mono font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs">
                          987654 (Verified)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
