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
import './SystemTerminalStyles/Subscriptions.css';

const Subscriptions = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Hard-coded subscription data
  const [subscriptions] = useState([
    {
      id: 1,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 2,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 3,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 4,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 5,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 6,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 7,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 8,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    },
    {
      id: 9,
      shop: 'Fresh Mart',
      package: 'Professional',
      amount: '$79/mo',
      startDate: 'Dec 10, 2024',
      nextBilling: 'Jan 10, 2025',
      status: 'Active'
    }
  ]);

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

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="brand-header">
          <h1 className="brand-title">SHOP2DOOR</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/systemadmindashboard')}>
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
          <button className="nav-item active">
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
          <div className="breadcrumb">Admin &gt; Subscriptions</div>
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

        <div className="subscriptions-content">
          <div className="subscriptions-header">
            <div>
              <h1 className="subscriptions-title">Subscriptions</h1>
              <p className="subscriptions-subtitle">View active subscriptions and billing</p>
            </div>
          </div>

          <div className="table-container">
            <table className="subscriptions-table">
              <thead>
                <tr>
                  <th>SHOP</th>
                  <th>PACKAGE</th>
                  <th>AMOUNT</th>
                  <th>START DATE</th>
                  <th>NEXT BILLING</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>{subscription.shop}</td>
                    <td>{subscription.package}</td>
                    <td>{subscription.amount}</td>
                    <td>{subscription.startDate}</td>
                    <td>{subscription.nextBilling}</td>
                    <td>
                      <span className="status-badge active">{subscription.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subscriptions;