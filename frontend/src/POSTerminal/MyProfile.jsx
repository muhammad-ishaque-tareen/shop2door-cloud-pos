import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, User, LogOut, BarChart3, FileText,
  Settings, Search, RefreshCw, X, Edit2, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './POSTerminalstyles/MyProfile.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const [showMenuDropdown, setShowMenuDropdown]       = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode]                   = useState(false);
  const [showUpdateForm, setShowUpdateForm]           = useState(false);
  const [saving, setSaving]                           = useState(false);
  const [uploadingPic, setUploadingPic]               = useState(false);

  const [currentUser, setCurrentUser] = useState(
    () => JSON.parse(localStorage.getItem('user') || '{}')
  );

  const [previewUrl, setPreviewUrl]               = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const pictureInputRef    = useRef(null);

  const [formData, setFormData] = useState({
    fullName   : currentUser.name  || '',
    phone      : currentUser.phone || '',
    newPassword: '',
  });

  useEffect(() => {
    if (showUpdateForm) {
      setFormData({
        fullName   : currentUser.name  || '',
        phone      : currentUser.phone || '',
        newPassword: '',
      });
    }
  }, [showUpdateForm]);

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

  const getImageSrc = () => {
    if (previewUrl) return previewUrl;
    if (currentUser.image_url) return `http://localhost:5000${currentUser.image_url}`;
    return null;
  };

  const getInitials = () => currentUser.name?.substring(0, 2).toUpperCase() || 'ME';

  const renderAvatar = (size = 'default') => {
    const src = getImageSrc();
    const style = {
      width: '100%', height: '100%', objectFit: 'cover',
      borderRadius: size === 'avatar' ? '12px' : '50%',
    };
    const initialsClass =
      size === 'avatar'   ? 'avatar-text'     :
      size === 'dropdown' ? 'avatar-initials' : 'profile-initials';
    return src
      ? <img src={src} alt="Profile" style={style} />
      : <span className={initialsClass}>{getInitials()}</span>;
  };

  const handlePictureFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleChangePicture = async () => {
    if (!selectedImageFile) {
      pictureInputRef.current?.click();
      return;
    }
    try {
      setUploadingPic(true);
      const token = localStorage.getItem('token');
      const fd    = new FormData();
      fd.append('image', selectedImageFile);
      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method : 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body   : fd,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');
      const updatedUser = { ...currentUser, image_url: data.user.image_url };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setPreviewUrl(null);
      setSelectedImageFile(null);
    } catch (err) {
      alert(err.message || 'Failed to upload picture.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.fullName.trim()) { alert('Full name is required.'); return; }
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const fd    = new FormData();
      fd.append('name',  formData.fullName.trim());
      fd.append('phone', formData.phone.trim());
      if (formData.newPassword.trim()) fd.append('password', formData.newPassword.trim());
      if (selectedImageFile)           fd.append('image', selectedImageFile);

      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method : 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body   : fd,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');

      const updatedUser = {
        ...currentUser,
        name     : data.user.name,
        phone    : data.user.phone,
        image_url: data.user.image_url ?? currentUser.image_url,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setPreviewUrl(null);
      setSelectedImageFile(null);
      setShowUpdateForm(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleDarkMode      = () => setIsDarkMode(!isDarkMode);
  const handleProfileLogout = () => { setShowProfileDropdown(false); handleLogOut(); };

  const profileData = {
    fullName   : currentUser.name      || 'User',
    email      : currentUser.email     || 'N/A',
    phone      : currentUser.phone     || 'N/A',
    role       : currentUser.role      || 'Cashier',
    branch     : currentUser.shop_name || 'N/A',
    employeeId : `EMP-${currentUser.id || '0000'}`,
    joiningDate: currentUser.created_at
      ? new Date(currentUser.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A',
  };

  return (
    <div className="profile-container">
      <input
        ref={pictureInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handlePictureFileChange}
      />

      <aside className="profile-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{currentUser.shop_name || 'Shop2Door'}</h1>
        </div>
        <nav className="sidebar-nav">
          <button 
          className="nav-item" onClick={() => navigate('/posterminal')}><User size={18} /><span>POS Terminal</span></button>
          {/* <button className="nav-item" onClick={() => navigate('/shiftreport')}><FileText size={18} /><span>Shift Report</span></button> */}

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/findproducts')}><Search size={18} /><span>Find Products</span></button>
          <button className="nav-item" onClick={() => navigate('/returnproduct')}><RefreshCw size={18} /><span>Return Product</span></button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/mysales')}><BarChart3 size={18} /><span>My Sales</span></button>
          {/* <button className="nav-item" onClick={() => navigate('/settings')}><Settings size={18} /><span>Settings</span></button> */}

          <div className="nav-divider" />
          <button className="nav-item active"><User size={18} /><span>My Profile</span></button>
          <button className="nav-item" onClick={handleLogOut}><LogOut size={18} /><span>Logout</span></button>
        </nav>
      </aside>

      <main className="profile-main">
        <header className="main-header">
          <div className="breadcrumb">POS &gt; My Profile</div>
          <div className="header-actions">
            <button className="btn-shift-active">Shift Active</button>

            <div className="menu-dropdown-container" ref={menuDropdownRef}>
              <button className="btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                Menu <span className="dropdown-arrow">&#9660;</span>
              </button>
              {showMenuDropdown && (
                <div className="menu-dropdown">
                  <div className="menu-section">
                    <h4 className="menu-section-title">Quick Actions</h4>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/posterminal'); }}><ShoppingCart size={18} /><span>New Sale</span></button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/findproducts'); }}><Search size={18} /><span>Find Products</span></button>
                    {/* <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shiftreport'); }}><FileText size={18} /><span>Shift Report</span></button> */}
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}><BarChart3 size={18} /><span>My Sales</span></button>
                  </div>
                  <div className="menu-divider"></div>
                  {/* <div className="menu-section">
                    <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={toggleDarkMode}>{isDarkMode ? '\u2600\ufe0f' : '\ud83c\udf19'}<span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span></button>
                    <button className="menu-item" onClick={() => navigate('/settingss')}><Settings size={18} /><span>Settings</span></button>
                  </div> */}
                </div>
              )}
            </div>

            {/* <div className="icon-circle moon"></div>
            <div className="icon-circle calculator"></div> */}

            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button className="profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderAvatar()}
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">{renderAvatar('dropdown')}</div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">{currentUser.name || 'User'}</h4>
                      <p className="profile-role">{currentUser.role || 'Cashier'}</p>
                    </div>
                  </div>
                  <div className="profile-divider"></div>
                  <div className="profile-details">
                    <div className="profile-detail-item"><span className="detail-icon">📧</span><span className="detail-text">{currentUser.email || 'N/A'}</span></div>
                    <div className="profile-detail-item"><span className="detail-icon">📱</span><span className="detail-text">{currentUser.phone || 'N/A'}</span></div>
                  </div>
                  <div className="profile-divider"></div>
                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={() => navigate('/myprofile')}><User size={18} /><span>My Profile</span></button>
                    {/* <button className="profile-action-btn" onClick={() => navigate('/settingss')}><Settings size={18} /><span>Settings</span></button> */}
                    <button className="profile-action-btn logout-btn" onClick={handleProfileLogout}><LogOut size={18} /><span>Logout</span></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="profile-content">
          <div className="profile-header-section">
            <h2 className="profile-title">My Profile</h2>
            <p className="profile-subtitle">View and update your information</p>
          </div>

          <div className="profile-layout-new">
            <div className="profile-card-new">
              <div
                className="profile-avatar-large"
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => pictureInputRef.current?.click()}
                title="Click to change picture"
              >
                {renderAvatar('avatar')}
                <div style={{
                  position: 'absolute', bottom: 6, right: 6,
                  background: '#7c3aed', borderRadius: '50%', width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }}>
                  <Camera size={15} color="#fff" />
                </div>
              </div>

              <h3 className="profile-name-large">{profileData.fullName}</h3>
              <p className="profile-role-large">{profileData.role} - {profileData.branch}</p>

              <button className="btn-edit-profile" onClick={() => setShowUpdateForm(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>

              <button
                className="btn-change-picture"
                onClick={handleChangePicture}
                disabled={uploadingPic}
                style={{ marginTop: '0.5rem' }}
              >
                {uploadingPic ? 'Uploading...' : selectedImageFile ? 'Upload Selected Picture' : 'Change your picture'}
              </button>

              {selectedImageFile && !uploadingPic && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.3rem', textAlign: 'center' }}>
                  "{selectedImageFile.name}" selected
                </p>
              )}
            </div>

            <div className="profile-info-card">
              <h3 className="info-card-title">Profile Information</h3>
              <div className="info-grid">
                <div className="info-item"><div className="info-label">Employee ID</div><div className="info-value">{profileData.employeeId}</div></div>
                <div className="info-item"><div className="info-label">Full Name</div><div className="info-value">{profileData.fullName}</div></div>
                <div className="info-item"><div className="info-label">Email Address</div><div className="info-value">{profileData.email}</div></div>
                <div className="info-item"><div className="info-label">Phone Number</div><div className="info-value">{profileData.phone}</div></div>
                <div className="info-item"><div className="info-label">Role</div><div className="info-value">{profileData.role}</div></div>
                <div className="info-item"><div className="info-label">Branch</div><div className="info-value">{profileData.branch}</div></div>
                <div className="info-item"><div className="info-label">Joining Date</div><div className="info-value">{profileData.joiningDate}</div></div>
              </div>

              <div className="performance-section">
                <h4 className="performance-title">Today's Performance</h4>
                <div className="performance-stats">
                  <div className="performance-card orders-card">
                    <div className="performance-number">0</div>
                    <div className="performance-label">Orders Today</div>
                  </div>
                  <div className="performance-card sales-card">
                    <div className="performance-number sales-number">Rs. 0</div>
                    <div className="performance-label">Sales Today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showUpdateForm && (
        <div className="modal-overlay" onClick={() => setShowUpdateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Update Profile</h3>
              <button className="modal-close-btn" onClick={() => setShowUpdateForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                    background: '#ede9fe', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                    border: '3px solid #7c3aed', position: 'relative'
                  }}
                  onClick={() => pictureInputRef.current?.click()}
                  title="Click to change picture"
                >
                  {getImageSrc()
                    ? <img src={getImageSrc()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed' }}>{getInitials()}</span>}
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2, background: '#7c3aed',
                    borderRadius: '50%', width: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Camera size={12} color="#fff" />
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.4rem' }}>Click to change picture</span>
                {selectedImageFile && (
                  <span style={{ fontSize: '0.72rem', color: '#7c3aed', marginTop: '0.2rem' }}>
                    &#10003; {selectedImageFile.name} selected
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" value={formData.fullName}
                  onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="form-input purple-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={currentUser.email || ''} className="form-input gray-input" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="form-input purple-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input type="text" value={currentUser.role || ''} className="form-input gray-input" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <input type="text" value={currentUser.shop_name || ''} className="form-input gray-input" disabled />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" value={formData.newPassword}
                  onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Leave blank to keep current"
                  className="form-input purple-input" />
              </div>

              <button className="btn-save-changes" onClick={handleSaveChanges} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;