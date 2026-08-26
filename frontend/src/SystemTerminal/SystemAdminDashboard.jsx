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
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/SystemAdminDashboard.css';
import { API_BASE_URL } from '../config';

const SystemAdminDashboard = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Real data states
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  //  Fetch dashboard stats 
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/system/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  //  Fetch packages 
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/system/packages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
      } finally {
        setLoadingPackages(false);
      }
    };
    fetchPackages();
  }, []);

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

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  //  Profile image renderer 
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
    const cls = size === 'dropdown' ? 'sys-avatar-initials' : 'sys-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  //  Package distribution bar colours 
  const barColors = ['purple', 'teal', 'red', 'blue'];

  const totalShopsByPackage = packages.reduce((sum, p) => sum + (p.shop_count || 0), 0);

  return (
    <div className="sys-admin-container">
      {/*  SIDEBAR  */}
      <aside className="sys-admin-sidebar">
        <div className="sys-brand-header">
          <span className="sys-brand-title">SHOP2DOOR</span>
        </div>

        <nav className="sys-sidebar-nav">
          <button className="sys-nav-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <div className="sys-nav-divider" />

          <button className="sys-nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} />
            <span>Shop Requests</span>
          </button>
          <button className="sys-nav-item" onClick={() => navigate('/manageshops')}>
            <Store size={18} />
            <span>Manage Shops</span>
          </button>

          <div className="sys-nav-divider" />

          <button className="sys-nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} />
            <span>Manage Packages</span>
          </button>
          <button className="sys-nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} />
            <span>Subscriptions</span>
          </button>

          <div className="sys-nav-divider" />

          {/* <button className="sys-nav-item" onClick={() => navigate('/systemsettings')}>
            <Settings size={18} />
            <span>Settings</span>
          </button> */}
          <button className="sys-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} />
            <span>My Profile</span>
          </button>
          <button className="sys-nav-item sys-logout-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  MAIN  */}
      <main className="sys-admin-main">
        {/* Header */}
        <header className="sys-main-header">
          <div className="sys-breadcrumb">Admin &gt; Dashboard</div>

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
                    <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/subscriptions'); }}>
                      <DollarSign size={18} /><span>Subscriptions</span>
                    </button>
                    {/* <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/settings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
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
                    {/* <button className="sys-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
                    <button className="sys-profile-action-btn sys-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT  */}
        <div className="sys-dashboard-content">
          <div className="sys-welcome-section">
            <h1 className="sys-welcome-title">
              Good Morning, {user.name?.split(' ')[0] || 'Admin'}!
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="sys-stats-section">
            <h2 className="sys-section-title">OVERVIEW</h2>
            <div className="sys-stats-grid">
              {/* Pending Requests */}
              <div className="sys-stat-card" onClick={() => navigate('/shoprequests')} style={{ cursor: 'pointer' }}>
                <div className="sys-stat-icon-wrap pending">
                  <Clock size={28} />
                </div>
                <div className="sys-stat-body">
                  <div className="sys-stat-number">
                    {loadingStats ? '—' : (stats?.pending_requests ?? 0)}
                  </div>
                  <div className="sys-stat-label">Pending Requests</div>
                </div>
              </div>

              {/* Total Shops */}
              <div className="sys-stat-card" onClick={() => navigate('/manageshops')} style={{ cursor: 'pointer' }}>
                <div className="sys-stat-icon-wrap total">
                  <Store size={28} />
                </div>
                <div className="sys-stat-body">
                  <div className="sys-stat-number">
                    {loadingStats ? '—' : (stats?.total_shops ?? 0)}
                  </div>
                  <div className="sys-stat-label">Total Shops</div>
                </div>
              </div>

              {/* Active Shops */}
              <div className="sys-stat-card" onClick={() => navigate('/manageshops')} style={{ cursor: 'pointer' }}>
                <div className="sys-stat-icon-wrap active">
                  <CheckCircle size={28} />
                </div>
                <div className="sys-stat-body">
                  <div className="sys-stat-number">
                    {loadingStats ? '—' : (stats?.active_shops ?? 0)}
                  </div>
                  <div className="sys-stat-label">Active Shops</div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="sys-stat-card" onClick={() => navigate('/subscriptions')} style={{ cursor: 'pointer' }}>
                <div className="sys-stat-icon-wrap revenue">
                  <TrendingUp size={28} />
                </div>
                <div className="sys-stat-body">
                  <div className="sys-stat-number">
                    {loadingStats
                      ? '—'
                      : stats?.total_revenue != null
                      ? `₨${Number(stats.total_revenue).toLocaleString()}`
                      : '₨0'}
                  </div>
                  <div className="sys-stat-label">Total Revenue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Distribution */}
          <div className="sys-package-section">
            <h2 className="sys-section-title">PACKAGE DISTRIBUTION</h2>

            {loadingPackages ? (
              <div className="sys-loading-card">
                <RefreshCw size={20} className="sys-spin" />
                <span>Loading packages...</span>
              </div>
            ) : packages.length > 0 ? (
              <div className="sys-package-grid">
                {packages.map((pkg, idx) => {
                  const pct = totalShopsByPackage > 0
                    ? Math.min(((pkg.shop_count || 0) / totalShopsByPackage) * 100, 100)
                    : 0;
                  return (
                    <div className="sys-package-card" key={pkg.package_id ?? idx}>
                      <div className="sys-package-card-header">
                        <h3 className="sys-package-name">{pkg.name}</h3>
                        <span className="sys-package-badge">{pkg.shop_count || 0} shops</span>
                      </div>
                      <div className="sys-package-meta">
                        <span>₨{Number(pkg.price).toLocaleString()}/yr</span>
                        <span>{pkg.max_stores} stores · {pkg.max_users_per_store} users/store</span>
                      </div>
                      <div className="sys-pkg-bar-container">
                        <div
                          className={`sys-pkg-bar ${barColors[idx % barColors.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="sys-pkg-pct">{pct.toFixed(0)}% of total</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sys-loading-card">No package data available</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemAdminDashboard;