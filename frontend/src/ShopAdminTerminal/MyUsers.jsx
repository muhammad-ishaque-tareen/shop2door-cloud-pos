import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Store, Plus, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell,Tags,
  Moon, Settings, X, AlertCircle, Phone, Mail,
  Edit3, Save, CheckCircle, Trash2, Shield, UserCheck, Boxes,TrendingUp,
  Search, ChevronDown, UserCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyUsers.css';

const ROLES = [
  { value: 'store_manager',   label: 'Store Manager' },
  { value: 'cashier',         label: 'Cashier' },
//   { value: 'inventory_staff', label: 'Inventory Staff' },
//   { value: 'delivery',        label: 'Delivery' },
];

const roleColors = {
  shop_admin:      { bg: '#f3e8ff', color: '#7e22ce' },
  store_manager:   { bg: '#dbeafe', color: '#1d4ed8' },
  cashier:         { bg: '#dcfce7', color: '#15803d' },
  inventory_staff: { bg: '#fef9c3', color: '#a16207' },
  delivery:        { bg: '#ffe4e6', color: '#be123c' },
};

const getRoleBadge = (role) => {
  const c = roleColors[role] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span className="mu-role-badge" style={{ background: c.bg, color: c.color }}>
      {ROLES.find(r => r.value === role)?.label || role}
    </span>
  );
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

