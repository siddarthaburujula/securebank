import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  CreditCard, 
  Send, 
  Users, 
  Receipt, 
  FileText, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw,
  Wallet,
  AlertTriangle,
  AlertCircle,
  Download,
  Building,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/accounts/dashboard');
      if (res.data?.success) {
        setDashboard(res.data.data);
        if (res.data.data.accountStatus) {
          updateUserProfile({ accountStatus: res.data.data.accountStatus });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load banking dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const copyAccountNumber = (accNo) => {
    navigator.clipboard.writeText(accNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = async () => {
    try {
      const res = await api.get('/transactions/statement/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SecureBank_Statement_${dashboard?.accountNumber || 'Acc'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Could not download statement CSV: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#004c8f]/20 border-t-[#004c8f] rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-sm">Accessing Core Banking Ledger from MySQL...</p>
        </div>
      </div>
    );
  }

  const rawBalance = Number(dashboard?.availableBalance ?? dashboard?.balance ?? 0);
  const transactions = dashboard?.recentTransactions || [];
  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'DEBIT') return t.entryType === 'DEBIT';
    if (filterType === 'CREDIT') return t.entryType === 'CREDIT';
    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* 1. Official NetBanking Welcome Bar & Ticker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded bg-blue-100 text-[#004c8f]">
              Preferred Banking
            </span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-600">Last login: Today, 11:42 PM IST</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Welcome, {dashboard?.customerName || user?.fullName || user?.username}
          </h1>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          title="Refresh real MySQL account balance"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#004c8f]' : ''}`} />
          <span>Refresh Balance</span>
        </button>
      </div>

      {/* System Error / Advisory Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-xs text-red-950 flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-900">Account Notification</div>
            <div className="mt-0.5 leading-relaxed">{error}</div>
          </div>
        </div>
      )}

      {/* 2. Urgent Dormant Account Anti-Scam Shield Banner (if DORMANT) */}
      {dashboard?.accountStatus === 'DORMANT' && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-rose-950 shadow-sm animate-pulse-subtle">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-rose-950">
                  🛡️ ANTI-SCAM PROTOCOL ACTIVE: Account Protected Under Dormancy Lock
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 uppercase">
                  Scam Shield Engaged
                </span>
              </div>
              <p className="text-xs text-rose-900 mt-1 leading-relaxed max-w-3xl">
                Because this account has been inactive for over 90 days, our <strong>Anti-Scam Defense System</strong> has locked outgoing transfers, debits, and bill payments. This stops unauthorized account takeover scams, cyber fraud, and mule activity. To unlock your account, perform multi-factor Re-KYC verification.
              </p>
            </div>
          </div>
          <Link
            to="/dormant"
            className="shrink-0 px-4 py-2.5 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <span>Complete Re-KYC & Unlock</span>
          </Link>
        </div>
      )}

      {/* 3. Primary HDFC-Style Savings Account Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Card Header Strip */}
        <div className="bg-[#004c8f] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-blue-200" />
            <span className="font-bold text-sm tracking-wide">
              {dashboard?.accountType || 'SAVINGS'} ACCOUNT — PREFERRED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
              dashboard?.accountStatus === 'ACTIVE'
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 text-amber-950'
            }`}>
              ● {dashboard?.accountStatus || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Balance Block */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Net Available Balance
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-slate-400 hover:text-slate-700 p-0.5"
                  title={showBalance ? "Hide Balance" : "Show Balance"}
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-[#002e6e]">₹</span>
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#002e6e] tracking-tight">
                  {showBalance 
                    ? rawBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '••,•••.••'}
                </span>
                <span className="text-xs text-slate-500 font-medium">INR (Available for transfer)</span>
              </div>
            </div>

            {/* Account Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Account Number:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <strong className="font-mono text-sm text-slate-800">
                    {showFullAccount ? dashboard?.accountNumber : (dashboard?.maskedAccountNumber ?? '•••• •••• ••••')}
                  </strong>
                  <button
                    onClick={() => setShowFullAccount(!showFullAccount)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title={showFullAccount ? "Mask" : "Unmask"}
                  >
                    {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copyAccountNumber(dashboard?.accountNumber || '')}
                    className="text-slate-400 hover:text-[#004c8f] p-0.5"
                    title="Copy"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">IFSC Code:</span>
                <strong className="font-mono text-sm text-slate-800 block mt-0.5">
                  {dashboard?.ifscCode || 'SECURE000001'}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block font-medium">Branch Location:</span>
                <span className="text-slate-800 font-semibold block mt-0.5">
                  Central Banking Unit, Mumbai
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons (HDFC Style) */}
          <div className="flex flex-col gap-2.5 lg:border-l lg:border-slate-100 lg:pl-6">
            <Link
              to="/transfer"
              className="w-full py-2.5 px-4 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Transfer Funds (IMPS / NEFT)</span>
            </Link>

            <Link
              to="/bills"
              className="w-full py-2.5 px-4 rounded-lg bg-[#004c8f] hover:bg-[#003666] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Pay Utility Bill</span>
            </Link>

            <button
              onClick={handleDownloadCsv}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download Statement (CSV)</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. Financial Statistics Grid (Credits / Debits) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Inward Credits</div>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
              +₹{Number(dashboard?.totalCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Outward Debits</div>
            <div className="text-lg font-bold font-mono text-[#ed1c24] mt-0.5">
              -₹{Number(dashboard?.totalDebits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-red-50 text-[#ed1c24] flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Posted Transactions</div>
            <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
              {dashboard?.totalTransactions || 0} Entries
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#004c8f] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5. Recent Passbook Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Transactions (Passbook)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time double-entry ledger postings with verified UTRs</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-md transition-all ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('CREDIT')}
                className={`px-3 py-1 rounded-md transition-all ${filterType === 'CREDIT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Credits (CR)
              </button>
              <button
                onClick={() => setFilterType('DEBIT')}
                className={`px-3 py-1 rounded-md transition-all ${filterType === 'DEBIT' ? 'bg-[#ed1c24] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Debits (DR)
              </button>
            </div>

            <Link
              to="/statements"
              className="text-xs font-bold text-[#004c8f] hover:underline px-2 py-1"
            >
              View Full Statement →
            </Link>
          </div>
        </div>

        {/* Table Content */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No transactions found for this selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Narration / Counterparty</th>
                  <th className="py-3 px-4">Ref / UTR Number</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Withdrawal (Dr)</th>
                  <th className="py-3 px-4 text-right">Deposit (Cr)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredTransactions.map((tx, idx) => {
                  const isDebit = tx.entryType === 'DEBIT';
                  const formattedDate = tx.initiatedAt 
                    ? new Date(tx.initiatedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '—';

                  return (
                    <tr key={tx.referenceNumber || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {tx.counterpartyName || 'SecureBank'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {tx.description || 'Fund Transfer'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {tx.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          {tx.transferType || 'IMPS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#ed1c24] whitespace-nowrap">
                        {isDebit ? `-₹${Number(tx.amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {!isDebit ? `+₹${Number(tx.amount).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
