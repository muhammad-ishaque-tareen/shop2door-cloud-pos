import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Search,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  List,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/Subscriptions.css';

const API = 'http://localhost:5000';

const Subscriptions = () => {
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [togglingId,    setTogglingId]    = useState(null);

  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate           = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  // ── Fetch subscriptions ───────────────────────────────────────────────────
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setSubscriptions(data);
    } catch (err) {
      console.error('[Subscriptions] fetch error:', err);
      setError('Failed to load subscriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Toggle subscription status ────────────────────────────────────────────
  const handleToggleStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'inactive' : 'active';
    setTogglingId(sub.subscription_id);
    try {
      const res = await fetch(`${API}/api/subscriptions/${sub.subscription_id}/status`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      // Optimistically update local state
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.subscription_id === sub.subscription_id ? { ...s, status: newStatus } : s
        )
      );
    } catch (err) {
      console.error('[Subscriptions] toggle error:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  // ── Auth helpers ──────────────────────────────────────────────────────────
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
          src={`${API}${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'sys-avatar-initials' : 'sys-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const filtered = subscriptions.filter((s) => {
    const matchSearch =
      s.shop?.toLowerCase().includes(search.toLowerCase()) ||
      s.package?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCount    = subscriptions.length;
  const activeCount   = subscriptions.filter((s) => s.status === 'active').length;
  const inactiveCount = subscriptions.filter((s) => s.status === 'inactive').length;
  const totalRevenue  = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="sys-admin-container">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="sys-admin-sidebar">
        <div className="sys-brand-header">
          <span className="sys-brand-title">SHOP2DOOR</span>
        </div>

        <nav className="sys-sidebar-nav">
          <button className="sys-nav-item" onClick={() => navigate('/systemadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>

          <div className="sys-nav-divider" />

          <button className="sys-nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} /><span>Shop Requests</span>
          </button>
          <button className="sys-nav-item" onClick={() => navigate('/manageshops')}>
            <Store size={18} /><span>Manage Shops</span>
          </button>

          <div className="sys-nav-divider" />

          <button className="sys-nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} /><span>Manage Packages</span>
          </button>
          <button className="sys-nav-item active">
            <DollarSign size={18} /><span>Subscriptions</span>
          </button>

          <div className="sys-nav-divider" />

          <button className="sys-nav-item" onClick={() => navigate('/settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button className="sys-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="sys-nav-item sys-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="sys-admin-main">

        {/* Header */}
        <header className="sys-main-header">
          <div className="sys-breadcrumb">Admin &gt; Subscriptions</div>

          <div className="sys-header-actions">

            {/* Menu dropdown */}
            <div className="sys-menu-dropdown-container" ref={menuDropdownRef}>
              <button
                className="sys-btn-menu"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
                Menu <span className="sys-dropdown-arrow">▼</span>
              </button>

              {showMenuDropdown && (
                <div className="sys-menu-dropdown">
                  <div className="sys-menu-section">
                    <h4 className="sys-menu-section-title">Quick Actions</h4>
                    <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemadmindashboard'); }}>
                      <LayoutDashboard size={18} /><span>Dashboard</span>
                    </button>
                    <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shoprequests'); }}>
                      <FileText size={18} /><span>Shop Requests</span>
                    </button>
                    <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/manageshops'); }}>
                      <Store size={18} /><span>Manage Shops</span>
                    </button>
                  </div>
                  <div className="sys-menu-divider" />
                  <div className="sys-menu-section">
                    <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/packages'); }}>
                      <Package size={18} /><span>Packages</span>
                    </button>
                    <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/settings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sys-icon-circle moon"><Moon size={16} /></div>
            <div className="sys-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="sys-profile-dropdown-container" ref={profileDropdownRef}>
              <button
                className="sys-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="sys-profile-dropdown">
                  <div className="sys-profile-dropdown-header">
                    <div className="sys-profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
                    <div className="sys-profile-dropdown-info">
                      <h4 className="sys-profile-name">{user.name || 'Admin'}</h4>
                      <p className="sys-profile-role">{user.role || 'System Admin'}</p>
                    </div>
                  </div>
                  <div className="sys-profile-divider" />
                  <div className="sys-profile-details">
                    <div className="sys-profile-detail-item">
                      <span className="sys-detail-icon">📧</span>
                      <span className="sys-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="sys-profile-detail-item">
                      <span className="sys-detail-icon">📱</span>
                      <span className="sys-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="sys-profile-divider" />
                  <div className="sys-profile-actions">
                    <button className="sys-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemadminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="sys-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button>
                    <button className="sys-profile-action-btn sys-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── SUBSCRIPTIONS CONTENT ────────────────────────────────────── */}
        <div className="sub-content">

          {/* Page title */}
          <div className="sub-page-header">
            <div>
              <h1 className="sub-page-title">Subscriptions</h1>
              <p className="sub-page-subtitle">View and manage all shop subscriptions</p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="sub-stats-strip">
            <div className="sub-stat-card">
              <div className="sub-stat-icon purple"><List size={20} /></div>
              <div>
                <div className="sub-stat-number">{totalCount}</div>
                <div className="sub-stat-label">Total</div>
              </div>
            </div>
            <div className="sub-stat-card">
              <div className="sub-stat-icon green"><CheckCircle size={20} /></div>
              <div>
                <div className="sub-stat-number">{activeCount}</div>
                <div className="sub-stat-label">Active</div>
              </div>
            </div>
            <div className="sub-stat-card">
              <div className="sub-stat-icon red"><XCircle size={20} /></div>
              <div>
                <div className="sub-stat-number">{inactiveCount}</div>
                <div className="sub-stat-label">Inactive</div>
              </div>
            </div>
            <div className="sub-stat-card">
              <div className="sub-stat-icon amber"><TrendingUp size={20} /></div>
              <div>
                <div className="sub-stat-number">₨{Number(totalRevenue).toLocaleString()}</div>
                <div className="sub-stat-label">Active Revenue</div>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="sub-filter-bar">
            <div className="sub-search-wrap">
              <Search size={15} className="sub-search-icon" />
              <input
                className="sub-search-input"
                type="text"
                placeholder="Search by shop or package…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="sub-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button className="sub-refresh-btn" onClick={fetchSubscriptions}>
              <RefreshCw size={14} className={loading ? 'sub-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="sub-table-card">
            <div className="sub-table-scroll">
              {error ? (
                <table className="sub-table">
                  <tbody>
                    <tr className="sub-empty-row">
                      <td colSpan={7} style={{ color: '#ef4444' }}>{error}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="sub-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Shop</th>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr className="sub-empty-row">
                        <td colSpan={8}>
                          <RefreshCw size={16} className="sub-spin" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                          Loading subscriptions…
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr className="sub-empty-row">
                        <td colSpan={8}>No subscriptions found.</td>
                      </tr>
                    ) : (
                      filtered.map((sub, idx) => (
                        <tr key={sub.subscription_id}>
                          <td className="muted">{idx + 1}</td>
                          <td>
                            <div className="sub-shop-cell">
                              <div className="sub-shop-avatar">
                                {sub.shop?.substring(0, 2).toUpperCase() || 'SH'}
                              </div>
                              {sub.shop || '—'}
                            </div>
                          </td>
                          <td>{sub.package || '—'}</td>
                          <td>₨{Number(sub.amount || 0).toLocaleString()}</td>
                          <td className="muted">{fmtDate(sub.start_date)}</td>
                          <td className="muted">{fmtDate(sub.end_date)}</td>
                          <td>
                            <span className={`sub-status ${sub.status}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td>
                            <div className="sub-actions">
                              <button
                                className={`sub-action-btn ${sub.status === 'active' ? 'deactivate' : 'activate'}`}
                                disabled={togglingId === sub.subscription_id}
                                onClick={() => handleToggleStatus(sub)}
                              >
                                {togglingId === sub.subscription_id
                                  ? '…'
                                  : sub.status === 'active'
                                  ? 'Deactivate'
                                  : 'Activate'}
                              </button>
                              <button
                                className="sub-action-btn view"
                                onClick={() => navigate(`/manageshops/${sub.shop_id}`)}
                              >
                                View Shop
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Subscriptions;