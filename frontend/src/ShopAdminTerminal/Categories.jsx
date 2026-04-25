import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell,
  Tags, Moon, Settings, Plus, X, AlertCircle, CheckCircle, Boxes,TrendingUp,
  Edit3, Save, Search, Trash2, Tag, Grid, List,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyStores.css';
import './ShopAdminTerminalStyles/Categories.css';

const API = 'http://localhost:5000';

const CAT_COLORS = [
  { bg: '#dbeafe', color: '#1d4ed8', icon: '📦' },
  { bg: '#dcfce7', color: '#15803d', icon: '🌿' },
  { bg: '#fef3c7', color: '#b45309', icon: '⭐' },
  { bg: '#fce7f3', color: '#be185d', icon: '🎀' },
  { bg: '#e0e7ff', color: '#4338ca', icon: '💎' },
  { bg: '#ccfbf1', color: '#0f766e', icon: '🌊' },
  { bg: '#fff7ed', color: '#c2410c', icon: '🔥' },
  { bg: '#f3e8ff', color: '#7e22ce', icon: '✨' },
  { bg: '#fef2f2', color: '#b91c1c', icon: '❤️' },
  { bg: '#f0fdf4', color: '#166534', icon: '🌱' },
];

const getColor = (index) => CAT_COLORS[index % CAT_COLORS.length];

