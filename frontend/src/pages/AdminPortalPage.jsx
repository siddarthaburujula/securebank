import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  Users, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Check, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Building,
  ChevronRight,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  Flame,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPortalPage = () => {
  const [activeTab, setActiveTab] = useState('scam-shield'); // 'scam-shield' | 'accounts' | 'reactivations' | 'audits'
  
  // ─── Accounts tab state ───────────────────────────────────────────────────
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    fullName: '',
    username: '',
    password: 'Password@123',
    email: '',
    phoneNumber: '',
    dateOfBirth: '1998-01-01',
    address: '',
    accountType: 'SAVINGS',
    initialDeposit: '5000.00'
  });
  const [editForm, setEditForm] = useState({
    customerId: null,
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: ''
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // ─── Anti-Scam Shield tab state ──────────────────────────────────────────
  const [scamStats, setScamStats] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loadingScam, setLoadingScam] = useState(false);
  const [scanning, setScanning] = useState(false);

  // ─── Reactivations tab state ─────────────────────────────────────────────
  const [reactivations, setReactivations] = useState([]);       // PENDING only
  const [allReactivations, setAllReactivations] = useState([]); // PENDING + APPROVED + REJECTED
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [loadingReactivations, setLoadingReactivations] = useState(false);
  const [reviewNotes, setReviewNotes] = useState({});

  // ─── Audits tab state ────────────────────────────────────────────────────
  const [audits, setAudits] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [totalAuditPages, setTotalAuditPages] = useState(1);

  // ─── Toast Notifications ─────────────────────────────────────────────────
  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  // ─── Data Fetchers ────────────────────────────────────────────────────────

  // 1. Fetch Scam Shield Data
  const fetchScamData = async () => {
    try {
      setLoadingScam(true);
      const [statsRes, eventsRes] = await Promise.all([
        api.get('/admin/scam-shield/stats'),
        api.get('/admin/scam-shield/alerts')
      ]);

      if (statsRes.data?.success) {
        setScamStats(statsRes.data.data);
      }
      if (eventsRes.data?.success) {
        setSecurityEvents(eventsRes.data.data || []);
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to load Anti-Scam data.');
    } finally {
      setLoadingScam(false);
    }
  };

  // 2. Fetch Accounts
  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const res = await api.get('/admin/accounts');
      if (res.data?.success) {
        setAccounts(res.data.data || []);
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to load bank accounts.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // 3. Fetch Reactivations (PENDING + full history)
  const fetchReactivations = async () => {
    try {
      setLoadingReactivations(true);
      const [pendingRes, allRes] = await Promise.all([
        api.get('/admin/reactivations'),
        api.get('/admin/reactivations/all')
      ]);
      if (pendingRes.data?.success) {
        setReactivations(pendingRes.data.data || []);
      }
      if (allRes.data?.success) {
        setAllReactivations(allRes.data.data || []);
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to load reactivation requests.');
    } finally {
      setLoadingReactivations(false);
    }
  };

  // 4. Fetch Audits
  const fetchAudits = async (page = 0) => {
    try {
      setLoadingAudits(true);
      const res = await api.get('/admin/audits', { params: { page, size: 15 } });
      if (res.data?.success) {
        setAudits(res.data.data?.content || []);
        setAuditPage(page);
        const totalP = res.data.data?.page?.totalPages ?? res.data.data?.totalPages ?? 1;
        setTotalAuditPages(totalP);
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoadingAudits(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'scam-shield') fetchScamData();
    if (activeTab === 'accounts') {
      fetchAccounts();
      fetchReactivations();
    }
    if (activeTab === 'reactivations') fetchReactivations();
    if (activeTab === 'audits') fetchAudits(0);
  }, [activeTab]);

  // ─── Anti-Scam Actions ────────────────────────────────────────────────────

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const res = await api.post('/admin/scam-shield/scan');
      if (res.data?.success) {
        const d = res.data.data;
        showNotify('success', `Scan Complete! ${d.newlyDormantAccounts} accounts placed under Dormant Scam Shield. Scanned ${d.scannedAccounts} total accounts.`);
        fetchScamData();
        fetchAccounts();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Dormant scam scan failed.');
    } finally {
      setScanning(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    const notes = window.prompt('Enter security resolution notes:', 'Identity verified by compliance officer. No unauthorized access.');
    if (!notes) return;

    try {
      const res = await api.post(`/admin/scam-shield/alerts/${alertId}/resolve`, { notes });
      if (res.data?.success) {
        showNotify('success', 'Security alert resolved and marked safe.');
        fetchScamData();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to resolve alert.');
    }
  };

  // ─── Customer Management Actions ─────────────────────────────────────────

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await api.post('/admin/customers', {
        ...createForm,
        initialDeposit: parseFloat(createForm.initialDeposit)
      });
      if (res.data?.success) {
        showNotify('success', `Customer [${createForm.fullName}] created with Account #${res.data.data?.accountNumber}!`);
        setShowAddModal(false);
        setCreateForm({
          fullName: '',
          username: '',
          password: 'Password@123',
          email: '',
          phoneNumber: '',
          dateOfBirth: '1998-01-01',
          address: '',
          accountType: 'SAVINGS',
          initialDeposit: '5000.00'
        });
        fetchAccounts();
        if (activeTab === 'scam-shield') fetchScamData();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to create customer.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openEditModal = (acc) => {
    if (acc.status === 'DORMANT') {
      showNotify('error', 'Access Denied: Dormant accounts cannot be altered by bank employees. Customer must login and perform Re-KYC independently to prevent insider scam.');
      return;
    }
    setEditForm({
      customerId: acc.customerId,
      fullName: acc.customerName || '',
      email: acc.email || '',
      phoneNumber: acc.phoneNumber || '',
      dateOfBirth: acc.dateOfBirth ? acc.dateOfBirth.split('T')[0] : '1998-01-01',
      address: acc.address || '',
      customerOtp: '654321'
    });
    setSelectedCustomer(acc);
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editForm.customerId) return;
    if (!editForm.customerOtp || editForm.customerOtp.trim().length !== 6) {
      showNotify('error', 'Customer Consent OTP is required (6 digits) to authorize account modification and prevent bank employee fraud.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await api.put(`/admin/customers/${editForm.customerId}`, editForm);
      if (res.data?.success) {
        showNotify('success', `Customer [${editForm.fullName}] details updated successfully under Customer OTP authorization.`);
        setShowEditModal(false);
        fetchAccounts();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to update customer details.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const openDeleteModal = (acc) => {
    setSelectedCustomer(acc);
    setShowDeleteModal(true);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer?.customerId) return;

    setSubmittingAction(true);
    try {
      const res = await api.delete(`/admin/customers/${selectedCustomer.customerId}`);
      if (res.data?.success) {
        showNotify('success', `Customer [${selectedCustomer.customerName}] and account #${selectedCustomer.accountNumber} deleted successfully.`);
        setShowDeleteModal(false);
        setSelectedCustomer(null);
        fetchAccounts();
        if (activeTab === 'scam-shield') fetchScamData();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Enforce Dormancy Action
  const handleMarkDormant = async (accId, accNo) => {
    const reason = window.prompt(`Enter reason for placing Account #${accNo} into Dormant Scam Protection:`, 'Inactivity threshold exceeded; proactive anti-fraud lock');
    if (!reason) return;

    try {
      const res = await api.post(`/admin/accounts/${accId}/mark-dormant`, { reason });
      if (res.data?.success) {
        showNotify('success', `Account #${accNo} placed into DORMANT status under Anti-Scam Shield.`);
        fetchAccounts();
        if (activeTab === 'scam-shield') fetchScamData();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to place account into dormancy.');
    }
  };

  // Freeze / Unfreeze
  const handleFreeze = async (accId, accNo) => {
    const reason = window.prompt(`Enter freeze security reason for Account #${accNo}:`, 'Compliance / AML inquiry');
    if (!reason) return;

    try {
      const res = await api.post(`/admin/accounts/${accId}/freeze`, { reason });
      if (res.data?.success) {
        showNotify('success', `Account #${accNo} successfully FROZEN.`);
        fetchAccounts();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to freeze account.');
    }
  };

  const handleUnfreeze = async (accId, accNo) => {
    if (!window.confirm(`Unfreeze Account #${accNo} and restore ACTIVE status?`)) return;

    try {
      const res = await api.post(`/admin/accounts/${accId}/unfreeze`);
      if (res.data?.success) {
        showNotify('success', `Account #${accNo} restored to ACTIVE.`);
        fetchAccounts();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to unfreeze account.');
    }
  };

  // Review Reactivations
  const [officerReviewModal, setOfficerReviewModal] = useState(null);
  const [officer2faOtp, setOfficer2faOtp] = useState('');
  const [sendingOfficerOtp, setSendingOfficerOtp] = useState(false);
  const [officerOtpStatus, setOfficerOtpStatus] = useState('');

  const handleSendOfficerOtp = async () => {
    setSendingOfficerOtp(true);
    setOfficerOtpStatus('');
    try {
      const res = await api.post('/mail/send-otp', {
        email: 'admin@securebank.com',
        phone: '+91-9900011122',
        name: 'Bank Compliance Officer',
        purpose: 'OFFICER_2FA',
        action: 'Dual 2FA Authorization for Dormant Account #' + (officerReviewModal?.accountNumber || '100100000003')
      });
      if (res.data?.success) {
        setOfficerOtpStatus('✅ Dynamic 2FA Key dispatched to admin@securebank.com! Check SecureMail (/mail).');
        if (res.data.data?.otp) {
          setOfficer2faOtp(res.data.data.otp);
        }
      }
    } catch (err) {
      setOfficerOtpStatus('Failed to send officer 2FA key: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingOfficerOtp(false);
    }
  };

  const confirmOfficerApproval = async () => {
    if (!officer2faOtp || officer2faOtp.trim().length !== 6) {
      showNotify('error', 'Please enter the 6-digit Officer 2FA Security Key.');
      return;
    }
    const note = reviewNotes[officerReviewModal.id] || 'Dual 2FA verified by Bank Compliance Officer.';
    try {
      const res = await api.post(`/admin/reactivations/${officerReviewModal.id}/review`, {
        approved: true,
        reviewNotes: note,
        officer2faOtp: officer2faOtp.trim()
      });
      if (res.data?.success) {
        showNotify('success', 'Reactivation APPROVED under dual 2FA! Customer account restored to ACTIVE with Confirmation OTP.');
        setOfficerReviewModal(null);
        setOfficer2faOtp('');
        setOfficerOtpStatus('');
        fetchReactivations();
        fetchAccounts();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Officer 2FA verification failed.');
    }
  };

  const handleReviewReactivation = async (requestId, approved) => {
    if (approved) {
      const targetReq = reactivations.find(r => r.id === requestId);
      setOfficerReviewModal(targetReq || { id: requestId });
      setOfficer2faOtp('');
      setOfficerOtpStatus('');
      return;
    }

    const note = reviewNotes[requestId] || 'Suspicious request; potential unauthorized access.';
    try {
      const res = await api.post(`/admin/reactivations/${requestId}/review`, {
        approved: false,
        reviewNotes: note
      });
      if (res.data?.success) {
        showNotify('success', 'Reactivation request REJECTED.');
        fetchReactivations();
        fetchAccounts();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to process reactivation review.');
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = 
      (acc.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.phoneNumber || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-[#004c8f]">NetBanking</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Governance & Anti-Scam Shield</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#004c8f] border border-blue-200 uppercase">
              Compliance & Security Console
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 uppercase flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Dormant Scam Defense</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Bank Administration & Dormant Account Scam Shield
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time dormant takeover interception, customer directory management, and regulatory compliance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('scam-shield')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'scam-shield' ? 'bg-[#ed1c24] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Anti-Scam Shield</span>
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'accounts' ? 'bg-[#004c8f] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers & Accounts</span>
          </button>
          <button
            onClick={() => setActiveTab('reactivations')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'reactivations' ? 'bg-[#004c8f] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dormant Approvals ({reactivations.length} Pending)</span>
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'audits' ? 'bg-[#004c8f] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification.message && (
        <div className={`p-3.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: ANTI-SCAM SHIELD & FRAUD DEFENSE
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'scam-shield' && (
        <div className="space-y-5">
          
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Accounts</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{scamStats?.totalAccounts ?? accounts.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Core banking ledger accounts</div>
            </div>

            <div className="bg-white border-2 border-rose-200 rounded-xl p-4 shadow-xs bg-rose-50/30">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center justify-between">
                <span>Dormant Accounts</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <div className="text-2xl font-black text-rose-700 mt-1">{scamStats?.totalDormantAccounts ?? 0}</div>
              <div className="text-[10px] text-rose-700 mt-0.5">Locked under Anti-Scam Shield</div>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs bg-amber-50/30">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Vulnerable Balances</div>
              <div className="text-xl font-black text-amber-900 mt-1">
                ₹{Number(scamStats?.highRiskDormantFunds ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">Dormant funds protected from siphon</div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs bg-emerald-50/30">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Scam Attacks Blocked</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{scamStats?.scamAttemptsBlocked ?? 0}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Unauthorized attempts intercepted</div>
            </div>

            <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-xs bg-purple-50/30">
              <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wide">Active Threat Alerts</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{scamStats?.activeThreatAlerts ?? 0}</div>
              <div className="text-[10px] text-purple-700 mt-0.5">Awaiting security officer review</div>
            </div>
          </div>

          {/* Scam Defense Scanner Action Card */}
          <div className="bg-gradient-to-r from-slate-900 via-[#002e6e] to-[#004c8f] text-white rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase">
                  Automated Threat Scanner
                </span>
                <span className="text-xs text-blue-200 font-mono">Rule: INACTIVITY &gt; 90 DAYS = SCAM LOCK</span>
              </div>
              <h2 className="text-lg font-bold">Dormant Account Scam Stop Scanner</h2>
              <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                Executes an automated sweep of all core banking accounts. Any account with zero customer-initiated activity for over 90 days is automatically placed under the <strong>Dormant Scam Shield</strong>, freezing debit channels to stop cybercriminals from siphoning unattended balances.
              </p>
            </div>

            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="shrink-0 px-5 py-2.5 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Scanning Accounts...' : 'Execute Anti-Scam Scan Now'}</span>
            </button>
          </div>

          {/* Intercepted Threat Alerts Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Intercepted Scam Threats & Security Events ({securityEvents.length})</span>
              </div>
              <button
                onClick={fetchScamData}
                className="text-[#004c8f] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingScam ? 'animate-spin' : ''}`} />
                <span>Refresh Threats</span>
              </button>
            </div>

            {securityEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700">No Active Scam Threats Detected</p>
                <p className="text-slate-400 mt-1">Dormant Account Scam Shield is actively safeguarding all accounts.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Detected At</th>
                      <th className="py-3 px-4">Threat Type</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Actor / Account</th>
                      <th className="py-3 px-4">Details & Interception Context</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {securityEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {evt.detectedAt ? new Date(evt.detectedAt).toLocaleString('en-IN') : 'Just now'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {evt.eventType}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            evt.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : evt.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {evt.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {evt.username || 'EXTERNAL / API'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md leading-relaxed text-[11px]">
                          {evt.description}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            evt.status === 'RESOLVED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {evt.status === 'OPEN' ? (
                            <button
                              onClick={() => handleResolveAlert(evt.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded font-semibold text-[11px] transition-all"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Cleared</span>
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
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: CUSTOMERS & BANK ACCOUNTS DIRECTORY (CRUD)
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4">
          
          {/* Action Toolbar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, account #, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-64 focus:outline-none focus:border-[#004c8f] bg-white"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs bg-white focus:outline-none focus:border-[#004c8f]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DORMANT">DORMANT (Protected)</option>
                  <option value="FROZEN">FROZEN</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={fetchAccounts}
                className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 bg-white rounded-lg text-slate-700 font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-1.5 bg-[#004c8f] hover:bg-[#002e6e] text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Accounts & Customers Table */}
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Account Number</th>
                  <th className="py-3 px-3">Customer Details</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Balance (INR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Scam Risk Assessment</th>
                  <th className="py-3 px-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      <div>{acc.accountNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{acc.ifscCode}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{acc.customerName}</span>
                        {acc.username && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-normal">
                            @{acc.username}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{acc.email} · {acc.phoneNumber}</div>
                      {acc.address && <div className="text-[10px] text-slate-400 truncate max-w-xs">{acc.address}</div>}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-semibold">
                      {acc.accountType}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{Number(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        acc.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : acc.status === 'DORMANT'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {acc.status === 'DORMANT' ? '🛡️ DORMANT' : acc.status}
                      </span>
                    </td>

                    {/* Scam Risk Assessment Badge */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          acc.scamRiskLevel === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : acc.scamRiskLevel === 'HIGH'
                            ? 'bg-orange-500 text-white'
                            : acc.scamRiskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {acc.scamRiskLevel} RISK
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 text-center truncate max-w-[140px]" title={acc.scamRiskReason}>
                          {acc.scamRiskReason || `${acc.daysInactive}d inactive`}
                        </span>
                      </div>
                    </td>

                    {/* Actions Toolbar */}
                    <td className="py-3.5 px-3 text-right space-x-1 whitespace-nowrap">
                      {/* Edit Details: Prohibited for DORMANT accounts to prevent employee tampering */}
                      {acc.status === 'DORMANT' ? (
                        <button
                          disabled
                          className="p-1.5 rounded bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed inline-flex items-center"
                          title="🔒 Tamper-Proof: Dormant accounts cannot be altered by bank personnel. Customer must login and perform Re-KYC."
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openEditModal(acc)}
                          className="p-1.5 rounded hover:bg-slate-100 text-blue-600 border border-slate-200"
                          title="Edit Customer Details (Requires Customer Consent OTP)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Enforce Dormancy (Scam Lock) - only for ACTIVE accounts */}
                      {acc.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleMarkDormant(acc.id, acc.accountNumber)}
                          className="p-1.5 rounded hover:bg-rose-50 text-rose-700 border border-rose-200"
                          title="Place into Dormant Scam Protection (for long-inactive accounts)"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* For DORMANT accounts: Direct activation blocked - Customer must apply */}
                      {acc.status === 'DORMANT' && (
                        (() => {
                          const hasPending = reactivations.some(r => String(r.accountNumber) === String(acc.accountNumber));
                          return (
                            <button
                              onClick={() => {
                                if (hasPending) {
                                  setActiveTab('reactivations');
                                  showNotify('success', `Found pending reactivation for Account #${acc.accountNumber}. Review and approve below.`);
                                } else {
                                  showNotify('error', `Account #${acc.accountNumber} cannot be directly activated by an officer. Under anti-scam rules, the customer must first apply for Re-KYC Reactivation.`);
                                }
                              }}
                              className={`p-1.5 rounded border text-xs font-semibold inline-flex items-center gap-1 transition-all ${
                                hasPending 
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 animate-pulse' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              }`}
                              title={hasPending ? "Customer submitted Re-KYC request! Click to Review & Approve" : "Cannot directly activate — customer must apply for Re-KYC first to prevent officer scam"}
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              <span className="text-[10px] hidden sm:inline">
                                {hasPending ? 'Approve Re-KYC' : 'Customer Must Apply'}
                              </span>
                            </button>
                          );
                        })()
                      )}

                      {/* Freeze / Unfreeze — only for ACTIVE accounts */}
                      {acc.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleFreeze(acc.id, acc.accountNumber)}
                          className="p-1.5 rounded hover:bg-amber-50 text-amber-700 border border-amber-200"
                          title="Freeze Account (Compliance / AML hold)"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      ) : acc.status === 'FROZEN' ? (
                        <button
                          onClick={() => handleUnfreeze(acc.id, acc.accountNumber)}
                          className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 border border-emerald-200"
                          title="Unfreeze Account"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      ) : null /* DORMANT: no freeze button */}

                      {/* Remove / Delete Customer */}
                      <button
                        onClick={() => openDeleteModal(acc)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600 border border-red-200"
                        title="Delete / Remove Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: DORMANT REACTIVATION APPROVALS
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reactivations' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Dormant Re-KYC Verification Requests ({showAllHistory ? allReactivations.length + ' total' : reactivations.length + ' pending'})</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle pending / all history */}
              <div className="flex bg-slate-200 p-0.5 rounded-md">
                <button
                  onClick={() => setShowAllHistory(false)}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition-all ${
                    !showAllHistory ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Pending ({reactivations.length})
                </button>
                <button
                  onClick={() => setShowAllHistory(true)}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition-all ${
                    showAllHistory ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  All History ({allReactivations.length})
                </button>
              </div>
              <button
                onClick={fetchReactivations}
                className="text-[#004c8f] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReactivations ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Determine which list to show */}
          {(() => {
            const displayList = showAllHistory ? allReactivations : reactivations;
            if (displayList.length === 0) {
              return (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">
                    {showAllHistory ? 'No Re-KYC Requests Yet' : '✅ No Pending Reactivations'}
                  </p>
                  <p className="text-slate-400 mt-1">
                    {showAllHistory
                      ? 'No dormant account reactivation requests have been submitted yet.'
                      : 'All dormant customer re-verification requests have been processed. Switch to "All History" to see past decisions.'}
                  </p>
                </div>
              );
            }
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Account / Customer</th>
                      <th className="py-3 px-4">KYC Credentials & Mode</th>
                      <th className="py-3 px-4">Customer Justification</th>
                      {showAllHistory ? (
                        <th className="py-3 px-4 text-center">Decision & Notes</th>
                      ) : (
                        <>
                          <th className="py-3 px-4">Officer Review Notes</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {displayList.map((r) => (
                      <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${
                        r.status === 'APPROVED' ? 'bg-emerald-50/30' :
                        r.status === 'REJECTED' ? 'bg-red-50/20' : ''
                      }`}>
                        <td className="py-3 px-4 font-mono font-bold text-[#004c8f]">
                          <div>{r.requestReference}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {r.requestedAt ? new Date(r.requestedAt).toLocaleString('en-IN') : 'Just now'}
                          </div>
                          {/* Status badge for history view */}
                          <span className={`inline-block mt-1 text-[10px] font-black px-1.5 py-0.5 rounded ${
                            r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            r.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          }`}>
                            {r.status === 'APPROVED' ? '✅ APPROVED → ACTIVE' :
                             r.status === 'REJECTED' ? '❌ REJECTED' : '⏳ PENDING REVIEW'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800">
                          <div className="font-bold text-slate-900">{r.customerName}</div>
                          <div className="text-[11px] text-slate-500">A/C: {r.accountNumber}</div>
                          {r.status === 'APPROVED' && (
                            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              ✅ Account restored to ACTIVE
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-[11px] font-semibold text-slate-900">
                              Aadhaar: <span className="text-[#004c8f]">{r.aadhaar ? (r.aadhaar.length > 8 ? `XXXX-XXXX-${r.aadhaar.slice(-4)}` : r.aadhaar) : 'XXXX-XXXX-9012'}</span>
                              <span className="ml-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">2FA OK</span>
                            </span>
                            <span className="font-mono text-[11px] text-slate-700">
                              PAN: <strong className="text-slate-900">{r.pan || 'ABCDE1234F'}</strong>
                            </span>
                            <span className="text-[10px] text-purple-700 font-semibold mt-0.5">
                              {r.kycMode === 'BRANCH_IN_PERSON' ? (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                                  🏛️ Branch Visit: {r.branch || 'Mumbai Main Branch'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                                  🌐 Online e-KYC (Aadhaar & PAN 2FA)
                                </span>
                              )}
                            </span>
                            {r.hasDetailChanges && (
                              <div className="mt-1.5 p-1.5 rounded bg-amber-50 border border-amber-300 text-[10px] text-amber-900 font-bold space-y-0.5">
                                <div className="text-amber-800 flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                                  <span>⚠️ CONTACT DETAILS UPDATED:</span>
                                </div>
                                {r.newEmail && <div>• New Email: <span className="font-mono text-blue-700">{r.newEmail}</span></div>}
                                {r.newPhone && <div>• New Phone: <span className="font-mono">{r.newPhone}</span></div>}
                                {r.newAddress && <div>• New Address: <span>{r.newAddress}</span></div>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs text-[11px] leading-relaxed" title={r.reason}>
                          {r.reason || 'Salary credit & routine payments'}
                        </td>

                        {/* History mode: show decision info */}
                        {showAllHistory ? (
                          <td className="py-3 px-4 text-[11px]">
                            {r.status === 'APPROVED' ? (
                              <div className="space-y-0.5 text-emerald-800">
                                <div className="font-bold">Approved by: {r.reviewedBy || 'admin'}</div>
                                <div className="text-[10px] text-slate-500">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('en-IN') : ''}</div>
                                {r.reviewNotes && <div className="text-emerald-700 italic">{r.reviewNotes}</div>}
                              </div>
                            ) : r.status === 'REJECTED' ? (
                              <div className="space-y-0.5 text-red-800">
                                <div className="font-bold">Rejected by: {r.reviewedBy || 'admin'}</div>
                                <div className="text-[10px] text-slate-500">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('en-IN') : ''}</div>
                                {r.reviewNotes && <div className="text-red-700 italic">{r.reviewNotes}</div>}
                              </div>
                            ) : (
                              <span className="text-amber-700 font-semibold">Awaiting officer review...</span>
                            )}
                          </td>
                        ) : (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                placeholder="Audit verification notes..."
                                value={reviewNotes[r.id] || ''}
                                onChange={(e) => setReviewNotes({ ...reviewNotes, [r.id]: e.target.value })}
                                className="border border-slate-300 rounded px-2 py-1 text-xs w-44 focus:outline-none focus:border-[#004c8f]"
                              />
                            </td>
                            <td className="py-3 px-4 text-center space-x-1.5">
                              <button
                                onClick={() => handleReviewReactivation(r.id, true)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Authorize Re-KYC under Officer Dual 2FA — Account becomes ACTIVE"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Authorize (2FA)</span>
                              </button>
                              <button
                                onClick={() => handleReviewReactivation(r.id, false)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}


      {/* ════════════════════════════════════════════════════════════════════════
          TAB 4: COMPLIANCE AUDIT TRAIL
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audits' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Statutory Compliance & Security Audit Logs</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAudits(auditPage)}
                className="text-[#004c8f] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudits ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto px-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-mono text-[11px]">
                {audits.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {log.username || 'SYSTEM'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#004c8f]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {log.entityType} ({log.entityId || 'N/A'})
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans text-xs max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Pagination */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
            <span>Page {auditPage + 1} of {totalAuditPages}</span>
            <div className="space-x-1.5">
              <button
                disabled={auditPage === 0 || loadingAudits}
                onClick={() => fetchAudits(auditPage - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={auditPage + 1 >= totalAuditPages || loadingAudits}
                onClick={() => fetchAudits(auditPage + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: ADD NEW CUSTOMER
      ════════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#004c8f] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Customer</h3>
                  <p className="text-[11px] text-slate-500">Manually provision customer profile and bank account</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@securebank.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+919876543210"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={createForm.dateOfBirth}
                    onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Residential Address *</label>
                <textarea
                  required
                  rows="2"
                  placeholder="Street, locality, city, state, pincode"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Type *</label>
                  <select
                    value={createForm.accountType}
                    onChange={(e) => setCreateForm({ ...createForm, accountType: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  >
                    <option value="SAVINGS">SAVINGS ACCOUNT</option>
                    <option value="CURRENT">CURRENT ACCOUNT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Deposit (₹) *</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={createForm.initialDeposit}
                    onChange={(e) => setCreateForm({ ...createForm, initialDeposit: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-[#004c8f] hover:bg-[#002e6e] text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
                >
                  {submittingAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: EDIT CUSTOMER DETAILS
      ════════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Customer Details</h3>
                  <p className="text-[11px] text-slate-500">Update personal and KYC contact information</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4 mt-4 text-xs">
              {/* Anti-Employee Scam Banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Anti-Employee Tampering Protection</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  To prevent rogue bank personnel from silently altering customer phone or email details to hijack accounts, customer authorization is enforced.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address *</label>
                <textarea
                  required
                  rows="2"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#004c8f]"
                ></textarea>
              </div>

              {/* Customer Consent OTP Input */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-800 text-xs">
                    Customer Authorization OTP <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, customerOtp: '654321' })}
                    className="text-[10px] text-[#004c8f] hover:underline font-bold cursor-pointer"
                  >
                    Auto-fill Demo OTP (654321)
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="654321"
                    value={editForm.customerOtp || ''}
                    onChange={(e) => setEditForm({ ...editForm, customerOtp: e.target.value })}
                    className="w-44 px-3 py-2 text-base font-mono tracking-widest font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none text-center bg-white"
                  />
                  <div className="flex-1 text-[11px] text-slate-600 flex items-center leading-tight">
                    Dispatched to customer's mobile to authorize employee changes.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 bg-[#004c8f] hover:bg-[#002e6e] text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Verify OTP & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: DELETE / REMOVE CUSTOMER CONFIRMATION
      ════════════════════════════════════════════════════════════════════════ */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Permanently Remove Customer?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to remove customer <strong className="text-slate-800">{selectedCustomer.customerName}</strong> and Account <strong className="font-mono text-slate-800">#{selectedCustomer.accountNumber}</strong>?
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 text-[11px] text-red-800">
                  ⚠️ This action will delete the customer profile, account, ledger references, and login credentials. This cannot be undone.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleDeleteCustomer}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5"
              >
                {submittingAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Customer Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 4: OFFICER DUAL 2FA REACTIVATION AUTHORIZATION
      ════════════════════════════════════════════════════════════════════════ */}
      {officerReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border-2 border-emerald-500 animate-in fade-in zoom-in-95 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Compliance Officer Dual 2FA Authorization
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ref: {officerReviewModal.requestReference} · Account: #{officerReviewModal.accountNumber}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setOfficerReviewModal(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anti-Scam Advisory */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
              <strong className="block font-bold">🛡️ Regulatory Dual 2FA Protocol</strong>
              <p className="text-[11px] leading-relaxed">
                Bank officers cannot unilaterally reactivate dormant accounts. In accordance with anti-fraud rules, approval requires verifying an independent 6-digit Officer Security Key sent to compliance headquarters (<code className="font-mono text-emerald-800">admin@securebank.com</code>).
              </p>
            </div>

            {/* Request Summary & Changes Comparison */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] block">CUSTOMER NAME</span>
                  <strong className="text-slate-800">{officerReviewModal.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">JUSTIFICATION REASON</span>
                  <span className="text-slate-700 italic">{officerReviewModal.reason || 'Routine reactivation'}</span>
                </div>
              </div>

              {officerReviewModal.hasDetailChanges && (
                <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-300 text-[11px] text-amber-950 space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Customer Detail Modifications to Apply:</span>
                  </div>
                  {officerReviewModal.newEmail && <div>• New Email: <strong className="font-mono text-blue-700">{officerReviewModal.newEmail}</strong></div>}
                  {officerReviewModal.newPhone && <div>• New Phone: <strong className="font-mono">{officerReviewModal.newPhone}</strong></div>}
                  {officerReviewModal.newAddress && <div>• New Address: <span>{officerReviewModal.newAddress}</span></div>}
                </div>
              )}
            </div>

            {/* 2FA Key Input Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800">
                  Officer 2FA Security Key <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendOfficerOtp}
                    disabled={sendingOfficerOtp}
                    className="px-3 py-1 bg-[#004c8f] hover:bg-[#003666] disabled:bg-slate-300 text-white rounded font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{sendingOfficerOtp ? 'Sending Key...' : 'Send Key to admin@securebank.com'}</span>
                  </button>

                  <a
                    href="/mail"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#004c8f] rounded font-bold text-[11px] flex items-center gap-1 border border-blue-200"
                    title="Open SecureMail Webmail in New Tab"
                  >
                    <span>Webmail (/mail)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {officerOtpStatus && (
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  {officerOtpStatus}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  maxLength="6"
                  value={officer2faOtp}
                  onChange={(e) => setOfficer2faOtp(e.target.value)}
                  placeholder="999888"
                  className="w-48 px-3 py-2 text-lg font-mono tracking-widest font-black border-2 border-slate-300 rounded-lg focus:border-emerald-600 focus:outline-none text-center bg-slate-50"
                />
                <div className="text-[11px] text-slate-500">
                  Enter dynamic key from SecureMail or master officer fallback: <code className="font-mono font-bold text-emerald-700">999888</code>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setOfficerReviewModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmOfficerApproval}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Verify 2FA & Activate Account</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
