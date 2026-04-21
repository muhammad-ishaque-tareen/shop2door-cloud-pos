import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Store,
  Plus,
  Users,
  ShoppingCart,
  Package as PackageIcon,
  Diamond,
  LogOut,
  User,
  Bell,
  Moon,
  Settings,
  Edit2,
  X,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyProfile.css';

const Myprofile = () => {
  const navigate = useNavigate();

  const [showMenuDropdown, setShowMenuDropdown]     = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showUpdateForm, setShowUpdateForm]         = useState(false);
  const [stores, setStores]                         = useState([]);
  const [loadingStores, setLoadingStores]           = useState(true);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  const [profileData, setProfileData] = useState({
    fullName:   user.name      || 'Admin',
    email:      user.email     || 'N/A',
    phone:      user.phone     || 'N/A',
    role:       user.role      || 'Shop Admin',
    branch:     user.shop_name || 'N/A',
    employeeId: `EMP-${user.id || '0000'}`,
    joiningDate: user.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        })
      : 'N/A',
  });

  const [formData, setFormData] = useState({
    fullName:    profileData.fullName,
    email:       profileData.email,
    phone:       profileData.phone,
    role:        profileData.role,
    branch:      profileData.branch,
    newPassword: '',
  });

  // Keep form in sync with profileData
  useEffect(() => {
    setFormData({
      fullName:    profileData.fullName,
      email:       profileData.email,
      phone:       profileData.phone,
      role:        profileData.role,
      branch:      profileData.branch,
      newPassword: '',
    });
  }, [profileData]);

  // Fetch stores for "All Stores" dropdown
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stores', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setStores(await res.json());
      } catch (e) {
        console.error('Error fetching stores:', e);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuDropdownRef.current    && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:     formData.fullName,
          phone:    formData.phone,
          password: formData.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, name: data.user.name, email: data.user.email, phone: data.user.phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setProfileData(prev => ({
          ...prev,
          fullName: data.user.name,
          email:    data.user.email,
          phone:    data.user.phone,
        }));
        setShowUpdateForm(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    }
  };

  // Shop logo (same logic as Dashboard)
  const shopLogoUrl = user.shop_logo ? `http://localhost:5000${user.shop_logo}` : null;

  const renderShopLogo = () => {
    if (shopLogoUrl) {
      return (
        <img
          src={shopLogoUrl}
          alt={user.shop_name || 'Shop'}
          className="mp-sidebar-logo-img"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      );
    }
    return <span className="mp-brand-title">{user.shop_name || 'Shop'}</span>;
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url) {
      return (
        <img
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            borderRadius: size === 'avatar' ? '12px' : '50%',
          }}
        />
      );
    }
    const cls = size === 'avatar'    ? 'mp-avatar-text'
              : size === 'dropdown'  ? 'mp-avatar-initials'
              :                        'mp-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  return (
    <div className="mp-container">

      {/* ── SIDEBAR (identical structure to ShopAdminDashboard) ── */}
      <aside className="mp-sidebar">
        <div className="mp-brand-header">
          {renderShopLogo()}
        </div>

        <nav className="mp-sidebar-nav">
          <button className="mp-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18} /><span>Shop Profile</span>
          </button>
          <button className="mp-nav-item active">
            <User size={18} /><span>My Profile</span>
          </button>

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18} /><span>My Stores</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/addstore')}>
            <Plus size={18} /><span>Add Store</span>
          </button>

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} /><span>My Users</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/adduser')}>
            <Plus size={18} /><span>Add User</span>
          </button>

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18} /><span>Products</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} /><span>Suppliers</span>
          </button>

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18} /><span>Subscription</span>
          </button>
          <button className="mp-nav-item mp-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="mp-main">

        {/* ── HEADER (identical to ShopAdminDashboard) ── */}
        <header className="mp-header">
          <div className="mp-breadcrumb">
            <button className="mp-back-btn" onClick={() => navigate('/shopadmindashboard')}>
              <ArrowLeft size={16} />
            </button>
            Admin &gt; My Profile
          </div>

          <div className="mp-header-actions">

            {/* All Stores dropdown */}
            <div className="mp-menu-dropdown-container" ref={menuDropdownRef}>
              <button
                className="mp-btn-menu"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
                All Stores <span className="mp-dropdown-arrow">▼</span>
              </button>

              {showMenuDropdown && (
                <div className="mp-menu-dropdown">
                  <div className="mp-menu-section">
                    <h4 className="mp-menu-section-title">My Stores</h4>
                    {loadingStores ? (
                      <div className="mp-menu-item">Loading...</div>
                    ) : stores.length > 0 ? (
                      stores.map((store) => (
                        <button key={store.id} className="mp-menu-item"
                          onClick={() => setShowMenuDropdown(false)}>
                          <Store size={18} /><span>{store.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="mp-menu-item">No stores found</div>
                    )}
                  </div>
                  <div className="mp-menu-divider" />
                  <div className="mp-menu-section">
                    <button className="mp-menu-item"
                      onClick={() => { setShowMenuDropdown(false); navigate('/mystores'); }}>
                      <Store size={18} /><span>View All Stores</span>
                    </button>
                    <button className="mp-menu-item"
                      onClick={() => { setShowMenuDropdown(false); navigate('/addstore'); }}>
                      <Plus size={18} /><span>Add New Store</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mp-icon-circle moon"><Moon size={16} /></div>
            <div className="mp-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="mp-profile-dropdown-container" ref={profileDropdownRef}>
              <button
                className="mp-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="mp-profile-dropdown">
                  <div className="mp-profile-dropdown-header">
                    <div className="mp-profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
                    <div className="mp-profile-dropdown-info">
                      <h4 className="mp-profile-name">{user.name || 'Admin'}</h4>
                      <p className="mp-profile-role">{user.role || 'Shop Admin'}</p>
                    </div>
                  </div>
                  <div className="mp-profile-divider" />
                  <div className="mp-profile-details">
                    <div className="mp-profile-detail-item">
                      <span className="mp-detail-icon">📧</span>
                      <span className="mp-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="mp-profile-detail-item">
                      <span className="mp-detail-icon">📱</span>
                      <span className="mp-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mp-profile-divider" />
                  <div className="mp-profile-actions">
                    <button className="mp-profile-action-btn"
                      onClick={() => { setShowProfileDropdown(false); navigate('/adminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="mp-profile-action-btn mp-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div className="mp-content">
          <div className="mp-page-title-row">
            <h2 className="mp-page-title">My Profile</h2>
            <p className="mp-page-subtitle">View and update your account information</p>
          </div>

          <div className="mp-layout">

            {/* Left card — avatar + quick actions */}
            <div className="mp-avatar-card">
              <div className="mp-avatar-large">
                {renderProfileImage('avatar')}
              </div>
              <h3 className="mp-name-large">{profileData.fullName}</h3>
              <p className="mp-role-large">{profileData.role} &bull; {profileData.branch}</p>

              <button className="mp-btn-edit" onClick={() => setShowUpdateForm(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
              <button className="mp-btn-change-pic">Change your picture</button>
            </div>

            {/* Right card — profile info + performance */}
            <div className="mp-info-card">
              <h3 className="mp-info-title">Profile Information</h3>

              <div className="mp-info-grid">
                <div className="mp-info-item">
                  <div className="mp-info-label">Employee ID</div>
                  <div className="mp-info-value">{profileData.employeeId}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Full Name</div>
                  <div className="mp-info-value">{profileData.fullName}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Email Address</div>
                  <div className="mp-info-value">{profileData.email}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Phone Number</div>
                  <div className="mp-info-value">{profileData.phone}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Role</div>
                  <div className="mp-info-value">{profileData.role}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Shop / Branch</div>
                  <div className="mp-info-value">{profileData.branch}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Joining Date</div>
                  <div className="mp-info-value">{profileData.joiningDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── EDIT MODAL ── */}
      {showUpdateForm && (
        <div className="mp-modal-overlay" onClick={() => setShowUpdateForm(false)}>
          <div className="mp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <h3 className="mp-modal-title">Update Profile</h3>
              <button className="mp-modal-close-btn" onClick={() => setShowUpdateForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="mp-modal-body">

              <div className="mp-form-group">
                <label className="mp-form-label">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName}
                  onChange={handleInputChange} className="mp-form-input mp-input-purple" />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Email</label>
                <input type="email" name="email" value={formData.email}
                  className="mp-form-input mp-input-gray" disabled />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Phone</label>
                <input type="text" name="phone" value={formData.phone}
                  onChange={handleInputChange} className="mp-form-input mp-input-purple" />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Role</label>
                <input type="text" name="role" value={formData.role}
                  className="mp-form-input mp-input-gray" disabled />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Branch</label>
                <input type="text" name="branch" value={formData.branch}
                  className="mp-form-input mp-input-gray" disabled />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">New Password</label>
                <input type="password" name="newPassword" value={formData.newPassword}
                  onChange={handleInputChange} placeholder="Leave blank to keep current"
                  className="mp-form-input mp-input-purple" />
              </div>

              <button className="mp-btn-save" onClick={handleSaveChanges}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Myprofile;