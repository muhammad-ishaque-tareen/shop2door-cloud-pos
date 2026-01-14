import React, { useState, useEffect, useRef} from 'react';
import { ShoppingCart, FileText, Search, Package, BarChart3, Settings, User, LogOut, Moon, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './POSTerminalstyles/ShiftReport.css';
import { productAPI } from '../services/api';
const ShiftReport = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [shiftDuration, setShiftDuration] = useState('5h 32m');
  const salesMetrics = {
    totalSales: 1245.50,
    cardSales: 756.00,
    transactions: 47,
    cashSales: 489.50,
    discountsGiven: 489.50,
    refunds: 489.50
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  
  
const handleMyProfile = () => {
  navigate('/myprofile');
};

const handleLogOut = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate('/');
};

const toggleDarkMode = () => {
  setIsDarkMode(!isDarkMode);
};

const handleProfileLogout = () => {
  setShowProfileDropdown(false);
  handleLogOut();
};

  return (
    <div className="shift-report-container">
      {/* Sidebar */}
      <aside className="shift-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/posterminal')}>
            <User size={18} />
            <span>POS Terminal</span>
          </button>
          <button className="nav-item active">
            <FileText size={18} />
            <span>Shift Report</span>
          </button>
          <button className="nav-item" onClick={()=>navigate('/findproducts')}>
            <Search size={18} />
            <span>Find Products</span>
          </button>
          <button className="nav-item" onClick={()=>navigate('/returnproduct')}>
            <Package size={18} />
            <span>Return Product</span>
          </button>
          <button className="nav-item"  onClick={()=>navigate('/mysales')}>
            <BarChart3 size={18} />
            <span>My Sales</span>
          </button>
          <button className="nav-item"  onClick={()=>navigate('/settingss')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/myprofile')}>
            <User size={18} />
            <span>My Profile</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="shift-main">
        {/* Header */}
        <header className="main-header">
  <div className="breadcrumb">POS &gt; Shift Report</div>
  <div className="header-actions">
    <button className="btn-shift-active">Shift Active</button>
    
    {/* Menu Dropdown */}
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
            <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/posterminal'); }}>
              <ShoppingCart size={18} />
              <span>New Sale</span>
            </button>
            <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/findproducts'); }}>
              <Search size={18} />
              <span>Find Products</span>
            </button>
            <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shiftreport'); }}>
              <FileText size={18} />
              <span>Shift Report</span>
            </button>
            <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}>
              <BarChart3 size={18} />
              <span>My Sales</span>
            </button>
          </div>

          <div className="menu-divider"></div>

          <div className="menu-section">
            <h4 className="menu-section-title">Settings</h4>
            <button className="menu-item" onClick={toggleDarkMode}>
              {isDarkMode ? '☀️' : '🌙'}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button className="menu-item"  onClick={()=>navigate('/settingss')}>
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>

    <div className="icon-circle moon">🌙</div>
    <div className="icon-circle calculator">🧮</div>
    
    {/* Profile Dropdown */}
    <div className="profile-dropdown-container" ref={profileDropdownRef}>
    <button 
          className="profile-circle-btn" 
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
    >
          {user.image_url ? (
            <img 
              src={`http://localhost:5000${user.image_url}`} 
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
          ) : (
            <span className="profile-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>
          )}
    </button>

      {showProfileDropdown && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">
                {user.image_url ? (
                  <img 
                    src={`http://localhost:5000${user.image_url}`} 
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  <span className="avatar-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>
                )}
          </div>
            <div className="profile-dropdown-info">
              <h4 className="profile-name">{user.name || 'User'}</h4>
              <p className="profile-role">{user.role || 'Cashier'}</p>
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
            <button className="profile-action-btn"  onClick={()=>navigate('/settingss')}>
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button className="profile-action-btn logout-btn" onClick={handleProfileLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
</header>

        {/* Content */}
        <div className="shift-content">
          <div className="content-header">
            <p className="subtitle">Comprehensive shift performance report</p>
            <button className="btn-end-shift">End Shift</button>
          </div>

          {/* Shift Info Bar */}
          <div className="shift-info-bar">
            <span className="shift-info-text">Start Time: 9:00 AM</span>
            <span className="shift-info-text">Duration: {shiftDuration}</span>
          </div>

          {/* Sales Metrics */}
          <div className="metrics-section">
            <div className="section-header">
              <span className="section-icon">💰</span>
              <h2 className="section-title">Sales Metrics</h2>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrapper purple">
                  <span className="metric-icon">💵</span>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Total Sales</p>
                  <p className="metric-value">Rs.{salesMetrics.totalSales.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper blue">
                  <span className="metric-icon">💳</span>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Cash Sales</p>
                  <p className="metric-value">Rs.{salesMetrics.cardSales.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper pink">
                  <span className="metric-icon">📊</span>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Transactions</p>
                  <p className="metric-value">{salesMetrics.transactions}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper green">
                  <span className="metric-icon">💵</span>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Card Sales</p>
                  <p className="metric-value">Rs.{salesMetrics.cashSales.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper orange">
                  <span className="metric-icon">🏷️</span>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Discounts Given</p>
                  <p className="metric-value">Rs.{salesMetrics.discountsGiven.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper red">
                  <span className="metric-icon">↩️</span>
                </div>
                <div className="metric-content">
                  <p className="metric-label">Refunds</p>
                  <p className="metric-value">Rs.{salesMetrics.refunds.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShiftReport;