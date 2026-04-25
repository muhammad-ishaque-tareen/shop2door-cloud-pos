import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell,Tags, 
  Moon, Settings, Plus, X, AlertCircle, CheckCircle,
  Edit3, Eye, Save, Search, Download, Tag, Trash2,Boxes,
  ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyStores.css';
import './ShopAdminTerminalStyles/Products.css';

const ITEMS_PER_PAGE = 9;
const LOW_STOCK_THRESHOLD = 15;

const CATEGORY_COLORS = [
  'prod-cat-0','prod-cat-1','prod-cat-2','prod-cat-3',
  'prod-cat-4','prod-cat-5','prod-cat-6','prod-cat-7'
];

const stockStatus = (qty) => {
  if (qty === 0) return 'out';
  if (qty <= LOW_STOCK_THRESHOLD) return 'low';
  return 'instock';
};

const stockLabel = (qty) => {
  if (qty === 0) return 'Out of Stock';
  if (qty <= LOW_STOCK_THRESHOLD) return 'Low Stock';
  return 'In Stock';
};

const API = 'http://localhost:5000';

const emptyProduct = {
  name: '', barcode: '', category_id: '', store_id: '',
  price: '', stock: '', unit: 'pcs', description: '', image_url: ''
};

const Products = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  //  Dropdown refs 
  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Data 
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores,     setStores]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Filters
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterStore,  setFilterStore]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);

  // Add / Edit modal 
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData,      setFormData]      = useState(emptyProduct);
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState('');
  const [formSuccess,   setFormSuccess]   = useState('');
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState('');
  const fileInputRef = useRef(null);

  // View modal 
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewProduct,   setViewProduct]   = useState(null);

  // Categories modal 
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName,   setNewCatName]   = useState('');
  const [catLoading,   setCatLoading]   = useState(false);
  const [catError,     setCatError]     = useState('');
  const [catSuccess,   setCatSuccess]   = useState('');

  //  Category color map 
  const catColorMap = useRef({});
  const getCatColor = (catId) => {
    if (!catColorMap.current[catId]) {
      const keys = Object.keys(catColorMap.current);
      catColorMap.current[catId] = CATEGORY_COLORS[keys.length % CATEGORY_COLORS.length];
    }
    return catColorMap.current[catId];
  };

  //  Fetch 
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, cRes, sRes] = await Promise.all([
        fetch(`${API}/api/shopproducts`, { headers }),
        fetch(`${API}/api/shopproducts/categories`, { headers }),
        fetch(`${API}/api/stores`, { headers })
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      else setError('Failed to load products.');
      if (cRes.ok) setCategories(await cRes.json());
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

  // Computed stats 
  const stats = {
    total:   products.length,
    instock: products.filter(p => stockStatus(p.stock) === 'instock').length,
    low:     products.filter(p => stockStatus(p.stock) === 'low').length,
    out:     products.filter(p => stockStatus(p.stock) === 'out').length
  };

  // Filtered products 
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase());
    const matchCat    = !filterCat    || String(p.category_id) === filterCat;
    const matchStore  = !filterStore  || String(p.store_id)    === filterStore;
    const matchStatus = !filterStatus || stockStatus(p.stock)  === filterStatus;
    return matchSearch && matchCat && matchStore && matchStatus;
  });

  const totalPages   = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage     = Math.min(page, totalPages);
  const paginated    = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  //  Auth helpers 
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
        style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />;
    return <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>{initials}</span>;
  };

  //  Image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  //  Open Add Modal 
  const openAddModal = () => {
    setFormData(emptyProduct);
    setImageFile(null); setImagePreview('');
    setFormError(''); setFormSuccess('');
    setShowAddModal(true);
  };

  //  Open Edit Modal 
  const openEditModal = (product) => {
    setFormData({
      name:        product.name || '',
      barcode:     product.barcode || '',
      category_id: product.category_id ? String(product.category_id) : '',
      store_id:    product.store_id    ? String(product.store_id)    : '',
      price:       product.price       ? String(product.price)       : '',
      stock:       product.stock       !== undefined ? String(product.stock) : '',
      unit:        product.unit        || 'pcs',
      description: product.description || '',
      image_url:   product.image_url   || '',
      product_id:  product.product_id
    });
    setImageFile(null);
    setImagePreview(product.image_url ? `${API}${product.image_url}` : '');
    setFormError(''); setFormSuccess('');
    setShowEditModal(true);
  };

  const closeFormModal = () => {
    setShowAddModal(false); setShowEditModal(false);
    setFormError(''); setFormSuccess('');
    setImageFile(null); setImagePreview('');
  };

  // Submit Add 
  const handleAddSubmit = async () => {
    if (!formData.name.trim()) return setFormError('Product name is required.');
    if (!formData.price)       return setFormError('Price is required.');
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)
      return setFormError('Please enter a valid price.');
    if (parseFloat(formData.price) > 9999999999.99)
      return setFormError('Price is too large. Please enter a realistic value.');
    if (!formData.store_id)    return setFormError('Store is required.');
    setFormLoading(true); setFormError(''); setFormSuccess('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API}/api/shopproducts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Product added successfully!');
        fetchAll();
        setTimeout(() => closeFormModal(), 1200);
      } else {
        setFormError(data.message || 'Failed to add product.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  //  Submit Edit 
  const handleEditSubmit = async () => {
    if (!formData.name.trim()) return setFormError('Product name is required.');
    if (!formData.price)       return setFormError('Price is required.');
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0)
      return setFormError('Please enter a valid price.');
    if (parseFloat(formData.price) > 9999999999.99)
      return setFormError('Price is too large. Please enter a realistic value.');
    setFormLoading(true); setFormError(''); setFormSuccess('');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== '' && k !== 'product_id') fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);

      const res = await fetch(`${API}/api/shopproducts/${formData.product_id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Product updated successfully!');
        fetchAll();
        setTimeout(() => closeFormModal(), 1200);
      } else {
        setFormError(data.message || 'Failed to update product.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  //  Delete product 
  const handleDelete = async (product_id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/api/shopproducts/${product_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAll();
      else {
        const d = await res.json();
        alert(d.message || 'Failed to delete product.');
      }
    } catch { alert('Network error.'); }
  };

  //  View product 
  const openViewModal  = (p) => { setViewProduct(p); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setViewProduct(null); };

  // Categories 
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return setCatError('Category name is required.');
    setCatLoading(true); setCatError(''); setCatSuccess('');
    try {
      const res = await fetch(`${API}/api/shopproducts/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setCatSuccess('Category added!');
        setNewCatName('');
        fetchAll();
        setTimeout(() => setCatSuccess(''), 1500);
      } else {
        setCatError(data.message || 'Failed to add category.');
      }
    } catch { setCatError('Network error.'); }
    finally { setCatLoading(false); }
  };

  const handleDeleteCategory = async (cat_id) => {
    if (!window.confirm('Delete this category? Products using it will be unlinked.')) return;
    try {
      const res = await fetch(`${API}/api/shopproducts/categories/${cat_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchAll();
      else {
        const d = await res.json();
        alert(d.message || 'Failed to delete category.');
      }
    } catch { alert('Network error.'); }
  };

  //  Export CSV 
  const handleExport = () => {
    const rows = [
      ['Name','Barcode','Category','Store','Price','Stock','Status'],
      ...filtered.map(p => [
        p.name, p.barcode || '', p.category_name || '', p.store_name || '',
        p.price, p.stock, stockLabel(p.stock)
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  //  Category name lookup 
  const catName = (id) => categories.find(c => c.category_id === id)?.name || '—';

  //  Product form shared 
  const ProductForm = () => (
    <>
      {formError   && <div className="ms-modal-error"><AlertCircle size={16}/><span>{formError}</span></div>}
      {formSuccess  && <div className="ms-modal-success"><CheckCircle size={16}/><span>{formSuccess}</span></div>}

      {/* Image upload */}
      <div
        className={`prod-img-upload-area ${imagePreview ? 'has-img' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input ref={fileInputRef} type="file" accept="image/*"
          style={{ display:'none' }} onChange={handleImageChange} />
        {imagePreview
          ? <img src={imagePreview} alt="preview" className="prod-img-preview" />
          : <div style={{ color:'#9ca3af', marginBottom:'0.5rem' }}><ImageIcon size={32} /></div>
        }
        <p className="prod-upload-label">
          {imagePreview ? 'Click to change image' : <><span>Click to upload</span> product image</>}
        </p>
      </div>

      <div className="prod-form-grid-2">
        <div className="ms-form-group">
          <label className="ms-form-label">Product Name <span className="ms-required">*</span></label>
          <input className="ms-form-input" placeholder="e.g. iPhone 15 Pro"
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="ms-form-group">
          <label className="ms-form-label">Barcode</label>
          <input className="ms-form-input" placeholder="e.g. Product-0001"
            value={formData.barcode}
            onChange={e => setFormData(f => ({ ...f, barcode: e.target.value }))} />
        </div>
      </div>

      <div className="prod-form-grid-2">
        <div className="ms-form-group">
          <label className="ms-form-label">Category</label>
          <select className="ms-form-select" value={formData.category_id}
            onChange={e => setFormData(f => ({ ...f, category_id: e.target.value }))}>
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="ms-form-group">
          <label className="ms-form-label">Store <span className="ms-required">*</span></label>
          <select className="ms-form-select" value={formData.store_id}
            onChange={e => setFormData(f => ({ ...f, store_id: e.target.value }))}>
            <option value="">Select Store ...</option>
            {stores.map(s => (
              <option key={s.store_id} value={s.store_id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="prod-form-grid-2">
        <div className="ms-form-group">
          <label className="ms-form-label">Price (Rs.) <span className="ms-required">*</span></label>
          <input className="ms-form-input" type="number" min="0" placeholder="e.g. 45000"
            value={formData.price}
            onChange={e => setFormData(f => ({ ...f, price: e.target.value }))} />
        </div>
        <div className="ms-form-group">
          <label className="ms-form-label">Initial Stock Qty</label>
          <input className="ms-form-input" type="number" min="0" placeholder="e.g. 50"
            value={formData.stock}
            onChange={e => setFormData(f => ({ ...f, stock: e.target.value }))} />
        </div>
      </div>

      <div className="ms-form-group">
        <label className="ms-form-label">Unit</label>
        <select className="ms-form-select" value={formData.unit}
          onChange={e => setFormData(f => ({ ...f, unit: e.target.value }))}>
          {['pcs','kg','ltr','g','ml','box','pack','dozen'].map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <div className="ms-form-group">
        <label className="ms-form-label">Description</label>
        <input className="ms-form-input" placeholder="Short description..."
          value={formData.description}
          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
      </div>
    </>
  );

  return (
    <div className="shop-admin-container">
      {/*SIDEBAR*/}
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
          <button className="shop-nav-item active">
            <ShoppingCart size={18}/><span>Products</span>
          </button>

           <button className="mp-nav-item" onClick={() => navigate('/categories')}>
            <Tags size={18} /><span>Categories</span>
          </button>
         <button className="mp-nav-item" onClick={() => navigate('/inventory')}>
            <Boxes size={18} /><span>Inventory</span>
         </button>

         
          <div className="nav-divider"/>
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

      {/* MAIN  */}
      <main className="shop-admin-main">
        {/*  HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Products</div>
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
                        onClick={() => { setFilterStore(String(s.store_id)); setShowMenuDropdown(false); }}>
                        <Store size={16}/><span>{s.name}</span>
                      </button>
                    )) : <div className="shop-menu-item">No stores</div>}
                  </div>
                  {filterStore && (
                    <>
                      <div className="shop-menu-divider"/>
                      <div className="shop-menu-section">
                        <button className="shop-menu-item" onClick={() => { setFilterStore(''); setShowMenuDropdown(false); }}>
                          <X size={16}/><span>Clear Filter</span>
                        </button>
                      </div>
                    </>
                  )}
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

        {/*  CONTENT  */}
        <div className="shop-dashboard-content">

          {/* Page header */}
          <div className="prod-page-header">
            <div>
              <h1 className="prod-title">Products</h1>
              <p className="prod-subtitle">Manage your product catalog across all stores</p>
            </div>
            <div className="prod-header-btns">
              <button className="prod-btn-export" onClick={handleExport}>
                <Download size={15}/> Export
              </button>
              <button className="prod-btn-add" onClick={openAddModal}>
                <Plus size={15}/> Add Product
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="prod-stat-cards">
            <div className="prod-stat-card">
              <div className="prod-stat-icon-wrap total"><PackageIcon size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Total Products</p>
                <p className="prod-stat-value">{stats.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="prod-stat-card">
              <div className="prod-stat-icon-wrap instock">
                <CheckCircle size={20}/>
              </div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">In Stock</p>
                <p className="prod-stat-value">{stats.instock.toLocaleString()}</p>
              </div>
            </div>
            <div className="prod-stat-card">
              <div className="prod-stat-icon-wrap low"><AlertCircle size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Low Stock</p>
                <p className="prod-stat-value">{stats.low.toLocaleString()}</p>
              </div>
            </div>
            <div className="prod-stat-card">
              <div className="prod-stat-icon-wrap out"><X size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Out of Stock</p>
                <p className="prod-stat-value">{stats.out.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="prod-filter-bar">
            <div className="prod-search-wrap">
              <Search size={15} className="prod-search-icon"/>
              <input className="prod-search-input" placeholder="Search products..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="prod-select" value={filterCat}
              onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
            <select className="prod-select" value={filterStore}
              onChange={e => { setFilterStore(e.target.value); setPage(1); }}>
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s.store_id} value={s.store_id}>{s.name}</option>
              ))}
            </select>
            <select className="prod-select" value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
              <option value="">All Stock</option>
              <option value="instock">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <button className="prod-btn-categories" onClick={() => setShowCatModal(true)}>
              <Tag size={14}/> Categories
            </button>
          </div>

          {/* Table */}
          <div className="prod-table-card">
            {loading ? (
              <div className="prod-loading">Loading products...</div>
            ) : error ? (
              <div className="prod-empty">
                <div className="prod-empty-icon"><AlertCircle size={24}/></div>
                <h3>Error</h3><p>{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="prod-empty">
                <div className="prod-empty-icon"><PackageIcon size={24}/></div>
                <h3>No products found</h3>
                <p>{search || filterCat || filterStore || filterStatus
                  ? 'Try adjusting your filters.'
                  : 'Add your first product to get started.'}</p>
              </div>
            ) : (
              <>
                <div className="prod-table-wrap">
                  <table className="prod-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Barcode</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map(p => {
                        const status = stockStatus(p.stock);
                        const catIdx = categories.findIndex(c => c.category_id === p.category_id);
                        const colorClass = catIdx >= 0
                          ? CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length]
                          : 'prod-cat-0';
                        return (
                          <tr key={p.product_id}>
                            <td>
                              <div className="prod-thumb-cell">
                                {p.image_url
                                  ? <img src={`${API}${p.image_url}`} alt={p.name}
                                      className="prod-thumb"
                                      onError={e => { e.target.style.display='none'; }} />
                                  : <div className="prod-thumb-placeholder">
                                      <PackageIcon size={16}/>
                                    </div>
                                }
                                <span className="prod-name">{p.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="prod-sku">{p.barcode || '—'}</span>
                            </td>
                            <td>
                              {p.category_name
                                ? <span className={`prod-cat-badge ${colorClass}`}>{p.category_name}</span>
                                : <span style={{ color:'#9ca3af', fontSize:'0.8125rem' }}>—</span>
                              }
                            </td>
                            <td>
                              <span className="prod-price">Rs. {parseFloat(p.price).toLocaleString()}</span>
                            </td>
                            <td>
                              <span className={`prod-stock-num ${status}`}>{p.stock}</span>
                            </td>
                            <td>
                              <span className={`prod-status-badge ${status}`}>
                                <span className="prod-status-dot"/>
                                {stockLabel(p.stock)}
                              </span>
                            </td>
                            <td>
                              <div className="prod-action-btns">
                                <button className="prod-tbl-btn-edit" onClick={() => openEditModal(p)}>Edit</button>
                                <button className="prod-tbl-btn-view" onClick={() => openViewModal(p)}>View</button>
                                <button className="prod-tbl-btn-delete" onClick={() => handleDelete(p.product_id)}>
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="prod-table-footer">
                  <span className="prod-pagination-info">
                    Showing {((safePage - 1) * ITEMS_PER_PAGE) + 1}–
                    {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} products
                  </span>
                  <div className="prod-pagination-btns">
                    <button className="prod-page-btn" disabled={safePage === 1}
                      onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft size={14}/> Previous
                    </button>
                    <button className="prod-page-btn" disabled={safePage === totalPages}
                      onClick={() => setPage(p => p + 1)}>
                      Next <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="ms-modal-overlay" onClick={closeFormModal}>
          <div className="ms-modal prod-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Plus size={18} style={{ marginRight:8 }}/> Add New Product</h2>
              <button className="ms-modal-close" onClick={closeFormModal}><X size={20}/></button>
            </div>
            <div className="ms-modal-body">{ProductForm()}</div>
            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeFormModal}>Cancel</button>
              <button className="ms-btn-save" onClick={handleAddSubmit} disabled={formLoading}>
                <Plus size={14}/> {formLoading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="ms-modal-overlay" onClick={closeFormModal}>
          <div className="ms-modal prod-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Edit3 size={18} style={{ marginRight:8 }}/> Edit Product</h2>
              <button className="ms-modal-close" onClick={closeFormModal}><X size={20}/></button>
            </div>
            <div className="ms-modal-body">{ProductForm()}</div>
            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeFormModal}>Cancel</button>
              <button className="ms-btn-save" onClick={handleEditSubmit} disabled={formLoading}>
                <Save size={14}/> {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW PRODUCT MODAL */}
      {showViewModal && viewProduct && (
        <div className="ms-modal-overlay" onClick={closeViewModal}>
          <div className="ms-modal ms-modal-wide" onClick={e => e.stopPropagation()}>
            <div className="prod-view-header">
              <div className="prod-view-header-left">
                {viewProduct.image_url
                  ? <img src={`${API}${viewProduct.image_url}`} alt={viewProduct.name}
                      className="prod-view-product-img"
                      onError={e => { e.target.style.display='none'; }} />
                  : <div className="prod-view-product-placeholder"><PackageIcon size={24}/></div>
                }
                <div>
                  <p className="prod-view-title">{viewProduct.name}</p>
                  <p className="prod-view-sku">{viewProduct.barcode || 'No barcode'}</p>
                </div>
              </div>
              <button className="ms-modal-close" style={{ color:'rgba(255,255,255,0.8)' }}
                onClick={closeViewModal}><X size={20}/></button>
            </div>

            <div className="ms-modal-body">
              <div className="prod-view-stats-row">
                <div className="prod-view-stat-card">
                  <p className="prod-view-stat-value">Rs. {parseFloat(viewProduct.price).toLocaleString()}</p>
                  <p className="prod-view-stat-label">Price</p>
                </div>
                <div className="prod-view-stat-card">
                  <p className="prod-view-stat-value">{viewProduct.stock}</p>
                  <p className="prod-view-stat-label">Stock</p>
                </div>
                <div className="prod-view-stat-card">
                  <p className="prod-view-stat-value">{viewProduct.unit || 'pcs'}</p>
                  <p className="prod-view-stat-label">Unit</p>
                </div>
              </div>

              <div className="prod-view-detail-grid">
                <div className="prod-view-detail-card">
                  <p className="prod-view-detail-label">Category</p>
                  <p className="prod-view-detail-val">{viewProduct.category_name || '—'}</p>
                </div>
                <div className="prod-view-detail-card">
                  <p className="prod-view-detail-label">Store</p>
                  <p className="prod-view-detail-val">{viewProduct.store_name || '—'}</p>
                </div>
                <div className="prod-view-detail-card">
                  <p className="prod-view-detail-label">Status</p>
                  <p className="prod-view-detail-val">{stockLabel(viewProduct.stock)}</p>
                </div>
                <div className="prod-view-detail-card">
                  <p className="prod-view-detail-label">Added</p>
                  <p className="prod-view-detail-val">
                    {viewProduct.created_at ? new Date(viewProduct.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {viewProduct.description && (
                  <div className="prod-view-detail-card" style={{ gridColumn:'1/-1' }}>
                    <p className="prod-view-detail-label">Description</p>
                    <p className="prod-view-detail-val">{viewProduct.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeViewModal}>Close</button>
              <button className="ms-btn-save" onClick={() => { closeViewModal(); openEditModal(viewProduct); }}>
                <Edit3 size={14}/> Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MODAL */}
      {showCatModal && (
        <div className="ms-modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-header">
              <h2 className="ms-modal-title"><Tag size={18} style={{ marginRight:8 }}/> Manage Categories</h2>
              <button className="ms-modal-close" onClick={() => setShowCatModal(false)}><X size={20}/></button>
            </div>
            <div className="ms-modal-body">
              {catError   && <div className="ms-modal-error"><AlertCircle size={16}/><span>{catError}</span></div>}
              {catSuccess  && <div className="ms-modal-success"><CheckCircle size={16}/><span>{catSuccess}</span></div>}

              <div className="prod-cat-list">
                {categories.length === 0
                  ? <p style={{ color:'#9ca3af', fontSize:'0.875rem', textAlign:'center', padding:'1rem 0' }}>
                      No categories yet.
                    </p>
                  : categories.map((c, i) => (
                      <div key={c.category_id} className="prod-cat-item">
                        <span className={`prod-cat-badge ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} prod-cat-item-name`}>
                          {c.name}
                        </span>
                        <div className="prod-cat-item-btns">
                          <button className="prod-cat-del-btn"
                            onClick={() => handleDeleteCategory(c.category_id)}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    ))
                }
              </div>

              <div className="prod-cat-add-row">
                <input className="ms-form-input" placeholder="New category name..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }} />
                <button className="prod-cat-add-btn" onClick={handleAddCategory} disabled={catLoading}>
                  <Plus size={14}/> Add
                </button>
              </div>
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={() => setShowCatModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;