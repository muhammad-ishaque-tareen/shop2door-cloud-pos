import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Store, Package,
  DollarSign, Settings, LogOut, User, Bell, Moon, Check, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/ShopRequests.css';
import { API_BASE_URL } from '../config';

const ShopRequests = () => {
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shopRequests,        setShopRequests]        = useState([]);
  const [loading,             setLoading]             = useState(true);

  // Reject modal state
  const [rejectModal,  setRejectModal]  = useState({ open: false, requestId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  //  Close dropdowns on outside click 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { fetchShopRequests(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  //  Fetch all pending/payment_submitted requests 
  const fetchShopRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/shop-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShopRequests(data);
      }
    } catch (err) {
      console.error('Error fetching shop requests:', err);
    } finally {
      setLoading(false);
    }
  };

  //  Approve 
  const handleApprove = async (requestId) => {
    if (!window.confirm('Approve this shop request? This will create the shop schema and send credentials to the admin.')) return;
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/shop-requests/${requestId}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      const data = await res.json();
      if (res.ok) {
        showToast(`Shop approved! Code: ${data.code}`, 'success');
        fetchShopRequests();
      } else {
        showToast(data.message || 'Approval failed.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  //  Open reject modal 
  const openRejectModal = (requestId) => {
    setRejectReason('');
    setRejectModal({ open: true, requestId });
  };

  //  Confirm reject 
  const handleRejectConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/api/shop-requests/${rejectModal.requestId}/reject`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason.trim() || null }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        showToast('Request rejected. User has been notified.', 'success');
        setRejectModal({ open: false, requestId: null });
        fetchShopRequests();
      } else {
        showToast(data.message || 'Rejection failed.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'SA';
    if (user.image_url) {
      return (
        <img
          src={`${API_BASE_URL}${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'sr-avatar-initials' : 'sr-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  const getPackageBadgeClass = (name) => {
    const n = name?.toLowerCase();
    if (n === 'starter')                        return 'starter';
    if (n === 'pro' || n === 'professional')    return 'pro';
    if (n === 'enterprise')                     return 'enterprise';
    return 'starter';
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:           { label: 'Pending',           style: { background: '#fef3c7', color: '#92400e' } },
      payment_submitted: { label: 'Payment Submitted', style: { background: '#dbeafe', color: '#1e40af' } },
      approved:          { label: 'Approved',          style: { background: '#d1fae5', color: '#065f46' } },
      rejected:          { label: 'Rejected',          style: { background: '#fee2e2', color: '#dc2626' } },
      // Inside getStatusBadge map object, add:
      free_trial_pending: { label: "Trial Pending",  style: { background: "#f0fdf4", color: "#15803d" } },
    };
    const entry = map[status] || { label: status, style: { background: '#f3f4f6', color: '#374151' } };
    return (
      <span style={{
        ...entry.style,
        padding: '3px 10px', borderRadius: '9999px',
        fontSize: '0.72rem', fontWeight: 600,
      }}>
        {entry.label}
      </span>
    );
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const formatAmount = (a) => a ? `Rs. ${Number(a).toLocaleString()}` : '—';

  return (
    <div className="sr-admin-container">

      {/*  Toast  */}
      {toast.show && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#dc2626' : '#065f46',
          padding: '12px 20px', borderRadius: 10, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '0.875rem',
          maxWidth: 360,
        }}>
          {toast.message}
        </div>
      )}

      {/*  Reject Reason Modal  */}
      {rejectModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 32,
            width: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ margin: '0 0 8px', color: '#1f2937', fontSize: '1.1rem' }}>
              Reject Shop Request
            </h3>
            <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '0.875rem' }}>
              Optionally provide a reason — it will be included in the email sent to the applicant.
            </p>
            <textarea
              rows={4}
              placeholder="Reason for rejection (optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                border: '1px solid #e5e7eb', borderRadius: 8,
                fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRejectModal({ open: false, requestId: null })}
                style={{
                  padding: '9px 20px', border: '1px solid #e5e7eb',
                  borderRadius: 8, background: '#fff', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 600, color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                style={{
                  padding: '9px 20px', border: 'none', borderRadius: 8,
                  background: '#ef4444', color: '#fff', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  SIDEBAR  */}
      <aside className="sr-admin-sidebar">
        <div className="sr-brand-header">
          <span className="sr-brand-title">SHOP2DOOR</span>
        </div>
        <nav className="sr-sidebar-nav">
          <button className="sr-nav-item" onClick={() => navigate('/systemadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <div className="sr-nav-divider" />
          <button className="sr-nav-item active">
            <FileText size={18} /><span>Shop Requests</span>
          </button>
          <button className="sr-nav-item" onClick={() => navigate('/manageshops')}>
            <Store size={18} /><span>Manage Shops</span>
          </button>
          <div className="sr-nav-divider" />
          <button className="sr-nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} /><span>Manage Packages</span>
          </button>
          <button className="sr-nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} /><span>Subscriptions</span>
          </button>
          <div className="sr-nav-divider" />
          {/* <button className="sr-nav-item" onClick={() => navigate('/systemsettings')}>
            <Settings size={18} /><span>Settings</span>
          </button> */}
          <button className="sr-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="sr-nav-item sr-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  MAIN  */}
      <main className="sr-admin-main">

        {/* Header */}
        <header className="sr-main-header">
          <div className="sr-breadcrumb">Admin &gt; Shop Requests</div>
          <div className="sr-header-actions">

            <div className="sr-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="sr-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                Menu <span className="sr-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="sr-menu-dropdown">
                  <div className="sr-menu-section">
                    <h4 className="sr-menu-section-title">Quick Actions</h4>
                    <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemadmindashboard'); }}>
                      <LayoutDashboard size={18} /><span>Dashboard</span>
                    </button>
                    <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shoprequests'); }}>
                      <FileText size={18} /><span>Shop Requests</span>
                    </button>
                    <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/manageshops'); }}>
                      <Store size={18} /><span>Manage Shops</span>
                    </button>
                  </div>
                  <div className="sr-menu-divider" />
                  <div className="sr-menu-section">
                    <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/packages'); }}>
                      <Package size={18} /><span>Packages</span>
                    </button>
                    <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/subscriptions'); }}>
                      <DollarSign size={18} /><span>Subscriptions</span>
                    </button>
                    {/* <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
                  </div>
                </div>
              )}
            </div>

            <div className="sr-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="sr-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="sr-profile-dropdown">
                  <div className="sr-profile-dropdown-header">
                    <div className="sr-profile-dropdown-avatar">{renderProfileImage('dropdown')}</div>
                    <div className="sr-profile-dropdown-info">
                      <h4 className="sr-profile-name">{user.name || 'Admin'}</h4>
                      <p className="sr-profile-role">{user.role || 'System Admin'}</p>
                    </div>
                  </div>
                  <div className="sr-profile-divider" />
                  <div className="sr-profile-details">
                    <div className="sr-profile-detail-item">
                      <span className="sr-detail-icon">📧</span>
                      <span className="sr-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="sr-profile-detail-item">
                      <span className="sr-detail-icon">📱</span>
                      <span className="sr-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="sr-profile-divider" />
                  <div className="sr-profile-actions">
                    <button className="sr-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemadminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    {/* <button className="sr-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
                    <button className="sr-profile-action-btn sr-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="sr-page-content">
          <div className="sr-page-header">
            <h1 className="sr-page-title">Shop Requests</h1>
            <p className="sr-page-subtitle">
              Review payment proofs and approve or reject shop applications
            </p>
          </div>

          <div className="sr-card">
            <div className="sr-card-header">
              <h2 className="sr-card-title">Pending Applications</h2>
              <span className="sr-request-count">
                {shopRequests.length} request{shopRequests.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div className="sr-empty-state">Loading shop requests...</div>
            ) : shopRequests.length === 0 ? (
              <div className="sr-empty-state">No pending shop requests</div>
            ) : (
              <div className="sr-table-wrapper">
                <table className="sr-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Shop Name</th>
                      <th>Applicant</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Sender Account</th>
                      <th>Txn Ref</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopRequests.map((r) => (
                      <tr key={r.request_id}>
                        <td style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{r.request_id}</td>
                        <td style={{ fontWeight: 600, color: '#1f2937' }}>{r.shop_name || '—'}</td>
                        <td>{r.full_name}</td>
                        <td>{r.user_email}</td>
                        <td>{r.user_phone || '—'}</td>
                       <td>
  {r.package_name?.toLowerCase().includes("free") ? (
    <span style={{
      background: "#f0fdf4", color: "#15803d",
      padding: "3px 10px", borderRadius: 9999,
      fontSize: "0.72rem", fontWeight: 700, border: "1px solid #bbf7d0"
    }}>
      🎁 Free Trial
    </span>
  ) : (
    <span className={`sr-package-badge ${getPackageBadgeClass(r.package_name)}`}>
      {r.package_name}
    </span>
  )}
</td>
                        <td className="sr-amount-cell">{formatAmount(r.amount)}</td>
                        <td>{r.payment_method || '—'}</td>
                        <td>{r.sender_account || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {r.transaction_ref || '—'}
                        </td>
                        <td>{formatDate(r.payment_date)}</td>
                        <td>{getStatusBadge(r.status)}</td>
                        <td>{formatDate(r.created_at)}</td>
                        <td>
                          {r.status === 'payment_submitted' ? (
                            <div className="sr-action-buttons">
                              <button
                                className="sr-action-btn approve"
                                onClick={() => handleApprove(r.request_id)}
                                disabled={actionLoading}
                                title="Approve — creates schema and sends credentials"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                className="sr-action-btn reject"
                                onClick={() => openRejectModal(r.request_id)}
                                disabled={actionLoading}
                                title="Reject — sends rejection email"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {r.status === 'pending' ? 'Awaiting payment' : r.status}
                            </span>
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
      </main>
    </div>
  );
};

export default ShopRequests;