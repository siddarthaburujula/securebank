import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransferPage } from './pages/TransferPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { StatementsPage } from './pages/StatementsPage';
import { BillPaymentsPage } from './pages/BillPaymentsPage';
import { DormantReactivationPage } from './pages/DormantReactivationPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { MailWebPage } from './pages/MailWebPage';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex gap-6">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Real Bank Corporate Footer */}
      <footer className="bg-[#001f3f] text-slate-300 text-xs mt-12 border-t-4 border-[#004c8f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="text-white font-bold text-sm mb-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#ed1c24] rounded-xs"></span>
                SecureBank NetBanking
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                India's premier simulated banking experience with ACID consistency, pessimistic concurrency control, and double-entry ledger bookkeeping.
              </p>
            </div>
            <div>
              <div className="text-white font-semibold text-xs mb-2">Customer Support</div>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>Toll Free: 1800 202 6161</li>
                <li>Email: support@securebank.com</li>
                <li>Branch IFSC: SECURE000001</li>
                <li>24x7 NetBanking Helpdesk</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold text-xs mb-2">Security & Policies</div>
              <ul className="space-y-1 text-[11px] text-slate-400">
                <li>• Safe Banking Advisory</li>
                <li>• 256-Bit SSL Data Encryption</li>
                <li>• RBI Regulatory Framework</li>
                <li>• Grievance Redressal / Ombudsman</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold text-xs mb-2">Security Seal</div>
              <div className="p-3 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <div className="text-emerald-400 font-bold">🔒 VERIFIED SECURE</div>
                <div>ISO/IEC 27001:2022 Certified</div>
                <div>PCI-DSS Level 1 Ready Model</div>
              </div>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>
              © 2026 SecureBank Ltd. All rights reserved. For educational simulation purposes only.
            </div>
            <div className="flex gap-4">
              <span>Privacy Policy</span>
              <span>Terms of NetBanking</span>
              <span>Do Not Call Registry</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mail" element={<MailWebPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Customer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TransferPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/beneficiaries"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BeneficiariesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/statements"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StatementsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bills"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BillPaymentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dormant"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DormantReactivationPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/dormant-reactivation" element={<Navigate to="/dormant" replace />} />

          {/* Protected Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AppLayout>
                  <AdminPortalPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
