import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Droplet, 
  Smartphone, 
  Wifi, 
  Tv, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  History, 
  ArrowRight,
  Printer,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BillPaymentsPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ELECTRICITY');
  const [billerName, setBillerName] = useState('Tata Power');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  // History tab
  const [activeTab, setActiveTab] = useState('pay'); // 'pay' | 'history'
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const billerOptions = {
    ELECTRICITY: ['Tata Power', 'BESCOM Bengaluru', 'Adani Electricity Mumbai', 'MSEDCL Maharashtra', 'BSES Delhi'],
    WATER: ['BWSSB Water Supply', 'Delhi Jal Board (DJB)', 'BMC Water Department', 'HMWS&SB Hyderabad'],
    MOBILE: ['Jio Postpaid / Prepaid', 'Airtel Telecommunications', 'Vodafone Idea (Vi)', 'BSNL Mobile'],
    INTERNET: ['JioFiber Broadband', 'Airtel Xstream Fiber', 'ACT Fibernet', 'Excitel Broadband'],
    DTH: ['Tata Play (Tata Sky)', 'Airtel Digital TV', 'Dish TV India', 'Sun Direct'],
  };

  const categories = [
    { key: 'ELECTRICITY', label: 'Electricity', icon: Zap },
    { key: 'WATER', label: 'Water Supply', icon: Droplet },
    { key: 'MOBILE', label: 'Mobile Recharge', icon: Smartphone },
    { key: 'INTERNET', label: 'Broadband Fiber', icon: Wifi },
    { key: 'DTH', label: 'DTH Satellite', icon: Tv },
  ];

  const handleCategorySelect = (key) => {
    setSelectedCategory(key);
    setBillerName(billerOptions[key][0]);
    setError('');
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/bills/history');
      if (res.data?.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid bill amount.');
      return;
    }

    if (!consumerNumber || consumerNumber.trim().length < 4) {
      setError('Please enter a valid Consumer ID / Service Account Number.');
      return;
    }

    setPaying(true);
    try {
      const res = await api.post('/bills/pay', {
        billCategory: selectedCategory,
        billerName,
        consumerNumber: consumerNumber.trim(),
        amount: numAmount,
      });

      if (res.data?.success) {
        setReceipt(res.data.data);
        setConsumerNumber('');
        setAmount('');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Bill payment failed. Please verify account balance or dormancy state.'
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-[#004c8f]">NetBanking</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">BillPay & Utility Recharges</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            BillPay & Instant Utility Recharge
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct online utility settlement debited atomically from your verified savings ledger.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pay')}
            className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'pay' ? 'bg-[#004c8f] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'}`}
          >
            Pay New Bill
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'history' ? 'bg-[#004c8f] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'}`}
          >
            Payment Receipts History
          </button>
        </div>
      </div>

      {activeTab === 'pay' ? (
        <div className="space-y-5">
          
          {user?.accountStatus === 'DORMANT' && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-rose-950">
                    🛡️ Dormant Account Anti-Scam Shield Active
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Utility bill debits are blocked on dormant accounts to prevent unauthorized account drain scams. Please complete Re-KYC verification to reactivate your account.
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

          {/* Category Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleCategorySelect(c.key)}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-50 border-[#004c8f] ring-2 ring-[#004c8f]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#004c8f] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? 'text-[#004c8f]' : 'text-slate-800'}`}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bill Payment Form */}
          <form onSubmit={handlePay} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              Payment Details for {categories.find(c => c.key === selectedCategory)?.label}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Select Utility Service Provider / Biller <span className="text-red-500">*</span>
                </label>
                <select
                  value={billerName}
                  onChange={(e) => setBillerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none bg-white"
                >
                  {billerOptions[selectedCategory]?.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Consumer ID / Connection No / Mobile No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value)}
                  placeholder="e.g. 100293847291"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Bill Amount to Pay (INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Debit Account
                </label>
                <div className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700">
                  Primary Savings (IFSC: SECURE000001)
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={paying}
                className="w-full py-3 px-6 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] disabled:bg-slate-300 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>{paying ? 'Processing Debit Settlement...' : `Pay ₹${amount || '0.00'} Now`}</span>
              </button>
            </div>
          </form>

        </div>
      ) : (
        /* Bill History View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
            Past Utility Settlement Records ({history.length})
          </div>

          {loadingHistory ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading bill history...
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No previous bill payment records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Biller Name</th>
                    <th className="py-3 px-4">Consumer No</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {history.map((h, i) => (
                    <tr key={h.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {h.paidAt ? new Date(h.paidAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{h.billCategory}</td>
                      <td className="py-3 px-4">{h.billerName}</td>
                      <td className="py-3 px-4 font-mono">{h.consumerNumber}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#ed1c24]">
                        -₹{Number(h.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {h.status || 'PAID'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bill Payment Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#004c8f] text-white p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold">Bill Payment Successful</h2>
              <p className="text-blue-100 text-xs mt-0.5">Utility receipt generated and posted to ledger.</p>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="text-center pb-3 border-b border-slate-100">
                <div className="text-xs text-slate-500">Amount Paid</div>
                <div className="text-2xl font-extrabold text-[#002e6e] font-mono mt-0.5">
                  ₹{Number(receipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Biller:</span>
                  <strong className="text-slate-800">{receipt.billerName}</strong>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Consumer Account:</span>
                  <span className="font-mono text-slate-800">{receipt.consumerNumber}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-800">{receipt.billCategory}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    {receipt.status || 'PAID'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 py-2 px-3 rounded-lg bg-[#004c8f] hover:bg-[#003666] text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
