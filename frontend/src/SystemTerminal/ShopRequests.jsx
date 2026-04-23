import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Store,
  Package,
  DollarSign,
  Settings,
  LogOut,
  User,
  Bell,
  Moon,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/ShopRequests.css';

const ShopRequests = () => {
  const [showMenuDropdown, setShowMenuDropdown]   = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shopRequests, setShopRequests] = useState([]);
  const [loading, setLoading]           = useState(true);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  // ── Close dropdowns on outside click ─────────────────────────────────────
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

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchShopRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/shop-requests', {
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

  const handleApprove = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/shop-requests/${requestId}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.ok) fetchShopRequests();
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/shop-requests/${requestId}/reject`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.ok) fetchShopRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  // ── Profile image ─────────────────────────────────────────────────────────
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'SA';
    if (user.image_url) {
      return (
        <img
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'sr-avatar-initials' : 'sr-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  const getPackageBadgeClass = (packageName) => {
    const name = packageName?.toLowerCase();
    if (name === 'starter')                        return 'starter';
    if (name === 'pro' || name === 'professional') return 'pro';
    if (name === 'enterprise')                     return 'enterprise';
    return 'starter';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="sr-admin-container">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
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

          <button className="sr-nav-item" onClick={() => navigate('/systemsettings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button className="sr-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="sr-nav-item sr-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="sr-admin-main">
        {/* Header */}
        <header className="sr-main-header">
          <div className="sr-breadcrumb">Admin &gt; Shop Requests</div>

          <div className="sr-header-actions">
            {/* Menu dropdown */}
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
                    <button className="sr-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/settings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sr-icon-circle moon"><Moon size={16} /></div>
            <div className="sr-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="sr-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="sr-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="sr-profile-dropdown">
                  <div className="sr-profile-dropdown-header">
                    <div className="sr-profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
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
                    <button className="sr-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button>
                    <button className="sr-profile-action-btn sr-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
        <div className="sr-page-content">
          <div className="sr-page-header">
            <h1 className="sr-page-title">Shop Requests</h1>
            <p className="sr-page-subtitle">Review and confirm payment information below</p>
          </div>

          <div className="sr-card">
            <div className="sr-card-header">
              <h2 className="sr-card-title">Payment Information</h2>
              <span className="sr-request-count">{shopRequests.length} request{shopRequests.length !== 1 ? 's' : ''}</span>
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
                      <th>Amount Paid</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Sender Account</th>
                      <th>Package</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="sr-amount-cell">{request.amount_paid}</td>
                        <td>{request.full_name}</td>
                        <td>{request.email}</td>
                        <td>{request.sender_account}</td>
                        <td>
                          <span className={`sr-package-badge ${getPackageBadgeClass(request.package)}`}>
                            {request.package}
                          </span>
                        </td>
                        <td>{formatDate(request.date)}</td>
                        <td>{request.payment_method}</td>
                        <td>
                          <div className="sr-action-buttons">
                            <button
                              className="sr-action-btn approve"
                              onClick={() => handleApprove(request.id)}
                              title="Approve"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              className="sr-action-btn reject"
                              onClick={() => handleReject(request.id)}
                              title="Reject"
                            >
                              <X size={15} />
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
      </main>
    </div>
  );
};

export default ShopRequests;