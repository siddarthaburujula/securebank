import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { 
  FileText, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  RefreshCw,
  AlertCircle,
  Printer,
  Building,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StatementsPage = () => {
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchStatement = async (start, end) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/transactions/statement', {
        params: {
          startDate: start || startDate,
          endDate: end || endDate,
        }
      });
      if (res.data?.success) {
        setStatement(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate account statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  const setPresetRange = (months) => {
    const end = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    const start = d.toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
    fetchStatement(start, end);
  };

  const downloadCsv = async () => {
    try {
      const res = await api.get('/transactions/statement/csv', {
        params: { startDate, endDate },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SecureBank_Statement_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download CSV: ' + (err.message || 'Error'));
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-[#004c8f]">NetBanking</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Account Statement & Passbook</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Account Statement & Detailed Passbook
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified double-entry bookkeeping ledger with opening/closing balances and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Statement</span>
          </button>

          <button
            onClick={downloadCsv}
            disabled={loading || !statement || statement.transactionCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#004c8f] hover:bg-[#003666] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Preset Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Quick Period:</span>
            <div className="flex gap-1.5">
              {[
                { label: 'Last 1 Month', months: 1 },
                { label: 'Last 3 Months', months: 3 },
                { label: 'Last 6 Months', months: 6 },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => setPresetRange(p.months)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-[#004c8f] text-[11px] font-medium transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Custom Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded font-mono"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded font-mono"
            />
            <button
              onClick={() => fetchStatement(startDate, endDate)}
              className="px-3 py-1 bg-[#ed1c24] hover:bg-[#c9141b] text-white rounded font-bold text-xs shadow-xs transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Account Statement Summary Block (Official Banking Header) */}
      {statement && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="bg-[#002e6e] text-white p-4 sm:p-5 flex flex-wrap justify-between items-center gap-3">
            <div>
              <div className="text-xs text-blue-200 uppercase font-semibold">Account Holder</div>
              <div className="text-lg font-bold">{statement.customerName}</div>
              <div className="text-xs text-blue-200 font-mono mt-0.5">
                Account Number: <strong className="text-white">{statement.accountNumber}</strong> | Branch IFSC: <strong>SECURE000001</strong>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-blue-200 block">Statement Duration</span>
              <strong className="text-white font-mono">{statement.startDate} to {statement.endDate}</strong>
            </div>
          </div>

          {/* Ledger Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 text-xs border-b border-slate-200 bg-slate-50/50">
            <div className="p-4">
              <span className="text-slate-500 font-medium block">Opening Balance</span>
              <strong className="font-mono text-base text-slate-800 block mt-0.5">
                ₹{Number(statement.openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-4">
              <span className="text-slate-500 font-medium block">Total Inward (Credits)</span>
              <strong className="font-mono text-base text-emerald-700 block mt-0.5">
                +₹{Number(statement.totalCredits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-4">
              <span className="text-slate-500 font-medium block">Total Outward (Debits)</span>
              <strong className="font-mono text-base text-[#ed1c24] block mt-0.5">
                -₹{Number(statement.totalDebits).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-4">
              <span className="text-slate-500 font-medium block">Closing Balance</span>
              <strong className="font-mono text-base text-[#002e6e] block mt-0.5">
                ₹{Number(statement.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Statement Journal Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Txn Date</th>
                  <th className="py-3 px-4">Narration / Particulars</th>
                  <th className="py-3 px-4">Ref / UTR Number</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Withdrawal (Dr)</th>
                  <th className="py-3 px-4 text-right">Deposit (Cr)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {(!statement.transactions || statement.transactions.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500">
                      No transaction records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  statement.transactions.map((tx, idx) => {
                    const isDebit = tx.entryType === 'DEBIT';
                    const dateFormatted = tx.initiatedAt ? new Date(tx.initiatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '—';

                    return (
                      <tr key={tx.referenceNumber || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{tx.counterpartyName || 'SecureBank'}</div>
                          <div className="text-[11px] text-slate-500">{tx.description}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {tx.referenceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300">
                            {tx.transferType || 'IMPS'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#ed1c24] whitespace-nowrap">
                          {isDebit ? `-₹${Number(tx.amount).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {!isDebit ? `+₹${Number(tx.amount).toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
