import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell, Tags,
  Moon, Settings, Edit2, X, Camera, CheckCircle, AlertCircle, Save, Boxes,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyProfile.css';

const Myprofile = () => {
  const navigate = useNavigate();

  const [showMenuDropdown, setShowMenuDropdown]       = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showUpdateForm, setShowUpdateForm]           = useState(false);
  const [stores, setStores]                           = useState([]);
  const [loadingStores, setLoadingStores]             = useState(true);
  const [saving, setSaving]                           = useState(false);
  const [uploadingPic, setUploadingPic]               = useState(false);
  const [saveError, setSaveError]                     = useState('');
  const [saveSuccess, setSaveSuccess]                 = useState('');

  // currentUser drives ALL rendering — updated after every successful save
  const [currentUser, setCurrentUser] = useState(
    () => JSON.parse(localStorage.getItem('user') || '{}')
  );

  // Picture selection state
  const [previewUrl, setPreviewUrl]               = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const pictureInputRef    = useRef(null);
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    fullName:    currentUser.name  || '',
    phone:       currentUser.phone || '',
    newPassword: '',
  });

  // Keep form in sync when modal opens
  useEffect(() => {
    if (showUpdateForm) {
      setFormData({
        fullName:    currentUser.name  || '',
        phone:       currentUser.phone || '',
        newPassword: '',
      });
      setSaveError('');
      setSaveSuccess('');
    }
  }, [showUpdateForm]);

  // Fetch stores for dropdown
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

  const getImageSrc = () => {
    if (previewUrl) return previewUrl;
    if (currentUser.image_url) return `http://localhost:5000${currentUser.image_url}`;
    return null;
  };

  const getInitials = () => currentUser.name?.substring(0, 2).toUpperCase() || 'AD';

  // Renders profile image or initials — reads from currentUser (reactive)
  const renderAvatar = (size = 'default') => {
    const src = getImageSrc();
    const borderRadius = size === 'avatar' ? '16px' : '50%';
    if (src) {
      return (
        <img src={src} alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius }} />
      );
    }
    const cls = size === 'avatar'   ? 'mp-avatar-text'
              : size === 'dropdown' ? 'mp-avatar-initials'
              :                       'mp-profile-initials';
    return <span className={cls}>{getInitials()}</span>;
  };

  // Shop logo
  const shopLogoUrl = currentUser.shop_logo ? `http://localhost:5000${currentUser.shop_logo}` : null;
  const renderShopLogo = () => {
    if (shopLogoUrl) {
      return (
        <img src={shopLogoUrl} alt={currentUser.shop_name || 'Shop'}
          className="mp-sidebar-logo-img"
          onError={(e) => { e.target.style.display = 'none'; }} />
      );
    }
    return <span className="mp-brand-title">{currentUser.shop_name || 'Shop'}</span>;
  };


  const handlePictureFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  // Standalone "Upload Picture" — uploads immediately without other fields
  const handleUploadPicture = async () => {
    if (!selectedImageFile) {
      pictureInputRef.current?.click();
      return;
    }
    try {
      setUploadingPic(true);
      const fd = new FormData();
      fd.append('image', selectedImageFile);

      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const updatedUser = { ...currentUser, image_url: data.user.image_url };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setPreviewUrl(null);
      setSelectedImageFile(null);
      setSaveSuccess('Profile picture updated!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to upload picture.');
      setTimeout(() => setSaveError(''), 4000);
    } finally {
      setUploadingPic(false);
    }
  };

 
  const handleSaveChanges = async () => {
    if (!formData.fullName.trim()) { setSaveError('Full name is required.'); return; }
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      const fd = new FormData();
      fd.append('name',  formData.fullName.trim());
      fd.append('phone', formData.phone.trim());
      if (formData.newPassword.trim()) fd.append('password', formData.newPassword.trim());
      if (selectedImageFile)           fd.append('image', selectedImageFile);

      const response = await fetch('http://localhost:5000/api/users/update-profile', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');

      const updatedUser = {
        ...currentUser,
        name:      data.user.name,
        phone:     data.user.phone,
        image_url: data.user.image_url ?? currentUser.image_url,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setPreviewUrl(null);
      setSelectedImageFile(null);
      setSaveSuccess('Profile updated successfully!');
      setTimeout(() => { setShowUpdateForm(false); setSaveSuccess(''); }, 1200);
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowUpdateForm(false);
    setSaveError(''); setSaveSuccess('');
    setPreviewUrl(null); setSelectedImageFile(null);
  };

  const profileDisplay = {
    fullName:    currentUser.name      || 'Admin',
    email:       currentUser.email     || 'N/A',
    phone:       currentUser.phone     || 'N/A',
    role:        currentUser.role      || 'Shop Admin',
    shopName:    currentUser.shop_name || 'N/A',
    employeeId:  `EMP-${currentUser.id || currentUser.user_id || '0000'}`,
  };

  return (
    <div className="mp-container">

      {/* SIDEBAR  */}
      <aside className="mp-sidebar">
        <div className="mp-brand-header">{renderShopLogo()}</div>

        <nav className="mp-sidebar-nav">
          <button className="mp-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18} /><span>Shop Profile</span>
          </button>

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18} /><span>My Stores</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} /><span>Suppliers</span>
          </button>
          {/* <button className="mp-nav-item" onClick={() => navigate('/mystores')}>
            <Plus size={18} /><span>Add Store</span>
          </button> */}

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} /><span>My Users</span>
          </button>
          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18} /><span>Products</span>
          </button>
           <button className="mp-nav-item" onClick={() => navigate('/categories')}>
            <Tags size={18} /><span>Categories</span>
          </button>
           <button className="mp-nav-item" onClick={() => navigate('/inventory')}>
            <Boxes size={18} /><span>Inventory</span>
           </button>

          

          <div className="mp-nav-divider" />

          <button className="mp-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18} /><span>Subscription</span>
          </button>
          
          <div className="mp-nav-divider" />

          <button className="mp-nav-item active">
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="mp-nav-item mp-logout-nav" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  MAIN  */}
      <main className="mp-main">
        <header className="mp-header">
          <div className="mp-breadcrumb">Admin &gt; My Profile</div>
          <div className="mp-header-actions">

            {/* Stores dropdown */}
            <div className="mp-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="mp-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
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
                        <button key={store.store_id} className="mp-menu-item"
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
                  </div>
                </div>
              )}
            </div>

            <div className="mp-icon-circle moon"><Moon size={16} /></div>
            <div className="mp-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="mp-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="mp-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderAvatar()}
              </button>
              {showProfileDropdown && (
                <div className="mp-profile-dropdown">
                  <div className="mp-profile-dropdown-header">
                    <div className="mp-profile-dropdown-avatar">{renderAvatar('dropdown')}</div>
                    <div className="mp-profile-dropdown-info">
                      <h4 className="mp-profile-name">{currentUser.name || 'Admin'}</h4>
                      <p className="mp-profile-role">{currentUser.role || 'Shop Admin'}</p>
                    </div>
                  </div>
                  <div className="mp-profile-divider" />
                  <div className="mp-profile-details">
                    <div className="mp-profile-detail-item">
                      <span className="mp-detail-icon">📧</span>
                      <span className="mp-detail-text">{currentUser.email || 'N/A'}</span>
                    </div>
                    <div className="mp-profile-detail-item">
                      <span className="mp-detail-icon">📱</span>
                      <span className="mp-detail-text">{currentUser.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="mp-profile-divider" />
                  <div className="mp-profile-actions">
                    <button className="mp-profile-action-btn"
                      onClick={() => setShowProfileDropdown(false)}>
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

        {/* PAGE CONTENT */}
        <div className="mp-content">
          <div className="mp-page-title-row">
            <h2 className="mp-page-title">My Profile</h2>
            <p className="mp-page-subtitle">View and update your account information</p>
          </div>

          {/* Feedback banners */}
          {saveSuccess && (
            <div className="mp-alert mp-alert-success">
              <CheckCircle size={16} /><span>{saveSuccess}</span>
            </div>
          )}
          {saveError && (
            <div className="mp-alert mp-alert-error">
              <AlertCircle size={16} /><span>{saveError}</span>
            </div>
          )}

          <div className="mp-layout">

            {/* Left card: avatar + actions */}
            <div className="mp-avatar-card">

              {/* Hidden file input */}
              <input
                ref={pictureInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePictureFileChange}
              />

              {/* Avatar with camera overlay */}
              <div className="mp-avatar-large"
                onClick={() => pictureInputRef.current?.click()}
                title="Click to change picture">
                {renderAvatar('avatar')}
                <div className="mp-camera-overlay">
                  <Camera size={16} color="#fff" />
                </div>
              </div>

              <h3 className="mp-name-large">{profileDisplay.fullName}</h3>
              <p className="mp-role-large">{profileDisplay.role} &bull; {profileDisplay.shopName}</p>

              <button className="mp-btn-edit" onClick={() => setShowUpdateForm(true)}>
                <Edit2 size={15} /> Edit Profile
              </button>

              <button
                className="mp-btn-change-pic"
                onClick={handleUploadPicture}
                disabled={uploadingPic}
              >
                {uploadingPic
                  ? 'Uploading...'
                  : selectedImageFile
                    ? 'Upload Selected Picture'
                    : 'Change Picture'}
              </button>

              {selectedImageFile && !uploadingPic && (
                <p className="mp-selected-file">✓ {selectedImageFile.name}</p>
              )}
            </div>

            {/*  Right card: info grid */}
            <div className="mp-info-card">
              <h3 className="mp-info-title">Profile Information</h3>

              <div className="mp-info-grid">
                <div className="mp-info-item">
                  <div className="mp-info-label">Employee ID</div>
                  <div className="mp-info-value">{profileDisplay.employeeId}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Full Name</div>
                  <div className="mp-info-value">{profileDisplay.fullName}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Email Address</div>
                  <div className="mp-info-value">{profileDisplay.email}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Phone Number</div>
                  <div className="mp-info-value">{profileDisplay.phone}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Role</div>
                  <div className="mp-info-value">{profileDisplay.role}</div>
                </div>
                <div className="mp-info-item">
                  <div className="mp-info-label">Shop / Branch</div>
                  <div className="mp-info-value">{profileDisplay.shopName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* EDIT MODAL */}
      {showUpdateForm && (
        <div className="mp-modal-overlay" onClick={closeModal}>
          <div className="mp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <h3 className="mp-modal-title"><Edit2 size={17} style={{ marginRight: 8 }} />Update Profile</h3>
              <button className="mp-modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="mp-modal-body">

              {saveError   && <div className="mp-alert mp-alert-error"><AlertCircle size={15}/><span>{saveError}</span></div>}
              {saveSuccess && <div className="mp-alert mp-alert-success"><CheckCircle size={15}/><span>{saveSuccess}</span></div>}

              {/* Avatar picker inside modal */}
              <div className="mp-modal-avatar-wrap">
                <div className="mp-modal-avatar"
                  onClick={() => pictureInputRef.current?.click()}
                  title="Click to change picture">
                  {getImageSrc()
                    ? <img src={getImageSrc()} alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span className="mp-modal-initials">{getInitials()}</span>
                  }
                  <div className="mp-modal-camera"><Camera size={12} color="#fff" /></div>
                </div>
                <span className="mp-modal-avatar-hint">Click to change picture</span>
                {selectedImageFile && (
                  <span className="mp-selected-file">✓ {selectedImageFile.name}</span>
                )}
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Full Name <span className="mp-required">*</span></label>
                <input type="text" value={formData.fullName}
                  onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                  className="mp-form-input mp-input-purple" placeholder="Your full name" />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Email</label>
                <input type="email" value={currentUser.email || ''}
                  className="mp-form-input mp-input-gray" disabled />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Phone</label>
                <input type="text" value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="mp-form-input mp-input-purple" placeholder="e.g. 0300-1234567" />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Role</label>
                <input type="text" value={currentUser.role || ''} className="mp-form-input mp-input-gray" disabled />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">Shop</label>
                <input type="text" value={currentUser.shop_name || ''} className="mp-form-input mp-input-gray" disabled />
              </div>

              <div className="mp-form-group">
                <label className="mp-form-label">New Password</label>
                <input type="password" value={formData.newPassword}
                  onChange={(e) => setFormData(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Leave blank to keep current"
                  className="mp-form-input mp-input-purple" />
              </div>

              <button className="mp-btn-save" onClick={handleSaveChanges} disabled={saving}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Myprofile;