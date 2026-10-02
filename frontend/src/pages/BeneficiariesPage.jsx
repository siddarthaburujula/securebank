import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { 
  Users, 
  UserPlus, 
  Send, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  Building,
  Plus
} from 'lucide-react';

export const BeneficiariesPage = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    beneficiaryName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: 'SECURE000001',
    bankName: 'SecureBank',
    nickname: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/beneficiaries');
      if (res.data?.success) {
        setBeneficiaries(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load beneficiaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (form.confirmAccountNumber && form.confirmAccountNumber !== form.accountNumber) {
      setError('Account Number and Confirm Account Number do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/beneficiaries', {
        beneficiaryName: form.beneficiaryName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        bankName: form.bankName.trim(),
        nickname: form.nickname.trim() || form.beneficiaryName.trim(),
      });
      if (res.data?.success) {
        setSuccessMsg('Beneficiary successfully registered! 30-minute cooling-off period active.');
        setForm({
          beneficiaryName: '',
          accountNumber: '',
          confirmAccountNumber: '',
          ifscCode: 'SECURE000001',
          bankName: 'SecureBank',
          nickname: '',
        });
        setShowAddForm(false);
        fetchBeneficiaries();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register beneficiary.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary from NetBanking?')) return;
    try {
      const res = await api.delete(`/beneficiaries/${id}`);
      if (res.data?.success) {
        fetchBeneficiaries();
      }
    } catch (err) {
      alert('Failed to delete beneficiary: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-[#004c8f]">NetBanking</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-semibold">Beneficiary Management (Payees)</span>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Registered Beneficiaries & Payees
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized transfer recipients with mandatory 30-minute anti-fraud cooling-off protection.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#004c8f] hover:bg-[#003666] text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Registration Form' : 'Add New Beneficiary'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-xs text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Beneficiary Panel */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#004c8f]" />
            <span>Register New Beneficiary Account</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Beneficiary Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.beneficiaryName}
                onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Nickname / Label
              </label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="e.g. Office / Landlord"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="10-16 digit account number"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Confirm Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.confirmAccountNumber}
                onChange={(e) => setForm({ ...form, confirmAccountNumber: e.target.value })}
                placeholder="Re-enter account number"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Bank IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                placeholder="SECURE000001"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="SecureBank"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004c8f] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#ed1c24] hover:bg-[#c9141b] text-white text-xs font-bold shadow-xs transition-colors"
            >
              {submitting ? 'Registering...' : 'Register Beneficiary'}
            </button>
          </div>
        </form>
      )}

      {/* Beneficiaries Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Active Payee List ({beneficiaries.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">Cooling-Off: 30 minutes after registration</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading verified beneficiaries...
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-2">
            <div>No beneficiaries registered yet.</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[#004c8f] font-bold hover:underline"
            >
              + Click here to add your first beneficiary
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Beneficiary Name</th>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Bank & IFSC</th>
                  <th className="py-3 px-4">Cooling-Off Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.beneficiaryName}</div>
                      <div className="text-[11px] text-slate-500">{b.nickname || 'Personal Payee'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {b.maskedAccountNumber || b.accountNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{b.bankName || 'SecureBank'}</div>
                      <div className="font-mono text-[11px] text-slate-500">{b.ifscCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.isCoolingOff ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Cooling-off (Restricted)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active / Ready</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate('/transfer', { state: { beneficiary: b } })}
                          disabled={b.isCoolingOff}
                          className="px-3 py-1 rounded bg-[#004c8f] hover:bg-[#003666] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Payee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