const Categories = () => {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const token     = localStorage.getItem('token');

  // Dropdown refs 
  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Data 
  const [categories, setCategories] = useState([]);
  const [stores,     setStores]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // View toggle
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  //  Search 
  const [search, setSearch] = useState('');

  //  Add Modal 
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [addName,       setAddName]       = useState('');
  const [addLoading,    setAddLoading]    = useState(false);
  const [addError,      setAddError]      = useState('');
  const [addSuccess,    setAddSuccess]    = useState('');

  // Edit Modal 
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCat,       setEditCat]       = useState(null);
  const [editName,      setEditName]      = useState('');
  const [editLoading,   setEditLoading]   = useState(false);
  const [editError,     setEditError]     = useState('');
  const [editSuccess,   setEditSuccess]   = useState('');

  // Delete confirm 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCat,       setDeleteCat]       = useState(null);
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  //Fetch 
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/api/categories`, { headers }),
        fetch(`${API}/api/stores`,     { headers }),
      ]);
      if (cRes.ok) setCategories(await cRes.json());
      else         setError('Failed to load categories.');
      if (sRes.ok) setStores(await sRes.json());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Computed 
  const totalProducts = categories.reduce((s, c) => s + (c.product_count || 0), 0);
  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Auth helpers
  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl = user.shop_logo ? `${API}${user.shop_logo}` : null;
  const renderShopLogo = () => {
    if (shopLogoUrl)
      return <img src={shopLogoUrl} alt={user.shop_name || 'Shop'} className="shop-sidebar-logo-img"
        onError={e => { e.target.style.display = 'none'; }} />;
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url)
      return <img src={`${API}${user.image_url}`} alt="Profile"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    return <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>{initials}</span>;
  };

  // Add Category
  const openAddModal = () => {
    setAddName(''); setAddError(''); setAddSuccess('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addName.trim()) return setAddError('Category name is required.');
    setAddLoading(true); setAddError(''); setAddSuccess('');
    try {
      const res = await fetch(`${API}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: addName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAddSuccess('Category added successfully!');
        setCategories(prev => [...prev, data]);
        setAddName('');
        setTimeout(() => { setShowAddModal(false); setAddSuccess(''); }, 1200);
      } else {
        setAddError(data.message || 'Failed to add category.');
      }
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  //  Edit Category
  const openEditModal = (cat) => {
    setEditCat(cat);
    setEditName(cat.name);
    setEditError(''); setEditSuccess('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editName.trim()) return setEditError('Category name is required.');
    setEditLoading(true); setEditError(''); setEditSuccess('');
    try {
      const res = await fetch(`${API}/api/categories/${editCat.category_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditSuccess('Category updated!');
        setCategories(prev => prev.map(c => c.category_id === editCat.category_id ? data : c));
        setTimeout(() => { setShowEditModal(false); setEditSuccess(''); setEditCat(null); }, 1000);
      } else {
        setEditError(data.message || 'Failed to update category.');
      }
    } catch {
      setEditError('Network error. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Category 
  const openDeleteModal = (cat) => { setDeleteCat(cat); setShowDeleteModal(true); };

  const handleDeleteConfirm = async () => {
    if (!deleteCat) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/categories/${deleteCat.category_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.category_id !== deleteCat.category_id));
        setShowDeleteModal(false); setDeleteCat(null);
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete category.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="shop-admin-container">

      {/* SIDEBAR */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">{renderShopLogo()}</div>
        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18}/><span>Dashboard</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18}/><span>Shop Profile</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18}/><span>My Stores</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18}/><span>My Users</span>
          </button>
           <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18}/><span>Suppliers</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18}/><span>Products</span>
          </button>
          <button className="shop-nav-item active">
            <Tags size={18}/><span>Categories</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/inventory')}>
            <Boxes size={18} /><span>Inventory</span>
          </button>
         

          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/salesrecords')}>
            <TrendingUp size={18}/><span>Sales Records</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18}/><span>Subscription</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18}/><span>My Profile</span>
          </button>
          <button className="shop-nav-item" onClick={handleLogOut}>
            <LogOut size={18}/><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="shop-admin-main">

        {/* HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Categories</div>
          <div className="shop-header-actions">
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                All Stores <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">My Stores</h4>
                    {stores.length > 0 ? stores.map(s => (
                      <button key={s.store_id} className="shop-menu-item"
                        onClick={() => setShowMenuDropdown(false)}>
                        <Store size={16}/><span>{s.name}</span>
                      </button>
                    )) : <div className="shop-menu-item">No stores</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="shop-icon-circle moon"><Moon size={16}/></div>
            <div className="shop-icon-circle bell"><Bell size={16}/></div>
            <div className="shop-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="shop-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
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
                  <div className="shop-profile-divider"/>
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
                  <div className="shop-profile-divider"/>
                  <div className="shop-profile-actions">
                    <button className="shop-profile-action-btn"
                      onClick={() => { setShowProfileDropdown(false); navigate('/adminprofile'); }}>
                      <User size={18}/><span>My Profile</span>
                    </button>
                    <button className="shop-profile-action-btn shop-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18}/><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="shop-dashboard-content">

          {/* Page header */}
          <div className="cat-page-header">
            <div>
              <h1 className="cat-title">Categories</h1>
              <p className="cat-subtitle">Organize your products into categories</p>
            </div>
            <button className="cat-btn-add" onClick={openAddModal}>
              <Plus size={15}/> Add Category
            </button>
          </div>

          {/* Stat cards */}
          <div className="cat-stat-cards">
            <div className="cat-stat-card">
              <div className="cat-stat-icon-wrap" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                <Tags size={20}/>
              </div>
              <div className="cat-stat-info">
                <p className="cat-stat-label">Total Categories</p>
                <p className="cat-stat-value">{categories.length}</p>
              </div>
            </div>
            <div className="cat-stat-card">
              <div className="cat-stat-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <PackageIcon size={20}/>
              </div>
              <div className="cat-stat-info">
                <p className="cat-stat-label">Total Products</p>
                <p className="cat-stat-value">{totalProducts}</p>
              </div>
            </div>
            <div className="cat-stat-card">
              <div className="cat-stat-icon-wrap" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                <CheckCircle size={20}/>
              </div>
              <div className="cat-stat-info">
                <p className="cat-stat-label">Active Categories</p>
                <p className="cat-stat-value">{categories.filter(c => c.product_count > 0).length}</p>
              </div>
            </div>
            <div className="cat-stat-card">
              <div className="cat-stat-icon-wrap" style={{ background: '#fef3c7', color: '#ca8a04' }}>
                <AlertCircle size={20}/>
              </div>
              <div className="cat-stat-info">
                <p className="cat-stat-label">Empty Categories</p>
                <p className="cat-stat-value">{categories.filter(c => !c.product_count).length}</p>
              </div>
            </div>
          </div>

          {/* Filter + view toggle bar */}
          <div className="cat-filter-bar">
            <div className="cat-search-wrap">
              <Search size={15} className="cat-search-icon"/>
              <input
                className="cat-search-input"
                placeholder="Search categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="cat-view-toggle">
              <button
                className={`cat-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid size={16}/>
              </button>
              <button
                className={`cat-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={16}/>
              </button>
            </div>
          </div>

          {/* Content area */}
          {loading ? (
            <div className="cat-loading">
              <div className="cat-loading-spinner"/>
              <p>Loading categories...</p>
            </div>
          ) : error ? (
            <div className="cat-error-state">
              <AlertCircle size={40}/>
              <p>{error}</p>
              <button className="cat-btn-add" onClick={fetchAll}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="cat-empty">
              <div className="cat-empty-icon"><Tags size={32}/></div>
              <h3>{search ? 'No categories found' : 'No categories yet'}</h3>
              <p>{search ? 'Try a different search term.' : 'Add your first category to get started.'}</p>
              {!search && (
                <button className="cat-btn-add" style={{ marginTop: '1rem' }} onClick={openAddModal}>
                  <Plus size={15}/> Add Category
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (

            /*  GRID VIEW  */
            <div className="cat-grid">
              {filtered.map((cat, i) => {
                const style = getColor(i);
                return (
                  <div key={cat.category_id} className="cat-card">
                    <div className="cat-card-icon-wrap" style={{ background: style.bg, color: style.color }}>
                      <span className="cat-card-emoji">{style.icon}</span>
                    </div>
                    <div className="cat-card-body">
                      <h3 className="cat-card-name">{cat.name}</h3>
                      <p className="cat-card-count">
                        {cat.product_count}{' '}
                        {cat.product_count === 1 ? 'Product' : 'Products'}
                      </p>
                    </div>
                    <div className="cat-card-actions">
                      <button className="cat-card-btn-edit" onClick={() => openEditModal(cat)}
                        title="Edit">
                        <Edit3 size={14}/> Edit
                      </button>
                      <button className="cat-card-btn-delete" onClick={() => openDeleteModal(cat)}
                        title="Delete">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add new card */}
              <button className="cat-card-add" onClick={openAddModal}>
                <div className="cat-card-add-icon"><Plus size={28}/></div>
                <p className="cat-card-add-label">Add Category</p>
              </button>
            </div>

          ) : (

            /*  LIST VIEW */
            <div className="cat-list-card">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category Name</th>
                    <th>Products</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cat, i) => {
                    const style = getColor(i);
                    return (
                      <tr key={cat.category_id}>
                        <td className="cat-tbl-num">{i + 1}</td>
                        <td>
                          <div className="cat-tbl-name-cell">
                            <div className="cat-tbl-icon" style={{ background: style.bg, color: style.color }}>
                              {style.icon}
                            </div>
                            <span className="cat-tbl-name">{cat.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="cat-tbl-count-badge"
                            style={{ background: style.bg, color: style.color }}>
                            {cat.product_count} {cat.product_count === 1 ? 'product' : 'products'}
                          </span>
                        </td>
                        <td className="cat-tbl-date">
                          {cat.created_at ? new Date(cat.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="cat-tbl-actions">
                            <button className="cat-tbl-btn-edit" onClick={() => openEditModal(cat)}>
                              <Edit3 size={13}/> Edit
                            </button>
                            <button className="cat-tbl-btn-delete" onClick={() => openDeleteModal(cat)}>
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="cat-list-footer">
                <span className="cat-list-info">
                  Showing {filtered.length} of {categories.length} categories
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="ms-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Plus size={18} style={{ marginRight: 8 }}/> Add New Category</h2>
              <button className="ms-modal-close" onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <div className="ms-modal-body">
              {addError   && <div className="ms-modal-error"><AlertCircle size={16}/><span>{addError}</span></div>}
              {addSuccess  && <div className="ms-modal-success"><CheckCircle size={16}/><span>{addSuccess}</span></div>}
              <div className="ms-form-group">
                <label className="ms-form-label">Category Name <span className="ms-required">*</span></label>
                <input
                  className="ms-form-input"
                  placeholder="e.g. Smartphones"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddSubmit(); }}
                  autoFocus
                />
              </div>
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="ms-btn-save" onClick={handleAddSubmit} disabled={addLoading}>
                <Plus size={14}/> {addLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL*/}
      {showEditModal && editCat && (
        <div className="ms-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Edit3 size={18} style={{ marginRight: 8 }}/> Edit Category</h2>
              <button className="ms-modal-close" onClick={() => setShowEditModal(false)}><X size={20}/></button>
            </div>
            <div className="ms-modal-body">
              {editError   && <div className="ms-modal-error"><AlertCircle size={16}/><span>{editError}</span></div>}
              {editSuccess  && <div className="ms-modal-success"><CheckCircle size={16}/><span>{editSuccess}</span></div>}
              <div className="ms-form-group">
                <label className="ms-form-label">Category Name <span className="ms-required">*</span></label>
                <input
                  className="ms-form-input"
                  placeholder="Category name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSubmit(); }}
                  autoFocus
                />
              </div>
              <div className="cat-edit-info">
                <Tag size={13}/>
                <span>This category contains <strong>{editCat.product_count}</strong> product(s).</span>
              </div>
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="ms-btn-save" onClick={handleEditSubmit} disabled={editLoading}>
                <Save size={14}/> {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  DELETE CONFIRM MODAL  */}
      {showDeleteModal && deleteCat && (
        <div className="ms-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ms-modal cat-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="cat-delete-icon-wrap">
              <Trash2 size={32} color="#dc2626"/>
            </div>
            <h2 className="cat-delete-title">Delete Category</h2>
            <p className="cat-delete-body">
              Are you sure you want to delete <strong>"{deleteCat.name}"</strong>?
              {deleteCat.product_count > 0 && (
                <span className="cat-delete-warning">
                  <AlertCircle size={14}/> {deleteCat.product_count} product(s) will be unlinked from this category.
                </span>
              )}
            </p>
            <div className="cat-delete-actions">
              <button className="ms-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="cat-btn-confirm-delete" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                <Trash2 size={14}/> {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;