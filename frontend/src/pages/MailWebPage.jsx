import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Inbox, 
  ShieldAlert, 
  KeyRound, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Check, 
  Copy, 
  PlusCircle, 
  Trash2, 
  CheckCheck, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle,
  Building,
  User,
  Clock,
  Send,
  X
} from 'lucide-react';
import axios from 'axios';

export const MailWebPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState('ALL');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Provisioning Modal State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newAccountType, setNewAccountType] = useState('CUSTOMER');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // Fetch Accounts
  const fetchAccounts = async () => {
    try {
      const res = await axios.get('/api/mail/accounts');
      if (res.data?.success) {
        setAccounts(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch mail accounts:', err);
    }
  };

  // Fetch Messages for Selected Mailbox
  const fetchMessages = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await axios.get(`/api/mail/inbox?email=${selectedEmail}`);
      if (res.data?.success) {
        const msgs = res.data.data || [];
        setMessages(msgs);
        setLastSyncTime(new Date());
        
        // Auto-select latest message if none selected or if previous selected message was updated
        setSelectedMessage(prev => {
          if (!prev && msgs.length > 0) return msgs[0];
          if (prev) {
            const found = msgs.find(m => m.id === prev.id);
            return found || msgs[0] || null;
          }
          return null;
        });
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAccounts();
    fetchMessages(true);
  }, [selectedEmail]);

  // Real-time Polling every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(false);
      fetchAccounts();
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedEmail]);

  // Mark Message as Read
  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      try {
        await axios.post(`/api/mail/mark-read/${msg.id}`);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
        fetchAccounts();
      } catch (err) {
        console.error('Failed to mark message read:', err);
      }
    }
  };

  // Delete Message
  const handleDeleteMessage = async (id) => {
    try {
      await axios.delete(`/api/mail/${id}`);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      fetchAccounts();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Copy OTP Code
  const copyOtpToClipboard = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Handle Add Account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!newEmail || !newEmail.includes('@')) {
      setModalError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await axios.post('/api/mail/accounts', {
        email: newEmail.trim().toLowerCase(),
        displayName: newDisplayName.trim() || newEmail.split('@')[0],
        accountType: newAccountType
      });

      if (res.data?.success) {
        setModalSuccess(`Mail account "${newEmail}" successfully provisioned!`);
        await fetchAccounts();
        setSelectedEmail(newEmail.trim().toLowerCase());
        setTimeout(() => {
          setShowAddAccountModal(false);
          setNewEmail('');
          setNewDisplayName('');
          setModalSuccess('');
        }, 1200);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create mail account.');
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchQuery === '' || 
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.otpCode && msg.otpCode.includes(searchQuery));

    const matchesCategory = categoryFilter === 'ALL' || msg.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      
      {/* 1. Official Corporate Webmail Header */}
      <header className="bg-[#002e6e] text-white border-b-4 border-[#ed1c24] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004c8f] to-[#001f3f] flex items-center justify-center border border-white/20 shadow-inner">
              <Mail className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight">
                  Secure<span className="text-red-400">Mail</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30 font-bold">
                  Official Webmail
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Live OTP & Security Communications Gateway
              </p>
            </div>
          </div>

          {/* Real-time Indicator & Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15 text-xs text-blue-100 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Syncing: <strong>{lastSyncTime.toLocaleTimeString()}</strong></span>
            </div>

            <button
              onClick={() => fetchMessages(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh Inbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowAddAccountModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Mailbox</span>
            </button>

            <a
              href="/login"
              className="px-3.5 py-1.5 rounded-lg bg-white text-[#002e6e] hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to NetBanking</span>
            </a>
          </div>

        </div>
      </header>

      {/* 2. Main Three-Pane Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
        
        {/* Left Column: Accounts & Folders (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Account Selector Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span>Mail Accounts</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {accounts.length} Active
              </span>
            </div>

            <div className="space-y-1.5">
              {/* All Accounts Button */}
              <button
                onClick={() => setSelectedEmail('ALL')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  selectedEmail === 'ALL'
                    ? 'bg-[#004c8f] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Inbox className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Global Feed (All Inboxes)</span>
                </div>
              </button>

              {/* Individual Account List */}
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedEmail(acc.email)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedEmail === acc.email
                      ? 'bg-[#004c8f] text-white shadow-xs font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold truncate text-[11px]">{acc.displayName}</div>
                    <div className={`truncate text-[10px] font-mono ${
                      selectedEmail === acc.email ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      {acc.email}
                    </div>
                  </div>
                  {acc.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500 text-white shrink-0">
                      {acc.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddAccountModal(true)}
              className="w-full mt-2 py-1.5 border border-dashed border-blue-300 hover:border-blue-600 text-blue-700 hover:text-blue-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New Email</span>
            </button>
          </div>

          {/* Quick Filter Categories */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Message Filter
            </span>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setCategoryFilter('ALL')}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                  categoryFilter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>All Messages</span>
                <span className="text-[10px] opacity-70">{messages.length}</span>
              </button>
              <button
                onClick={() => setCategoryFilter('OTP_VERIFICATION')}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                  categoryFilter === 'OTP_VERIFICATION' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                  <span>OTP Codes</span>
                </span>
                <span className="text-[10px] opacity-70">
                  {messages.filter(m => m.category === 'OTP_VERIFICATION').length}
                </span>
              </button>
              <button
                onClick={() => setCategoryFilter('SECURITY_ALERT')}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                  categoryFilter === 'SECURITY_ALERT' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Fraud & Security Alerts</span>
                </span>
                <span className="text-[10px] opacity-70">
                  {messages.filter(m => m.category === 'SECURITY_ALERT').length}
                </span>
              </button>
            </div>
          </div>

          {/* Real-time Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1 text-blue-950">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Real-Time OTP Dispatch</span>
            </div>
            <p className="text-blue-800 leading-tight">
              Whenever you request an Aadhaar OTP, Re-KYC verification, or profile edit in NetBanking, the dynamic 6-digit OTP arrives here instantly.
            </p>
          </div>

        </div>

        {/* Middle Column: Message List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Search Header */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search subject, email or OTP..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Showing <strong>{filteredMessages.length}</strong> emails</span>
              <span className="font-mono text-[10px] uppercase text-slate-400">
                {selectedEmail === 'ALL' ? 'All Mailboxes' : selectedEmail}
              </span>
            </div>
          </div>

          {/* Email Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[700px]">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Mail className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No emails received for this mailbox yet.</p>
                <p className="text-[11px] text-slate-400">
                  Trigger an OTP or action from the banking portal to see messages arrive.
                </p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isSelected = selectedMessage?.id === msg.id;
                const isAlert = msg.category === 'SECURITY_ALERT';
                const isOtp = msg.category === 'OTP_VERIFICATION';

                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 transition-colors cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-l-[#004c8f]'
                        : msg.isRead
                        ? 'hover:bg-slate-50'
                        : 'bg-white hover:bg-slate-50 font-semibold border-l-4 border-l-amber-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="truncate text-xs font-bold text-slate-900">
                        {msg.recipientName || msg.recipientEmail}
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>

                    <div className="text-xs text-slate-800 font-medium truncate mb-1">
                      {msg.subject}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        {isAlert ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            🚨 SECURITY ALERT
                          </span>
                        ) : isOtp ? (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#004c8f] border border-blue-200">
                            🔐 DYNAMIC OTP
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ℹ️ NOTIFICATION
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {msg.recipientEmail}
                        </span>
                      </div>

                      {msg.otpCode && (
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                          {msg.otpCode}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Message Reading Pane (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              
              {/* Message Header Bar */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-blue-100 text-[#002e6e]">
                      {selectedMessage.category || 'EMAIL'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref #{selectedMessage.id}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    {selectedMessage.subject}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">FROM</span>
                      <strong className="text-slate-800">{selectedMessage.sender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DELIVERED TO</span>
                      <strong className="text-slate-800 font-mono">{selectedMessage.recipientEmail}</strong>
                    </div>
                  </div>
                </div>

                {/* If Message contains OTP: High Visibility Callout Card */}
                {selectedMessage.otpCode && (
                  <div className="bg-gradient-to-r from-blue-900 to-[#002e6e] text-white p-4 rounded-xl border-2 border-amber-400 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Dynamic Authentication Key</span>
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                        Active & Valid
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <div className="text-3xl font-black font-mono tracking-widest text-amber-400">
                        {selectedMessage.otpCode}
                      </div>

                      <button
                        onClick={() => copyOtpToClipboard(selectedMessage.otpCode)}
                        className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        {copiedOtp ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy OTP</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-blue-200 leading-tight">
                      Copy this dynamic code and paste it into the SecureBank NetBanking authentication prompt.
                    </p>
                  </div>
                )}
              </div>

              {/* Rendered HTML Email Content */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[600px] bg-white">
                <div 
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.content }}
                />
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Select an email to view full content</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Incoming OTPs and fraud alerts will be displayed here in full corporate bank formatting.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 3. Provision New Email Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Provision New Mailbox</h3>
              </div>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Create a custom mailbox address. Any OTPs, KYC changes, or banking alerts routed to this email will appear in this mailbox in real time.
            </p>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {modalError}
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-bold">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. customer_new@securebank.com"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Display / Account Holder Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mailbox Role
                </label>
                <select
                  value={newAccountType}
                  onChange={e => setNewAccountType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CUSTOMER">Customer Mailbox</option>
                  <option value="ADMIN">Bank Compliance / Officer Mailbox</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#004c8f] hover:bg-[#003666] text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Create Mailbox
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
