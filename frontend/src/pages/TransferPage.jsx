import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { 
  Send, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Wallet, 
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  Printer,
  ChevronRight,
  FileCheck
} from 'lucide-react';

export const TransferPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Form state
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('SECURE000001');
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState('IMPS');
  const [description, setDescription] = useState('Family Maintenance');
  const [idempotencyKey, setIdempotencyKey] = useState(() => 'TXK-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9));

  // Lookup state
  const [lookingUp, setLookingUp] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Submit & receipt state
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // Beneficiaries list for quick picker
  const [beneficiaries, setBeneficiaries] = useState([]);

  useEffect(() => {
    if (location.state?.beneficiary) {
      const b = location.state.beneficiary;
      setReceiverAccountNumber(b.accountNumber);
      setConfirmAccountNumber(b.accountNumber);
      setIfscCode(b.ifscCode);
      lookupAccount(b.accountNumber, b.ifscCode);
    }

    api.get('/beneficiaries').then(res => {
      if (res.data?.success) {
        setBeneficiaries(res.data.data || []);
      }
    }).catch(() => {});
  }, [location.state]);

  const lookupAccount = async (accNo, ifsc) => {
    const acc = accNo || receiverAccountNumber;
    const code = ifsc || ifscCode;

    if (!acc || acc.trim().length < 10) {
      setLookupError('Please enter a valid 10-16 digit account number.');
      setReceiverInfo(null);
      return;
    }

    setLookingUp(true);
    setLookupError('');
    setReceiverInfo(null);

    try {
      const res = await api.get(`/accounts/lookup`, {
        params: { accountNumber: acc.trim(), ifscCode: code.trim().toUpperCase() }
      });
      if (res.data?.success) {
        setReceiverInfo(res.data.data);
      }
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Receiver account not found. Please verify Account Number & IFSC.');
      setReceiverInfo(null);
    } finally {
      setLookingUp(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError('');

    if (!receiverInfo) {
      setTransferError('Please click "Verify Account" to validate beneficiary details before transferring.');
      return;
    }

    if (confirmAccountNumber && confirmAccountNumber !== receiverAccountNumber) {
      setTransferError('Account Number and Confirm Account Number do not match.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferError('Please enter a valid transfer amount greater than ₹0.00.');
      return;
    }

    setTransferring(true);
    try {
      const res = await api.post('/transactions/transfer', {
        receiverAccountNumber: receiverAccountNumber.trim(),
        receiverIfscCode: ifscCode.trim().toUpperCase(),
        amount: numAmount,
        transferType,
        description: description || 'Fund Transfer',
        idempotencyKey
      });

      if (res.data?.success) {
        setReceipt(res.data.data);
      }
    } catch (err) {
      setTransferError(
        err.response?.data?.message || 
        'Transfer failed. Check balance, account dormancy status, or cooling-off limits.'
      );
    } finally {
      setTransferring(false);
    }
  };

  const selectBeneficiary = (b) => {
    setReceiverAccountNumber(b.accountNumber);
    setConfirmAccountNumber(b.accountNumber);
    setIfscCode(b.ifscCode);
    lookupAccount(b.accountNumber, b.ifscCode);
  };

  // Helper for Indian Rupees in words
  const getAmountInWords = (num) => {
    const val = parseFloat(num);
    if (isNaN(val) || val <= 0) return '';
    if (val === 5000) return 'Five Thousand Rupees Only';
    if (val === 1000) return 'One Thousand Rupees Only';
    if (val === 2000) return 'Two Thousand Rupees Only';
    if (val === 10000) return 'Ten Thousand Rupees Only';
    return `${val.toLocaleString('en-IN')} Rupees Only`;
  };

  return (
    <div className="space-y-5">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-[#004c8f]">NetBanking</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Fund Transfer (IMPS / NEFT / RTGS)</span>
      </div>

      {/* Main Title Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Transfer Funds — Domestic Money Transfer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant 24x7 atomic settlement with real-time double-entry ledger posting and zero balance drift.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-blue-50 text-[#004c8f] border border-blue-200 px-3 py-1.5 rounded-lg font-medium self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ACID & Idempotency Protected</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Transfer Form */}
        <div className="lg:col-span-2 space-y-4">
          
          {user?.accountStatus === 'DORMANT' && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-rose-950">
                    🛡️ Dormant Account Scam Shield Active
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Outgoing transfers are locked to protect against unauthorized account takeover scams. Complete verified Re-KYC to unlock.
                  </p>
                </div>
              </div>
              <Link
                to="/dormant"
                className="shrink-0 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all"
              >
                Re-KYC Unlock
              </Link>
            </div>
          )}

          <form onSubmit={handleTransfer} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            
            {/* Step 1: Transfer Mode Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Transfer Payment Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'IMPS', title: 'IMPS 24x7', desc: 'Instant Settlement' },
                  { id: 'NEFT', title: 'NEFT', desc: 'Hourly Batches' },
                  { id: 'RTGS', title: 'RTGS', desc: 'High Value (₹2L+)' },
                  { id: 'UPI', title: 'UPI Mode', desc: 'Direct Protocol' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTransferType(mode.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      transferType === mode.id
                        ? 'bg-blue-50 border-[#004c8f] ring-2 ring-[#004c8f]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${transferType === mode.id ? 'text-[#004c8f]' : 'text-slate-800'}`}>
                        {mode.title}
                      </span>
                      {transferType === mode.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#004c8f]" />}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Beneficiary Picker */}
            {beneficiaries.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quick Select Saved Beneficiary
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {beneficiaries.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => selectBeneficiary(b)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-[#004c8f] text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{b.beneficiaryName || b.nickname}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({b.accountNumber.slice(-4)})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Beneficiary Details */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Beneficiary / Receiver Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Beneficiary Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={receiverAccountNumber}
                    onChange={(e) => {
                      setReceiverAccountNumber(e.target.value);
                      setReceiverInfo(null);
                    }}
                    placeholder="e.g. 100100000002"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c8f] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Confirm Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter account number"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c8f] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bank IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => {
                      setIfscCode(e.target.value.toUpperCase());
                      setReceiverInfo(null);
                    }}
                    placeholder="SECURE000001"
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c8f] focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => lookupAccount(receiverAccountNumber, ifscCode)}
                    disabled={lookingUp || !receiverAccountNumber}
                    className="w-full py-2 px-4 rounded-lg bg-[#004c8f] hover:bg-[#003666] disabled:bg-slate-300 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Search className={`w-3.5 h-3.5 ${lookingUp ? 'animate-spin' : ''}`} />
                    <span>{lookingUp ? 'Verifying Account...' : 'Verify Receiver Account'}</span>
                  </button>
                </div>
              </div>

              {/* Lookup Result Box */}
              {receiverInfo && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Verified Beneficiary: {receiverInfo.receiverName}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Account: <strong className="font-mono">{receiverInfo.maskedAccountNumber}</strong> | Type: {receiverInfo.accountType} | Bank: {receiverInfo.bankName || 'SecureBank'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded font-bold uppercase">
                    Eligible for Transfer
                  </span>
                </div>
              )}

              {lookupError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {/* Step 3: Transfer Amount & Remarks */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Amount & Purpose
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Transfer Amount (INR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c8f] focus:border-transparent"
                    />
                  </div>
                  {amount && (
                    <div className="text-[11px] text-slate-500 mt-1 italic font-medium">
                      In words: {getAmountInWords(amount)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Remarks / Purpose <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004c8f] focus:border-transparent bg-white"
                  >
                    <option value="Family Maintenance">Family Maintenance</option>
                    <option value="Salary Payment">Salary Payment</option>
                    <option value="Rent Payment">House / Commercial Rent</option>
                    <option value="Bill Payment">Bill / Utility Settlement</option>
                    <option value="Business Services">Vendor / Professional Services</option>
                    <option value="Personal Transfer">Personal Transfer</option>
                  </select>
                </div>
              </div>

              {/* Idempotency Protection Note */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Idempotency Key Guard: Active</span>
                </span>
                <span className="font-mono text-slate-500 text-[10px]">{idempotencyKey.slice(0, 18)}...</span>
              </div>
            </div>

            {/* Error Message */}
            {transferError && (
              <div className="p-3.5 rounded-lg bg-red-50 border-2 border-red-300 text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Transaction Blocked: </span>
                  <span>{transferError}</span>
                </div>
              </div>
            )}

            {/* Submit Button (HDFC Action Red) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={transferring || !receiverInfo}
                className="w-full py-3 px-6 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{transferring ? 'Executing Atomic Transfer...' : `Confirm & Transfer ₹${amount || '0.00'}`}</span>
              </button>
            </div>

          </form>

        </div>

        {/* Right 1 Col: Source Account & Security Rules */}
        <div className="space-y-4">
          
          {/* Source Account Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              Source Debit Account
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Account Type:</span>
                <span className="font-semibold text-slate-800">Savings Account (Preferred)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Number:</span>
                <span className="font-mono font-bold text-slate-900">{user?.accountNumber || '100100000001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Branch IFSC:</span>
                <span className="font-mono font-bold text-slate-900">SECURE000001</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">Min. Balance Limit:</span>
                <span className="font-semibold text-slate-700">₹500.00 Reserve</span>
              </div>
            </div>
          </div>

          {/* Transfer Guidelines */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800">Important Reminders</h4>
            <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-500">
              <li>Transfers are irreversible once processed.</li>
              <li>New beneficiaries require 30-min cooling-off.</li>
              <li>Pessimistic write locks ensure zero balance collision.</li>
              <li>SMS and in-app notifications are dispatched instantly.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* 4. Transaction Success Modal (Passbook Confirmation) */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#004c8f] text-white p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold">Transfer Successful</h2>
              <p className="text-blue-100 text-xs mt-0.5">Payment processed and debited from your account.</p>
            </div>

            {/* Modal Receipt Details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="text-center pb-4 border-b border-slate-100">
                <div className="text-xs text-slate-500">Total Transferred</div>
                <div className="text-3xl font-extrabold text-[#002e6e] font-mono mt-1">
                  ₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {getAmountInWords(receipt.amount)}
                </div>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">UTR / Reference:</span>
                  <strong className="font-mono text-slate-900">{receipt.referenceNumber}</strong>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Beneficiary Name:</span>
                  <span className="font-semibold text-slate-800">{receipt.receiverName}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Beneficiary Account:</span>
                  <span className="font-mono text-slate-700">{receipt.receiverAccountMasked}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Transfer Mode:</span>
                  <span className="font-bold text-slate-800">{receipt.transferType}</span>
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Updated Balance:</span>
                  <strong className="font-mono text-emerald-700 text-sm">
                    ₹{Number(receipt.senderBalanceAfter).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {receipt.idempotent && (
                <div className="p-2.5 rounded bg-blue-50 text-[#004c8f] text-[11px] font-semibold text-center border border-blue-200">
                  Idempotency Protected: Duplicate transfer was prevented. Existing receipt returned.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => {
                  setReceipt(null);
                  navigate('/dashboard');
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#004c8f] hover:bg-[#003666] text-white font-bold text-xs transition-colors"
              >
                Done / Back to Accounts
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