//Custom Select Component 
const CustomSelect = ({ name, value, onChange, placeholder, options, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className="mu-custom-select" ref={ref}>
      <button
        type="button"
        className={`mu-select-btn ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={selected ? 'mu-select-value' : 'mu-select-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={15} className={`mu-select-arrow ${open ? 'rotated' : ''}`} />
      </button>
      {open && (
        <div className="mu-select-dropdown">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`mu-select-option ${String(value) === String(opt.value) ? 'selected' : ''}`}
              onClick={() => {
                onChange({ target: { name, value: opt.value } });
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MyUsers = () => {
  const [showMenuDropdown, setShowMenuDropdown]       = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [users, setUsers]                             = useState([]);
  const [stores, setStores]                           = useState([]);
  const [loadingUsers, setLoadingUsers]               = useState(true);
  const [error, setError]                             = useState('');
  const [searchTerm, setSearchTerm]                   = useState('');
  const [filterRole, setFilterRole]                   = useState('all');
  const [filterStore, setFilterStore]                 = useState('all');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState('');
  const [addSuccess, setAddSuccess]     = useState('');
  const [newUser, setNewUser] = useState({
    name: '', email: '', phone: '', password: '', role: '', store_id: ''
  });

  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser]           = useState(null);
  const [editLoading, setEditLoading]     = useState(false);
  const [editError, setEditError]         = useState('');
  const [editSuccess, setEditSuccess]     = useState('');

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);
  const [deleteLoading, setDeleteLoading]         = useState(false);
  const [deleteError, setDeleteError]             = useState('');

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate           = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  //Fetch data
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('http://localhost:5000/api/shopusers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
      else setError('Failed to load users.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStores(await res.json());
    } catch { /* silent */ }
  };

  useEffect(() => { fetchUsers(); fetchStores(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target))
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

  //Render helpers 
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

  // Add User
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async () => {
    if (!newUser.name.trim())  { setAddError('Name is required.');        return; }
    if (!newUser.email.trim()) { setAddError('Email is required.');       return; }
    if (!newUser.password)     { setAddError('Password is required.');    return; }
    if (newUser.password.length < 4) { setAddError('Password must be at least 4 characters.'); return; }
    if (!newUser.role)         { setAddError('Please select a role.');    return; }

    setAddLoading(true); setAddError(''); setAddSuccess('');
    try {
      const res = await fetch('http://localhost:5000/api/shopusers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (res.ok) {
        setAddSuccess('User added successfully!');
        setNewUser({ name: '', email: '', phone: '', password: '', role: '', store_id: '' });
        fetchUsers();
        setTimeout(() => { setShowAddModal(false); setAddSuccess(''); }, 1200);
      } else if (res.status === 403 && data.limitReached) {
        setAddError(data.message || 'User limit reached. Please upgrade your package.');
      } else {
        setAddError(data.message || 'Failed to add user.');
      }
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false); setAddError(''); setAddSuccess('');
    setNewUser({ name: '', email: '', phone: '', password: '', role: '', store_id: '' });
  };

  //Edit User
  const openEditModal = (u) => {
    setEditUser({ ...u, password: '' });
    setEditError(''); setEditSuccess('');
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false); setEditUser(null); setEditError(''); setEditSuccess('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    if (!editUser.role) { setEditError('Please select a role.'); return; }

    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const res = await fetch(`http://localhost:5000/api/shopusers/${editUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: editUser.role, store_id: editUser.store_id || null })
      });
      const data = await res.json();
      if (res.ok) {
        setEditSuccess('User updated successfully!');
        fetchUsers();
        setTimeout(() => closeEditModal(), 1200);
      } else {
        setEditError(data.message || 'Failed to update user.');
      }
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  //  Delete User 
  const openDeleteConfirm  = (u) => { setDeleteTarget(u); setDeleteError(''); setShowDeleteConfirm(true); };
  const closeDeleteConfirm = () => { setShowDeleteConfirm(false); setDeleteTarget(null); setDeleteError(''); };

  const handleDelete = async () => {
    setDeleteLoading(true); setDeleteError('');
    try {
      const res = await fetch(`http://localhost:5000/api/shopusers/${deleteTarget.user_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) { fetchUsers(); closeDeleteConfirm(); }
      else setDeleteError(data.message || 'Failed to delete user.');
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  //  Filtered list 
  const filteredUsers = users.filter(u => {
    const matchSearch = !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole  = filterRole  === 'all' || u.role === filterRole;
    const matchStore = filterStore === 'all' || String(u.store_id) === String(filterStore);
    return matchSearch && matchRole && matchStore;
  });

  // Store options for CustomSelect (add "No specific store" as first option)
  const storeOptions = [
    { value: '', label: 'No specific store' },
    ...stores.map(s => ({ value: String(s.store_id), label: s.name }))
  ];

  return (
    <div className="shop-admin-container">

      {/*  SIDEBAR */}
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

          <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18} /><span>My Stores</span>
          </button>
          {/* <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Plus size={18} /><span>Add Store</span>
          </button> */}

          <div className="nav-divider" />

          <button className="shop-nav-item active">
            <Users size={18} /><span>My Users</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} /><span>Suppliers</span>
          </button>

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

        {/* HEADER  */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; My Users</div>
          <div className="shop-header-actions">

            {/* All Users dropdown */}
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                All Users <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">Staff Members</h4>
                    {loadingUsers ? (
                      <div className="shop-menu-item">Loading...</div>
                    ) : users.length > 0 ? (
                      users.slice(0, 8).map((u) => (
                        <button key={u.user_id} className="shop-menu-item"
                          onClick={() => { setShowMenuDropdown(false); openEditModal(u); }}>
                          <UserCircle size={18} /><span>{u.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="shop-menu-item">No users found</div>
                    )}
                  </div>
                  <div className="shop-menu-divider" />
                  <div className="shop-menu-section">
                    <button className="shop-menu-item"
                      onClick={() => { setShowMenuDropdown(false); setShowAddModal(true); }}>
                      <Plus size={18} /><span>Add New User</span>
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

        {/*  PAGE CONTENT  */}
        <div className="shop-dashboard-content">

          <div className="ms-page-header">
            <div>
              <h1 className="shop-welcome-title">Users Management</h1>
              <p className="ms-subtitle">Manage staff members across all your stores</p>
            </div>
            <button className="ms-add-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> 
              Add User
            </button>
          </div>

          {/* Filters */}
          <div className="mu-filters">
            <div className="mu-search-wrap">
              <Search size={15} className="mu-search-icon" />
              <input
                className="mu-search-input"
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="mu-filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select className="mu-filter-select" value={filterStore} onChange={e => setFilterStore(e.target.value)}>
              <option value="all">All Stores</option>
              {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.name}</option>)}
            </select>
          </div>

          {/* Table */}
          {loadingUsers ? (
            <div className="ms-loading"><div className="ms-spinner" /><p>Loading users...</p></div>
          ) : error ? (
            <div className="ms-error"><AlertCircle size={18} /><span>{error}</span></div>
          ) : filteredUsers.length === 0 ? (
            <div className="ms-empty">
              <Users size={48} /><h3>No users found</h3>
              <p>{searchTerm || filterRole !== 'all' || filterStore !== 'all'
                ? 'Try adjusting your filters.'
                : 'Add your first staff member to get started.'}</p>
              {!searchTerm && filterRole === 'all' && filterStore === 'all' && (
                <button className="ms-add-btn" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} /> Add User
                </button>
              )}
            </div>
          ) : (
            <div className="mu-table-wrap">
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Store</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.user_id}>
                      <td>
                        <div className="mu-user-cell">
                          <div className="mu-avatar" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                            {u.image_url
                              ? <img src={`http://localhost:5000${u.image_url}`} alt={u.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                  onError={e => { e.target.style.display = 'none'; }} />
                              : getInitials(u.name)
                            }
                          </div>
                          <div>
                            <p className="mu-user-name">{u.name}</p>
                            <p className="mu-user-email">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        <span className="mu-store-name">
                          {u.store_name || <span className="mu-no-store">—</span>}
                        </span>
                      </td>
                      <td className="mu-phone">{u.phone || '—'}</td>
                      <td className="mu-date">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="mu-actions">
                          <button className="mu-btn-edit" onClick={() => openEditModal(u)}>
                            <Edit3 size={14} /> Edit
                          </button>
                          <button className="mu-btn-delete" onClick={() => openDeleteConfirm(u)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mu-count">Showing {filteredUsers.length} of {users.length} users</p>
            </div>
          )}
        </div>
      </main>

{/*       
        ADD USER MODAL */}
      
      {showAddModal && (
        <div className="ms-modal-overlay" onClick={closeAddModal}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>

            <div className="ms-modal-header">
              <h2 className="ms-modal-title">
                <Plus size={18} style={{ marginRight: 8 }} />Add New User
              </h2>
              <button className="ms-modal-close" onClick={closeAddModal}><X size={20} /></button>
            </div>

            <div className="ms-modal-body">
              {addError && (
                <div className="ms-modal-error"><AlertCircle size={16} /><span>{addError}</span></div>
              )}
              {addSuccess && (
                <div className="ms-modal-success"><CheckCircle size={16} /><span>{addSuccess}</span></div>
              )}

              <div className="mu-form-row">
                <div className="ms-form-group">
                  <label className="ms-form-label">Full Name <span className="ms-required">*</span></label>
                  <input className="ms-form-input" type="text" name="name"
                    placeholder="e.g. Ahmed Hassan"
                    value={newUser.name} onChange={handleAddChange} />
                </div>
                <div className="ms-form-group">
                  <label className="ms-form-label">Phone</label>
                  <input className="ms-form-input" type="text" name="phone"
                    placeholder="e.g. 0300-1234567"
                    value={newUser.phone} onChange={handleAddChange} />
                </div>
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label">Email <span className="ms-required">*</span></label>
                <input className="ms-form-input" type="email" name="email"
                  placeholder="e.g. ahmed@myshop.com"
                  value={newUser.email} onChange={handleAddChange} />
              </div>

              <div className="ms-form-group">
                <label className="ms-form-label">Password <span className="ms-required">*</span></label>
                <input className="ms-form-input" type="password" name="password"
                  placeholder="Min. 4 characters"
                  value={newUser.password} onChange={handleAddChange} />
              </div>

              <div className="mu-form-row">
                <div className="ms-form-group" style={{ flex: 1 }}>
                  <label className="ms-form-label">Role <span className="ms-required">*</span></label>
                  <CustomSelect
                    name="role"
                    value={newUser.role}
                    onChange={handleAddChange}
                    placeholder="Select a role"
                    options={ROLES}
                  />
                </div>
                <div className="ms-form-group" style={{ flex: 1 }}>
                  <label className="ms-form-label">Assign Store</label>
                  <CustomSelect
                    name="store_id"
                    value={newUser.store_id}
                    onChange={handleAddChange}
                    placeholder="No specific store"
                    options={storeOptions}
                    disabled={stores.length === 0}
                  />
                </div>
              </div>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeAddModal}>Cancel</button>
              <button className="ms-btn-save" onClick={handleAddSubmit} disabled={addLoading}>
                <Plus size={14} /> {addLoading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      
          {/* EDIT USER MODAL */}
      
      {showEditModal && editUser && (
        <div className="ms-modal-overlay" onClick={closeEditModal}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>

            <div className="ms-modal-header">
              <h2 className="ms-modal-title">
                <Edit3 size={18} style={{ marginRight: 8 }} />Edit User
              </h2>
              <button className="ms-modal-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="ms-modal-body">
              {editError && (
                <div className="ms-modal-error"><AlertCircle size={16} /><span>{editError}</span></div>
              )}
              {editSuccess && (
                <div className="ms-modal-success"><CheckCircle size={16} /><span>{editSuccess}</span></div>
              )}

              {/* Read-only user info card */}
              <div className="mu-edit-user-card">
                <div className="mu-edit-avatar">
                  {editUser.image_url
                    ? <img src={`http://localhost:5000${editUser.image_url}`} alt={editUser.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    : getInitials(editUser.name)
                  }
                </div>
                <div className="mu-edit-info">
                  <p className="mu-edit-name">{editUser.name}</p>
                  <p className="mu-edit-email">{editUser.email}</p>
                  {editUser.phone && <p className="mu-edit-phone">{editUser.phone}</p>}
                </div>
              </div>

              <div className="mu-edit-readonly-note">
                <Shield size={13} />
                <span>Name, email, phone and password can only be changed by the user themselves.</span>
              </div>

              <div className="mu-form-row">
                <div className="ms-form-group" style={{ flex: 1 }}>
                  <label className="ms-form-label">Role <span className="ms-required">*</span></label>
                  <CustomSelect
                    name="role"
                    value={editUser.role}
                    onChange={handleEditChange}
                    placeholder="Select a role"
                    options={ROLES}
                  />
                </div>
                <div className="ms-form-group" style={{ flex: 1 }}>
                  <label className="ms-form-label">Assign Store</label>
                  <CustomSelect
                    name="store_id"
                    value={editUser.store_id || ''}
                    onChange={handleEditChange}
                    placeholder="No specific store"
                    options={storeOptions}
                  />
                </div>
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

      
          {/* DELETE CONFIRM MODAL */}
     
      {showDeleteConfirm && deleteTarget && (
        <div className="ms-modal-overlay" onClick={closeDeleteConfirm}>
          <div className="ms-modal mu-delete-modal" onClick={e => e.stopPropagation()}>

            <div className="ms-modal-header">
              <h2 className="ms-modal-title" style={{ color: '#dc2626' }}>
                <Trash2 size={18} style={{ marginRight: 8 }} />Delete User
              </h2>
              <button className="ms-modal-close" onClick={closeDeleteConfirm}><X size={20} /></button>
            </div>

            <div className="ms-modal-body">
              {deleteError && (
                <div className="ms-modal-error"><AlertCircle size={16} /><span>{deleteError}</span></div>
              )}
              <div className="mu-delete-info">
                <div className="mu-delete-avatar">{getInitials(deleteTarget.name)}</div>
                <div>
                  <p className="mu-delete-name">{deleteTarget.name}</p>
                  <p className="mu-delete-email">{deleteTarget.email}</p>
                </div>
              </div>
              <p className="mu-delete-warning">
                Are you sure you want to delete this user? This action <strong>cannot be undone</strong>.
              </p>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeDeleteConfirm}>Cancel</button>
              <button className="mu-btn-confirm-delete" onClick={handleDelete} disabled={deleteLoading}>
                <Trash2 size={14} /> {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyUsers;