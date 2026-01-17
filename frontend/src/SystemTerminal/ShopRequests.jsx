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
  Calculator,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/ShopRequests.css';

const ShopRequests = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shopRequests, setShopRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchShopRequests();
  }, []);

  const fetchShopRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/shop-requests');
      const data = await response.json();
      setShopRequests(data);
    } catch (error) {
      console.error('Error fetching shop requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/shop-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchShopRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/shop-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        fetchShopRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
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

  const getPackageBadgeClass = (packageName) => {
    const name = packageName?.toLowerCase();
    if (name === 'starter') return 'starter';
    if (name === 'pro' || name === 'professional') return 'pro';
    if (name === 'enterprise') return 'enterprise';
    return 'starter';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
          <button className="nav-item active">
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
          <div className="breadcrumb">Admin &gt; Shop Requests</div>
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

        <div className="page-content">
          <div className="page-header">
            <h1 className="page-title">Shop Requests</h1>
            <p className="page-subtitle">Please Confirm the payment information below</p>
          </div>

          <div className="payment-info-card">
            <div className="card-header">
              <h2 className="card-header-title">Payment Information</h2>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                Loading shop requests...
              </div>
            ) : shopRequests.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No shop requests found
              </div>
            ) : (
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Amount Paid</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Sender Account</th>
                    <th>Pakage</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shopRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="amount-cell">{request.amount_paid}</td>
                      <td>{request.full_name}</td>
                      <td>{request.email}</td>
                      <td>{request.sender_account}</td>
                      <td>
                        <span className={`package-badge ${getPackageBadgeClass(request.package)}`}>
                          {request.package}
                        </span>
                      </td>
                      <td>{formatDate(request.date)}</td>
                      <td>{request.payment_method}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn approve"
                            onClick={() => handleApprove(request.id)}
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleReject(request.id)}
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopRequests;