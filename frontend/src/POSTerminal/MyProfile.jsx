import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  BarChart3, 
  FileText, 
  Settings, 
  Search, 
  RefreshCw,
  X,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './POSTerminalstyles/MyProfile.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [profileData, setProfileData] = useState({
    fullName: user.name || 'User',
    email: user.email || 'N/A',
    phone: user.phone || 'N/A',
    role: user.role || 'Cashier',
    branch: user.shop_name || 'N/A',
    employeeId: `EMP-${user.id || '0000'}`,
    joiningDate: user.created_at 
      ? new Date(user.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) 
      : 'N/A',
    ordersToday: '0',
    salesToday: 'Rs. 0'
  });

  const [formData, setFormData] = useState({
    fullName: profileData.fullName,
    email: profileData.email,
    phone: profileData.phone,
    role: profileData.role,
    branch: profileData.branch,
    newPassword: ''
  });

  useEffect(() => {
    setFormData({
      fullName: profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      role: profileData.role,
      branch: profileData.branch,
      newPassword: ''
    });
  }, [profileData]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.phone,
          password: formData.newPassword || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = {
          ...user,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setProfileData(prev => ({
          ...prev,
          fullName: data.user.name,
          email: data.user.email,
          phone: data.user.phone
        }));

        setShowUpdateForm(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/");
  };

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

  const handleProfileLogout = () => {
    setShowProfileDropdown(false);
    handleLogOut();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderProfileImage = (size = 'default') => {
    const imageProps = {
      src: `http://localhost:5000${user.image_url}`,
      alt: "Profile",
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: size === 'avatar' ? '12px' : '50%'
      }
    };

    const initialsClass = size === 'avatar' ? 'avatar-text' : 
                         size === 'dropdown' ? 'avatar-initials' : 'profile-initials';
    
    const initials = user.name?.substring(0, 2).toUpperCase() || 
                    (size === 'avatar' ? 'PIC' : 'AM');

    return user.image_url ? (
      <img {...imageProps} />
    ) : (
      <span className={initialsClass}>{initials}</span>
    );
  };

  return (
    <div className="profile-container">
      {/* ==================== SIDEBAR ==================== */}
      <aside className="profile-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/posterminal')}>
            <User size={18} />
            <span>POS Terminal</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/shiftreport')}>
            <FileText size={18} />
            <span>Shift Report</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/findproducts')}>
            <Search size={18} />
            <span>Find Products</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/returnproduct')}>
            <RefreshCw size={18} />
            <span>Return Product</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/mysales')}>
            <BarChart3 size={18} />
            <span>My Sales</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/settingss')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item active">
            <User size={18} />
            <span>My Profile</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="profile-main">
        {/* ==================== HEADER ==================== */}
        <header className="main-header">
          <div className="breadcrumb">POS &gt; My Profile</div>
          
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
                    <button className="menu-item" onClick={() => { 
                      setShowMenuDropdown(false); 
                      navigate('/posterminal'); 
                    }}>
                      <ShoppingCart size={18} />
                      <span>New Sale</span>
                    </button>
                    <button className="menu-item" onClick={() => { 
                      setShowMenuDropdown(false); 
                      navigate('/findproducts'); 
                    }}>
                      <Search size={18} />
                      <span>Find Products</span>
                    </button>
                    <button className="menu-item" onClick={() => { 
                      setShowMenuDropdown(false); 
                      navigate('/shiftreport'); 
                    }}>
                      <FileText size={18} />
                      <span>Shift Report</span>
                    </button>
                    <button className="menu-item" onClick={() => { 
                      setShowMenuDropdown(false); 
                      navigate('/mysales'); 
                    }}>
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
                    <button className="menu-item" onClick={() => navigate('/settingss')}>
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
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
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
                    <button className="profile-action-btn" onClick={() => navigate('/settingss')}>
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

        {/* ==================== PROFILE CONTENT ==================== */}
        <div className="profile-content">
          <div className="profile-header-section">
            <h2 className="profile-title">My Profile</h2>
            <p className="profile-subtitle">View and update your information</p>
          </div>

          {/* New Layout - Similar to Screenshot */}
          <div className="profile-layout-new">
            {/* Left Column - Profile Card */}
            <div className="profile-card-new">
              <div className="profile-avatar-large">
                {renderProfileImage('avatar')}
              </div>

              <h3 className="profile-name-large">{profileData.fullName}</h3>
              
              <p className="profile-role-large">{profileData.role} • {profileData.branch}</p>

              <button className="btn-edit-profile" onClick={() => setShowUpdateForm(true)}>
                <Edit2 size={16} />
                Edit Profile
              </button>

              <button className="btn-change-picture">
                Change your picture
              </button>
            </div>

            {/* Right Column - Profile Details */}
            <div className="profile-info-card">
              <h3 className="info-card-title">Profile Information</h3>

              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Employee ID</div>
                  <div className="info-value">{profileData.employeeId}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Full Name</div>
                  <div className="info-value">{profileData.fullName}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Email Address</div>
                  <div className="info-value">{profileData.email}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Phone Number</div>
                  <div className="info-value">{profileData.phone}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Role</div>
                  <div className="info-value">{profileData.role}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Branch</div>
                  <div className="info-value">{profileData.branch}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">Joining Date</div>
                  <div className="info-value">{profileData.joiningDate}</div>
                </div>
              </div>

              <div className="performance-section">
                <h4 className="performance-title">Today's Performance</h4>
                
                <div className="performance-stats">
                  <div className="performance-card orders-card">
                    <div className="performance-number">{profileData.ordersToday}</div>
                    <div className="performance-label">Orders Today</div>
                  </div>
                  
                  <div className="performance-card sales-card">
                    <div className="performance-number sales-number">{profileData.salesToday}</div>
                    <div className="performance-label">Sales Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== MODAL FOR UPDATE FORM ==================== */}
      {showUpdateForm && (
        <div className="modal-overlay" onClick={() => setShowUpdateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Update Profile</h3>
              <button className="modal-close-btn" onClick={() => setShowUpdateForm(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input purple-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="form-input gray-input"
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input purple-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  className="form-input gray-input"
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Branch</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  className="form-input gray-input"
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Leave blank to keep current"
                  className="form-input purple-input"
                />
              </div>

              <button className="btn-save-changes" onClick={handleSaveChanges}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;