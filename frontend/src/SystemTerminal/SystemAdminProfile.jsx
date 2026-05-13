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
  ArrowLeft,
  Camera,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/SystemAdminProfile.css';

const SystemAdminProfile = () => {
  const [showMenuDropdown, setShowMenuDropdown]     = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditModal, setShowEditModal]           = useState(false);

  // Form fields
  const [editName, setEditName]         = useState('');
  const [editPhone, setEditPhone]       = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState(null);

  // UI state
  const [saving, setSaving]       = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');

  const menuDropdownRef   = useRef(null);
  const profileDropdownRef = useRef(null);
  const fileInputRef      = useRef(null);
  const modalFileInputRef = useRef(null);

  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || '{}')
  );
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

  //  Pre-fill edit form when modal opens 
  const openEditModal = () => {
    setEditName(user.name || '');
    setEditPhone(user.phone || '');
    setEditPassword('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg('');
    setSuccessMsg('');
    setShowEditModal(true);
  };

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
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'sys-avatar-initials' : 'sys-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  //  Avatar in content area 
  const renderContentAvatar = () => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'SA';
    if (user.image_url) {
      return (
        <img
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
        />
      );
    }
    return <span className="sap-avatar-text">{initials}</span>;
  };

  //  Modal avatar preview 
  const renderModalAvatar = () => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'SA';
    if (previewUrl) {
      return (
        <img
          src={previewUrl}
          alt="Preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    if (user.image_url) {
      return (
        <img
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    return <span className="sap-modal-initials">{initials}</span>;
  };

  //  File selection 
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  //  Save profile 
  const handleSave = async () => {
    if (!editName.trim()) {
      setErrorMsg('Name is required.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      if (editPhone.trim())    formData.append('phone', editPhone.trim());
      if (editPassword.trim()) formData.append('password', editPassword.trim());
      if (selectedFile)        formData.append('image', selectedFile);

      const res = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Merge updated fields back into localStorage user
        const updatedUser = {
          ...user,
          name:      data.user.name,
          phone:     data.user.phone,
          image_url: data.user.image_url,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('[PROFILE] Save error:', err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sap-container">

      {/*  SIDEBAR */}
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
          <button className="sys-nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} /><span>Subscriptions</span>
          </button>

          <div className="sys-nav-divider" />

          {/* <button className="sys-nav-item" onClick={() => navigate('/systemsettings')}>
            <Settings size={18} /><span>Settings</span>
          </button> */}
          <button className="sys-nav-item active">
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="sys-nav-item sys-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN  */}
      <main className="sys-admin-main">

        {/* Header */}
        <header className="sys-main-header">
          <div className="sys-breadcrumb">
            <button className="sap-back-btn" onClick={() => navigate('/systemadmindashboard')}>
              <ArrowLeft size={16} />
            </button>
            Admin &gt; My Profile
          </div>

          <div className="sys-header-actions">

            {/* Menu dropdown */}
            <div className="sys-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="sys-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
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
                    {/* <button className="sys-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemsettings'); }}>
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
              <button className="sys-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
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

        {/*  PROFILE CONTENT  */}
        <div className="sys-dashboard-content">

          <div className="sap-page-title-row">
            <h1 className="sap-page-title">My Profile</h1>
            <p className="sap-page-subtitle">View and manage your account information</p>
          </div>

          <div className="sap-layout">

            {/*  Left: Avatar card  */}
            <div className="sap-avatar-card">
              <div
                className="sap-avatar-large"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {renderContentAvatar()}
                <div className="sap-camera-overlay">
                  <Camera size={13} color="white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <h3 className="sap-name-large">{user.name || 'System Admin'}</h3>
              <p className="sap-role-large">{user.role || 'system_admin'}</p>

              <button className="sap-btn-edit" onClick={openEditModal}>
                <User size={15} /> Edit Profile
              </button>

              {selectedFile && (
                <>
                  <p className="sap-selected-file">📎 {selectedFile.name}</p>
                  <button
                    className="sap-btn-change-pic"
                    disabled={uploadingPic}
                    onClick={async () => {
                      setUploadingPic(true);
                      try {
                        const fd = new FormData();
                        fd.append('name', user.name);
                        fd.append('image', selectedFile);
                        const res = await fetch('http://localhost:5000/api/users/update-profile', {
                          method: 'PUT',
                          headers: { Authorization: `Bearer ${token}` },
                          body: fd,
                        });
                        const data = await res.json();
                        if (res.ok) {
                          const updatedUser = { ...user, image_url: data.user.image_url };
                          localStorage.setItem('user', JSON.stringify(updatedUser));
                          setUser(updatedUser);
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setUploadingPic(false);
                      }
                    }}
                  >
                    {uploadingPic ? 'Uploading…' : 'Upload Photo'}
                  </button>
                </>
              )}
            </div>

            {/*  Right: Info card  */}
            <div className="sap-info-card">
              <h2 className="sap-info-title">Account Information</h2>

              <div className="sap-info-grid">
                <div className="sap-info-item">
                  <p className="sap-info-label">Full Name</p>
                  <p className="sap-info-value">{user.name || '—'}</p>
                </div>
                <div className="sap-info-item">
                  <p className="sap-info-label">Role</p>
                  <p className="sap-info-value" style={{ textTransform: 'capitalize' }}>
                    {(user.role || 'system_admin').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="sap-info-item">
                  <p className="sap-info-label">Email Address</p>
                  <p className="sap-info-value">{user.email || '—'}</p>
                </div>
                <div className="sap-info-item">
                  <p className="sap-info-label">Phone Number</p>
                  <p className="sap-info-value">{user.phone || '—'}</p>
                </div>
                <div className="sap-info-item">
                  <p className="sap-info-label">User ID</p>
                  <p className="sap-info-value">{user.id || '—'}</p>
                </div>
                <div className="sap-info-item">
                  <p className="sap-info-label">Account Type</p>
                  <p className="sap-info-value">System Administrator</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/*  EDIT MODAL */}
      {showEditModal && (
        <div className="sap-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="sap-modal-content">

            <div className="sap-modal-header">
              <h3 className="sap-modal-title">
                <User size={18} style={{ marginRight: '0.5rem', color: '#9333ea' }} />
                Edit Profile
              </h3>
              <button className="sap-modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="sap-modal-body">

              {/* Avatar preview */}
              <div className="sap-modal-avatar-wrap">
                <div
                  className="sap-modal-avatar"
                  onClick={() => modalFileInputRef.current?.click()}
                  title="Click to change photo"
                >
                  {renderModalAvatar()}
                  <div className="sap-modal-camera">
                    <Camera size={11} color="white" />
                  </div>
                </div>
                <p className="sap-modal-avatar-hint">Click avatar to change photo</p>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Alerts */}
              {successMsg && (
                <div className="sap-alert sap-alert-success">
                  <Check size={16} /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="sap-alert sap-alert-error">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {/* Name */}
              <div className="sap-form-group">
                <label className="sap-form-label">
                  Full Name <span className="sap-required">*</span>
                </label>
                <input
                  className="sap-form-input sap-input-purple"
                  type="text"
                  placeholder="Enter your name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              {/* Email (read-only) */}
              <div className="sap-form-group">
                <label className="sap-form-label">Email Address</label>
                <input
                  className="sap-form-input sap-input-gray"
                  type="email"
                  value={user.email || ''}
                  readOnly
                />
              </div>

              {/* Phone */}
              <div className="sap-form-group">
                <label className="sap-form-label">Phone Number</label>
                <input
                  className="sap-form-input sap-input-purple"
                  type="tel"
                  placeholder="Enter phone number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="sap-form-group">
                <label className="sap-form-label">New Password</label>
                <input
                  className="sap-form-input sap-input-purple"
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>

              {/* Save button */}
              <button className="sap-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <><Check size={16} /> Save Changes</>}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemAdminProfile;