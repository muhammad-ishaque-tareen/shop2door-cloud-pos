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
  Calculator
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/SystemAdminDashboard.css';

const SystemAdminDashboard = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    pendingRequests: 5,
    totalShops: 248,
    activeShops: 215
  });

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

  const handleLogOut = () => {
    navigate("/");
  };

  const renderProfileImage = (size = 'default') => {
    const imageProps = {
      src: `http://localhost:5000${user.image_url}`,
      alt: "Profile",
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
      }
    };

    const initialsClass = size === 'dropdown' ? 'avatar-initials' : 'profile-initials';
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';

    return user.image_url ? <img {...imageProps} /> : <span className={initialsClass}>{initials}</span>;
  };

  const packageData = [
    { name: 'Starter', shops: 65, color: '#6B7280' },
    { name: 'Professional', shops: 120, color: '#3B82F6' },
    { name: 'Enterprise', shops: 43, color: '#10B981' }
  ];

  const totalShops = packageData.reduce((sum, pkg) => sum + pkg.shops, 0);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="brand-header">
          <h1 className="brand-title">SHOP2DOOR</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <div className="nav-section-title">SHOP MANAGEMENT</div>
          <button className="nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} />
            <span>Shop Requests</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/manageshops')}>
            <Store size={18} />
            <span>Manage Shops</span>
          </button>
          <div className="nav-section-title">PACKAGES & BILLING</div>
          <button className="nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} />
            <span>Packages</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} />
            <span>Subscriptions</span>
          </button>
          <div className="nav-section-title">SYSTEM</div>
          <button className="nav-item" onClick={() => navigate('/settings')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="main-header">
          <div className="breadcrumb">Admin &gt; Dashboard</div>
          <div className="header-actions">
            <div className="menu-dropdown-container" ref={menuDropdownRef}>
              <button 
                className="btn-menu" 
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
                Menu <span className="dropdown-arrow">▼</span>
              </button>

              {showMenuDropdown && (
                <div className="menu-dropdown">
                  <div className="menu-section">
                    <h4 className="menu-section-title">Quick Actions</h4>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemadmindashboard'); }}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shoprequests'); }}>
                      <FileText size={18} />
                      <span>Shop Requests</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/manageshops'); }}>
                      <Store size={18} />
                      <span>Manage Shops</span>
                    </button>
                  </div>

                  <div className="menu-divider"></div>

                  <div className="menu-section">
                    <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={() => navigate('/settings')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="icon-circle calculator">
              <Calculator size={16} />
            </div>
            <div className="icon-circle bell">
              <Bell size={16} />
            </div>
            
            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button 
                className="profile-circle-btn" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">{user.name || 'Admin'}</h4>
                      <p className="profile-role">{user.role || 'System Admin'}</p>
                    </div>
                  </div>

                  <div className="profile-divider"></div>

                  <div className="profile-details">
                    <div className="profile-detail-item">
                      <span className="detail-icon">📧</span>
                      <span className="detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-icon">📱</span>
                      <span className="detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-divider"></div>

                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={handleMyProfile}>
                      <User size={18} />
                      <span>My Profile</span>
                    </button>
                    <button className="profile-action-btn" onClick={() => navigate('/settings')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                    <button className="profile-action-btn logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="welcome-section">
            <h1 className="welcome-title">Good Morning, {user.name || 'Altaf'}!</h1>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon pending">
                <FileText size={32} />
              </div>
              <div className="stat-number">{dashboardData.pendingRequests}</div>
              <div className="stat-label">Pending Requests</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon total">
                <Store size={32} />
              </div>
              <div className="stat-number">{dashboardData.totalShops}</div>
              <div className="stat-label">Total Shops</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon active">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="stat-number">{dashboardData.activeShops}</div>
              <div className="stat-label">Active Shops</div>
            </div>
          </div>

          <div className="package-distribution-card">
            <h2 className="card-title">Package Distribution</h2>
            
            <div className="package-list">
              {packageData.map((pkg, index) => (
                <div key={index} className="package-item">
                  <div className="package-info">
                    <span className="package-name">{pkg.name}</span>
                    <span className="package-count">{pkg.shops} shops</span>
                  </div>
                  <div className="package-bar-container">
                    <div 
                      className="package-bar" 
                      style={{ 
                        width: `${(pkg.shops / totalShops) * 100}%`,
                        backgroundColor: pkg.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemAdminDashboard;