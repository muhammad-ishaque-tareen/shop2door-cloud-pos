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
  Wrench,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/SystemSettings.css';

const SystemSettings = () => {
  const [showMenuDropdown, setShowMenuDropdown]       = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading]                         = useState(true);
  const [systemInfo, setSystemInfo]                   = useState(null);

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

  useEffect(() => { fetchSystemInfo(); }, []);

  // Fetch system / settings info from backend 
  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/system-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      }
    } catch (err) {
      console.error('Error fetching system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  // Profile image 
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
    const cls = size === 'dropdown' ? 'ss-avatar-initials' : 'ss-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  return (
    <div className="ss-admin-container">
      {/* SIDEBAR  */}
      <aside className="ss-admin-sidebar">
        <div className="ss-brand-header">
          <span className="ss-brand-title">SHOP2DOOR</span>
        </div>

        <nav className="ss-sidebar-nav">
          <button className="ss-nav-item" onClick={() => navigate('/systemadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>

          <div className="ss-nav-divider" />

          <button className="ss-nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} /><span>Shop Requests</span>
          </button>
          <button className="ss-nav-item" onClick={() => navigate('/manageshops')}>
            <Store size={18} /><span>Manage Shops</span>
          </button>

          <div className="ss-nav-divider" />

          <button className="ss-nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} /><span>Manage Packages</span>
          </button>
          <button className="ss-nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} /><span>Subscriptions</span>
          </button>

          <div className="ss-nav-divider" />

          {/* <button className="ss-nav-item active">
            <Settings size={18} /><span>Settings</span>
          </button> */}
          <button className="ss-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="ss-nav-item ss-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  MAIN  */}
      <main className="ss-admin-main">
        {/* Header */}
        <header className="ss-main-header">
          <div className="ss-breadcrumb">Admin &gt; Settings</div>

          <div className="ss-header-actions">
            {/* Menu dropdown */}
            <div className="ss-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="ss-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                Menu <span className="ss-dropdown-arrow">▼</span>
              </button>

              {showMenuDropdown && (
                <div className="ss-menu-dropdown">
                  <div className="ss-menu-section">
                    <h4 className="ss-menu-section-title">Quick Actions</h4>
                    <button className="ss-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemadmindashboard'); }}>
                      <LayoutDashboard size={18} /><span>Dashboard</span>
                    </button>
                    <button className="ss-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shoprequests'); }}>
                      <FileText size={18} /><span>Shop Requests</span>
                    </button>
                    <button className="ss-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/manageshops'); }}>
                      <Store size={18} /><span>Manage Shops</span>
                    </button>
                    <button className="ss-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/packages'); }}>
                      <Package size={18} /><span>Manage Packages</span>
                    </button>
                    <button className="ss-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/subscriptions'); }}>
                      <DollarSign size={18} /><span>Subscriptions</span>
                    </button>
                    {/* <button className="ss-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
                  </div>
                </div>
              )}
            </div>

            <div className="ss-icon-circle moon"><Moon size={16} /></div>
            <div className="ss-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="ss-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="ss-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="ss-profile-dropdown">
                  <div className="ss-profile-dropdown-header">
                    <div className="ss-profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
                    <div className="ss-profile-dropdown-info">
                      <h4 className="ss-profile-name">{user.name || 'Admin'}</h4>
                      <p className="ss-profile-role">{user.role || 'System Admin'}</p>
                    </div>
                  </div>
                  <div className="ss-profile-divider" />
                  <div className="ss-profile-details">
                    <div className="ss-profile-detail-item">
                      <span className="ss-detail-icon">📧</span>
                      <span className="ss-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="ss-profile-detail-item">
                      <span className="ss-detail-icon">📱</span>
                      <span className="ss-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="ss-profile-divider" />
                  <div className="ss-profile-actions">
                    <button className="ss-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemadminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    {/* <button className="ss-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
                    <button className="ss-profile-action-btn ss-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/*  PAGE CONTENT  */}
        <div className="ss-page-content">
          <div className="ss-page-header">
            <div>
              <h1 className="ss-page-title">Settings</h1>
              <p className="ss-page-subtitle">System configuration and preferences</p>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="ss-loading-state">
              <RefreshCw size={20} className="ss-spin" />
              <span>Loading settings...</span>
            </div>
          ) : (
            <div className="ss-under-dev-wrapper">
              {/* Icon */}
              <div className="ss-dev-icon-wrap">
                <Wrench size={40} className="ss-wrench-icon" />
              </div>

              {/* Headline */}
              <h2 className="ss-dev-title">Settings Panel Coming Soon</h2>
              <p className="ss-dev-subtitle">
                We're actively building the settings module. Soon you'll be able to manage
                system-wide configurations, notification preferences, security policies, and more —
                all from one place.
              </p>

              {/* Info cards pulled from backend (if available) */}
              {systemInfo && (
                <div className="ss-info-cards">
                  <div className="ss-info-card">
                    <ShieldCheck size={22} className="ss-info-card-icon" />
                    <div>
                      <div className="ss-info-card-label">System Version</div>
                      <div className="ss-info-card-value">{systemInfo.version || '—'}</div>
                    </div>
                  </div>
                  <div className="ss-info-card">
                    <Clock size={22} className="ss-info-card-icon" />
                    <div>
                      <div className="ss-info-card-label">Last Updated</div>
                      <div className="ss-info-card-value">
                        {systemInfo.last_updated
                          ? new Date(systemInfo.last_updated).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div className="ss-info-card">
                    <Settings size={22} className="ss-info-card-icon" />
                    <div>
                      <div className="ss-info-card-label">Environment</div>
                      <div className="ss-info-card-value">{systemInfo.environment || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SystemSettings;