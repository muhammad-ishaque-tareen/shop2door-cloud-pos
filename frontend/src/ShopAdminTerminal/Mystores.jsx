

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell, Tags, 
  Moon, Settings, Star, Users2, DollarSign, ShoppingBag, Boxes,TrendingUp, FileBarChart,
  X, AlertCircle, MapPin, Phone, Calendar, Edit3, Eye,
  Save, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyStores.css';

const MyStores = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [error, setError] = useState('');

  // Add Store Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [newStore, setNewStore] = useState({ name: '', address: '', phone: '', is_active: true });

  // View Modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStore, setViewStore] = useState(null);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const fetchStores = async () => {
    setLoadingStores(true);
    try {
      const response = await fetch('http://localhost:5000/api/stores', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setStores(await response.json());
      } else {
        setError('Failed to load stores.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl = user.shop_logo ? `http://localhost:5000${user.shop_logo}` : null;

  const renderShopLogo = () => {
    if (shopLogoUrl) {
      return (
        <img src={shopLogoUrl} alt={user.shop_name || 'Shop'}
          className="shop-sidebar-logo-img"
          onError={(e) => { e.target.style.display = 'none'; }} />
      );
    }
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url) {
      return (
        <img src={`http://localhost:5000${user.image_url}`} alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      );
    }
    return <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>{initials}</span>;
  };

  // Add Store 
  const handleAddStoreChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewStore(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddStoreSubmit = async () => {
    if (!newStore.name.trim()) { setAddError('Store name is required.'); return; }
    setAddLoading(true); setAddError(''); setAddSuccess('');
    try {
      const response = await fetch('http://localhost:5000/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStore)
      });
      const data = await response.json();
      if (response.ok) {
        setAddSuccess('Store added successfully!');
        setNewStore({ name: '', address: '', phone: '', is_active: true });
        fetchStores();
        setTimeout(() => { setShowAddModal(false); setAddSuccess(''); }, 1200);
      } else {
        setAddError(data.message || 'Failed to add store.');
      }
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false); setAddError(''); setAddSuccess('');
    setNewStore({ name: '', address: '', phone: '', is_active: true });
  };

  //  View Store
  const openViewModal = (store) => { setViewStore(store); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setViewStore(null); };

  //  Edit Store 
  const openEditModal = (store) => {
    setEditStore({ ...store });
    setEditError(''); setEditSuccess('');
    setShowEditModal(true);
  };
  const closeEditModal = () => { setShowEditModal(false); setEditStore(null); setEditError(''); setEditSuccess(''); };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditStore(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditSubmit = async () => {
    if (!editStore.name.trim()) { setEditError('Store name is required.'); return; }
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const response = await fetch(`http://localhost:5000/api/stores/${editStore.store_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editStore)
      });
      const data = await response.json();
      if (response.ok) {
        setEditSuccess('Store updated successfully!');
        fetchStores();
        setTimeout(() => closeEditModal(), 1200);
      } else {
        setEditError(data.message || 'Failed to update store.');
      }
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="shop-admin-container">
      {/* SIDEBAR */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">{renderShopLogo()}</div>
        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18} /><span>Shop Profile</span>
          </button>
          <div className="nav-divider" />
          <button className="shop-nav-item active">
            <Store size={18} /><span>My Stores</span>
          </button>
        
          <div className="nav-divider" />
          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} /><span>My Users</span>
          </button>
            <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} /><span>Suppliers</span>
          </button>
          {/* <button className="shop-nav-item" onClick={() => navigate('/adduser')}>
            <Plus size={18} /><span>Add User</span>
          </button> */}
          <div className="nav-divider" />
          <button className="shop-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18} /><span>Products</span>
            
          </button>

           <button className="mp-nav-item" onClick={() => navigate('/categories')}>
            <Tags size={18} /><span>Categories</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/inventory')}>
            <Boxes size={18} /><span>Inventory</span>
          </button>
          
        
          <div className="nav-divider" />
          <button className="shop-nav-item" onClick={() => navigate('/salesrecords')}>
            <TrendingUp size={18}/><span>Sales Records</span>
          </button>
           <button className="mp-nav-item" onClick={()=> navigate('/reportsandanalytics')}>
            <FileBarChart size={18}/><span>Reports & Analytics</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18} /><span>Subscription</span>
          </button>

          <div className="nav-divider" />
          
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="shop-nav-item logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="shop-admin-main">
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; My Stores</div>
          <div className="shop-header-actions">
            {/* Stores dropdown */}
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                All Stores <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">My Stores</h4>
                    {loadingStores ? (
                      <div className="shop-menu-item">Loading...</div>
                    ) : stores.length > 0 ? (
                      stores.map((store) => (
                        <button key={store.store_id} className="shop-menu-item"
                          onClick={() => { setShowMenuDropdown(false); openViewModal(store); }}>
                          <Store size={18} /><span>{store.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="shop-menu-item">No stores found</div>
                    )}
                  </div>
                  <div className="shop-menu-divider" />
                  <div className="shop-menu-section">
                    <button className="shop-menu-item"
                      onClick={() => { setShowMenuDropdown(false); setShowAddModal(true); }}>
                      <Plus size={18} /><span>Add New Store</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="shop-icon-circle moon"><Moon size={16} /></div>
            <div className="shop-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="shop-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="shop-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="shop-profile-dropdown">
                  <div className="shop-profile-dropdown-header">
                    <div className="shop-profile-dropdown-avatar">{renderProfileImage('dropdown')}</div>
                    <div className="shop-profile-dropdown-info">
                      <h4 className="shop-profile-name">{user.name || 'Admin'}</h4>
                      <p className="shop-profile-role">{user.role || 'Shop Admin'}</p>
                    </div>
                  </div>
                  <div className="shop-profile-divider" />
                  <div className="shop-profile-details">
                    <div className="shop-profile-detail-item">
                      <span className="shop-detail-icon">📧</span>
                      <span className="shop-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="shop-profile-detail-item">
                      <span className="shop-detail-icon">📱</span>
                      <span className="shop-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="shop-profile-divider" />
                  <div className="shop-profile-actions">
                    <button className="shop-profile-action-btn"
                      onClick={() => { setShowProfileDropdown(false); navigate('/adminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="shop-profile-action-btn shop-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="shop-dashboard-content">
          <div className="ms-page-header">
            <div>
              <h1 className="shop-welcome-title">My Stores</h1>
              <p className="ms-subtitle">Manage all your store locations and their performance</p>
            </div>
            <button className="ms-add-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add New Store
            </button>
          </div>

          {loadingStores ? (
            <div className="ms-loading"><div className="ms-spinner" /><p>Loading stores...</p></div>
          ) : error ? (
            <div className="ms-error"><AlertCircle size={18} /><span>{error}</span></div>
          ) : stores.length === 0 ? (
            <div className="ms-empty">
              <Store size={48} /><h3>No stores yet</h3>
              <p>Add your first store to get started</p>
              <button className="ms-add-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add New Store
              </button>
            </div>
          ) : (
            <div className="ms-grid">
              {stores.map((store) => (
                <div key={store.store_id} className="ms-card">
                  <div className="ms-card-top">
                    <div className="ms-card-icon"><Store size={22} /></div>
                    <div className="ms-card-title-wrap">
                      <h3 className="ms-card-name">{store.name}</h3>
                      <span className={`ms-status-badge ${store.is_active ? 'open' : 'closed'}`}>
                        {store.is_active ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    {store.rating && (
                      <span className="ms-rating">
                        <Star size={12} fill="currentColor" />
                        {parseFloat(store.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <p className="ms-card-address">
                    {store.address || 'No address provided'}
                    {store.phone ? ` · ${store.phone}` : ''}
                  </p>

                  <div className="ms-stats-row">
                    <div className="ms-stat">
                      <Users2 size={14} />
                      <span className="ms-stat-label">Staff</span>
                      <span className="ms-stat-value">{store.staff_count ?? 0}</span>
                    </div>
                    <div className="ms-stat">
                      <DollarSign size={14} />
                      <span className="ms-stat-label">Today's Sales</span>
                      <span className="ms-stat-value">
                        Rs. {store.todays_sales ? parseInt(store.todays_sales).toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="ms-stat">
                      <ShoppingBag size={14} />
                      <span className="ms-stat-label">Orders</span>
                      <span className="ms-stat-value">{store.todays_orders ?? 0}</span>
                    </div>
                  </div>

                  <div className="ms-card-actions">
                    <button className="ms-btn-view" onClick={() => openViewModal(store)}>
                      <Eye size={14} /> View
                    </button>
                    <button className="ms-btn-edit" onClick={() => openEditModal(store)}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/*  VIEW STORE MODAL */}
      {showViewModal && viewStore && (
        <div className="ms-modal-overlay" onClick={closeViewModal}>
          <div className="ms-modal ms-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header ms-view-header">
              <div className="ms-view-header-left">
                <div className="ms-view-icon"><Store size={24} /></div>
                <div>
                  <h2 className="ms-modal-title">{viewStore.name}</h2>
                  <span className={`ms-status-badge ${viewStore.is_active ? 'open' : 'closed'}`}>
                    {viewStore.is_active ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <button className="ms-modal-close" onClick={closeViewModal}><X size={20} /></button>
            </div>

            <div className="ms-modal-body">
              <div className="ms-view-grid">
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><MapPin size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Address</p>
                    <p className="ms-view-info-value">{viewStore.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><Phone size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Phone</p>
                    <p className="ms-view-info-value">{viewStore.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><Calendar size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Created</p>
                    <p className="ms-view-info-value">
                      {viewStore.created_at ? new Date(viewStore.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><Users2 size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Staff Count</p>
                    <p className="ms-view-info-value">{viewStore.staff_count ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="ms-view-stats">
                <div className="ms-view-stat-card">
                  <DollarSign size={20} className="ms-view-stat-icon" />
                  <p className="ms-view-stat-value">
                    Rs. {viewStore.todays_sales ? parseInt(viewStore.todays_sales).toLocaleString() : '0'}
                  </p>
                  <p className="ms-view-stat-label">Today's Sales</p>
                </div>
                <div className="ms-view-stat-card">
                  <ShoppingBag size={20} className="ms-view-stat-icon" />
                  <p className="ms-view-stat-value">{viewStore.todays_orders ?? 0}</p>
                  <p className="ms-view-stat-label">Today's Orders</p>
                </div>
                <div className="ms-view-stat-card">
                  <Star size={20} className="ms-view-stat-icon" />
                  <p className="ms-view-stat-value">{viewStore.rating ? parseFloat(viewStore.rating).toFixed(1) : '—'}</p>
                  <p className="ms-view-stat-label">Rating</p>
                </div>
              </div>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeViewModal}>Close</button>
              <button className="ms-btn-save" onClick={() => { closeViewModal(); openEditModal(viewStore); }}>
                <Edit3 size={14} /> Edit Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  EDIT STORE MODAL */}
      {showEditModal && editStore && (
        <div className="ms-modal-overlay" onClick={closeEditModal}>
          <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Edit3 size={18} style={{marginRight:8}} />Edit Store</h2>
              <button className="ms-modal-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="ms-modal-body">
              {editError && (
                <div className="ms-modal-error"><AlertCircle size={16} /><span>{editError}</span></div>
              )}
              {editSuccess && (
                <div className="ms-modal-success"><CheckCircle size={16} /><span>{editSuccess}</span></div>
              )}

              <div className="ms-form-group">
                <label className="ms-form-label">Store Name <span className="ms-required">*</span></label>
                <input className="ms-form-input" type="text" name="name"
                  placeholder="e.g. Gulberg Main Store"
                  value={editStore.name} onChange={handleEditChange} />
              </div>
              <div className="ms-form-group">
                <label className="ms-form-label">Address</label>
                <input className="ms-form-input" type="text" name="address"
                  placeholder="e.g. 45-A Main Boulevard, Lahore"
                  value={editStore.address || ''} onChange={handleEditChange} />
              </div>
              <div className="ms-form-group">
                <label className="ms-form-label">Phone</label>
                <input className="ms-form-input" type="text" name="phone"
                  placeholder="e.g. 0300-1234567"
                  value={editStore.phone || ''} onChange={handleEditChange} />
              </div>
              <div className="ms-form-check">
                <input type="checkbox" id="edit_is_active" name="is_active"
                  checked={editStore.is_active} onChange={handleEditChange} className="ms-checkbox" />
                <label htmlFor="edit_is_active" className="ms-check-label">Store is Active (Open)</label>
              </div>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeEditModal}>Cancel</button>
              <button className="ms-btn-save" onClick={handleEditSubmit} disabled={editLoading}>
                <Save size={14} /> {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STORE MODAL */}
      {showAddModal && (
        <div className="ms-modal-overlay" onClick={closeAddModal}>
          <div className="ms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Plus size={18} style={{marginRight:8}} />Add New Store</h2>
              <button className="ms-modal-close" onClick={closeAddModal}><X size={20} /></button>
            </div>

            <div className="ms-modal-body">
              {addError && (
                <div className="ms-modal-error"><AlertCircle size={16} /><span>{addError}</span></div>
              )}
              {addSuccess && (
                <div className="ms-modal-success"><CheckCircle size={16} /><span>{addSuccess}</span></div>
              )}
              <div className="ms-form-group">
                <label className="ms-form-label">Store Name <span className="ms-required">*</span></label>
                <input className="ms-form-input" type="text" name="name"
                  placeholder="e.g. Gulberg Main Store"
                  value={newStore.name} onChange={handleAddStoreChange} />
              </div>
              <div className="ms-form-group">
                <label className="ms-form-label">Address</label>
                <input className="ms-form-input" type="text" name="address"
                  placeholder="e.g. 45-A Main Boulevard, Lahore"
                  value={newStore.address} onChange={handleAddStoreChange} />
              </div>
              <div className="ms-form-group">
                <label className="ms-form-label">Phone</label>
                <input className="ms-form-input" type="text" name="phone"
                  placeholder="e.g. 0300-1234567"
                  value={newStore.phone} onChange={handleAddStoreChange} />
              </div>
              <div className="ms-form-check">
                <input type="checkbox" id="is_active" name="is_active"
                  checked={newStore.is_active} onChange={handleAddStoreChange} className="ms-checkbox" />
                <label htmlFor="is_active" className="ms-check-label">Store is Active (Open)</label>
              </div>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeAddModal}>Cancel</button>
              <button className="ms-btn-save" onClick={handleAddStoreSubmit} disabled={addLoading}>
                <Plus size={14} /> {addLoading ? 'Adding...' : 'Add Store'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStores;