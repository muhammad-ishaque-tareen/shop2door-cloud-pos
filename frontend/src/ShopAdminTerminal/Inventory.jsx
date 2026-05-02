import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell, Tags,
  Moon, Settings, X, AlertCircle, CheckCircle,
  Search, Boxes, ChevronLeft, ChevronRight, Layers, TrendingUp,
  TrendingDown, MinusCircle, Edit3, Save, FileBarChart, DollarSign,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyStores.css';
import './ShopAdminTerminalStyles/Products.css';
import './ShopAdminTerminalStyles/Inventory.css';

const ITEMS_PER_PAGE = 20;
const API = 'http://localhost:5000';

const CATEGORY_COLORS = [
  'prod-cat-0','prod-cat-1','prod-cat-2','prod-cat-3',
  'prod-cat-4','prod-cat-5','prod-cat-6','prod-cat-7',
];

const fmt = (n) => `Rs. ${parseFloat(n || 0).toLocaleString()}`;

/*  status helpers — use per-product reorder_level  */
const stockStatus = (qty, reorderLevel = 10) => {
  if (qty === 0)              return 'out';
  if (qty <= reorderLevel)    return 'low';
  return 'instock';
};
const stockLabel = (qty, reorderLevel = 10) => {
  if (qty === 0)              return 'Out of Stock';
  if (qty <= reorderLevel)    return 'Low Stock';
  return 'In Stock';
};

/* ══════════════════════════════════════════════════════════════════════════
   STOCK ADJUST MODAL
   — now sends store_id validation, uses transaction on backend
══════════════════════════════════════════════════════════════════════════ */
const AdjustModal = ({ product, onClose, onSaved, token }) => {
  const [qty,     setQty]     = useState(product.stock ?? 0);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (qty < 0) { setError('Quantity cannot be negative.'); return; }
    if (!product.store_id) { setError('No store associated with this product.'); return; }

    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/inventory/${product.product_id}/adjust`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ store_id: product.store_id, quantity: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Stock updated! Status: ${data.status}`);
        setTimeout(() => { onSaved(); onClose(); }, 900);
      } else {
        setError(data.message || 'Failed to update stock.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally  { setSaving(false); }
  };

  const diff = qty - (product.stock ?? 0);

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal inv-adjust-modal" onClick={e => e.stopPropagation()}>
        <div className="ms-modal-header">
          <h2 className="ms-modal-title"><Edit3 size={17} style={{ marginRight: 8 }}/> Stock Adjustment</h2>
          <button className="ms-modal-close" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="ms-modal-body">
          {error   && <div className="ms-modal-error"  ><AlertCircle  size={16}/><span>{error}</span></div>}
          {success && <div className="ms-modal-success"><CheckCircle size={16}/><span>{success}</span></div>}

          <div className="inv-adjust-product-strip">
            {product.image_url
              ? <img src={`${API}${product.image_url}`} alt={product.name}
                  className="inv-adjust-thumb"
                  onError={e => { e.target.style.display = 'none'; }} />
              : <div className="inv-adjust-thumb inv-adjust-thumb-ph"><PackageIcon size={20}/></div>
            }
            <div>
              <p className="inv-adjust-name">{product.name}</p>
              <p className="inv-adjust-meta">
                {product.store_name || '—'} · {product.category_name || 'Uncategorized'}
              </p>
              <p className="inv-adjust-meta">
                Current: <strong>{product.stock} {product.unit || 'pcs'}</strong>
                &nbsp;·&nbsp;Reorder level: <strong>{product.reorder_level ?? 10}</strong>
              </p>
            </div>
          </div>

          <div className="ms-form-group">
            <label className="ms-form-label">
              New Stock Quantity ({product.unit || 'pcs'})
            </label>
            <div className="inv-qty-control">
              <button className="inv-qty-btn"
                onClick={() => setQty(q => Math.max(0, q - 1))}>−</button>
              <input
                type="number" min="0"
                className="inv-qty-input"
                value={qty}
                onChange={e => setQty(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <button className="inv-qty-btn"
                onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          <div className="inv-adjust-diff">
            {diff > 0 && <span className="inv-diff-up">▲ Adding {diff} units</span>}
            {diff < 0 && <span className="inv-diff-down">▼ Removing {Math.abs(diff)} units</span>}
            {diff === 0 && <span className="inv-diff-same">● No change from current stock</span>}
          </div>

          {/* Warn if new qty will be at or below reorder level */}
          {qty > 0 && qty <= (product.reorder_level ?? 10) && (
            <div className="inv-adjust-warn">
              <AlertCircle size={14}/>
              &nbsp;This quantity is at or below the reorder level ({product.reorder_level ?? 10}).
              Consider placing a supply order.
            </div>
          )}
        </div>

        <div className="ms-modal-footer">
          <button className="ms-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="ms-btn-save" onClick={handleSave} disabled={saving || !!success}>
            <Save size={14}/> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   VIEW DETAIL MODAL
══════════════════════════════════════════════════════════════════════════ */
const ViewModal = ({ product, onClose, onAdjust }) => {
  const rl     = product.reorder_level ?? 10;
  const status = stockStatus(product.stock, rl);

  return (
    <div className="ms-modal-overlay" onClick={onClose}>
      <div className="ms-modal ms-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="prod-view-header">
          <div className="prod-view-header-left">
            {product.image_url
              ? <img src={`${API}${product.image_url}`} alt={product.name}
                  className="prod-view-product-img"
                  onError={e => { e.target.style.display = 'none'; }} />
              : <div className="prod-view-product-placeholder"><PackageIcon size={24}/></div>
            }
            <div>
              <p className="prod-view-title">{product.name}</p>
              <p className="prod-view-sku">{product.barcode || 'No barcode'}</p>
            </div>
          </div>
          <button className="ms-modal-close" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={onClose}>
            <X size={20}/>
          </button>
        </div>

        <div className="ms-modal-body">
          <div className="prod-view-stats-row">
            <div className="prod-view-stat-card">
              <p className="prod-view-stat-value">{fmt(product.price)}</p>
              <p className="prod-view-stat-label">Sell Price</p>
            </div>
            <div className="prod-view-stat-card">
              <p className="prod-view-stat-value">{product.stock}</p>
              <p className="prod-view-stat-label">Stock</p>
            </div>
            <div className="prod-view-stat-card">
              <p className="prod-view-stat-value">{product.unit || 'pcs'}</p>
              <p className="prod-view-stat-label">Unit</p>
            </div>
            <div className="prod-view-stat-card">
              <p className="prod-view-stat-value">{fmt(product.price * product.stock)}</p>
              <p className="prod-view-stat-label">Stock Value</p>
            </div>
          </div>

          <div className="prod-view-detail-grid">
            <div className="prod-view-detail-card">
              <p className="prod-view-detail-label">Category</p>
              <p className="prod-view-detail-val">{product.category_name || '—'}</p>
            </div>
            <div className="prod-view-detail-card">
              <p className="prod-view-detail-label">Store</p>
              <p className="prod-view-detail-val">{product.store_name || '—'}</p>
            </div>
            <div className="prod-view-detail-card">
              <p className="prod-view-detail-label">Reorder Level</p>
              <p className="prod-view-detail-val">{rl} {product.unit || 'pcs'}</p>
            </div>
            <div className="prod-view-detail-card">
              <p className="prod-view-detail-label">Status</p>
              <p className="prod-view-detail-val">
                <span className={`prod-status-badge ${status}`}>
                  <span className="prod-status-dot"/>{stockLabel(product.stock, rl)}
                </span>
              </p>
            </div>
            <div className="prod-view-detail-card">
              <p className="prod-view-detail-label">Added</p>
              <p className="prod-view-detail-val">
                {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {product.description && (
              <div className="prod-view-detail-card" style={{ gridColumn: '1/-1' }}>
                <p className="prod-view-detail-label">Description</p>
                <p className="prod-view-detail-val">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="ms-modal-footer">
          <button className="ms-btn-cancel" onClick={onClose}>Close</button>
          <button className="ms-btn-save" onClick={() => { onClose(); onAdjust(product); }}>
            <Edit3 size={14}/> Adjust Stock
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN INVENTORY COMPONENT
   Fixes applied:
   ✔ Server-side pagination (page & limit sent to backend)
   ✔ Per-product reorder_level used for status (not hardcoded 15)
   ✔ Inventory value stat card (total_inventory_value from backend)
   ✔ Warn inside AdjustModal when new qty ≤ reorder_level
   ✔ Store filter only shows active stores
   ✔ adjustStock now wrapped in transaction on backend (inventory.controller)
   ✔ getInventory now paginated — client receives { data, total, page, limit }
══════════════════════════════════════════════════════════════════════════ */
const Inventory = () => {
  const navigate = useNavigate();
  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  /* data */
  const [inventory,  setInventory]  = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores,     setStores]     = useState([]);
  const [summary,    setSummary]    = useState({
    total_products: 0, in_stock: 0, low_stock: 0,
    out_of_stock: 0, total_inventory_value: 0,
  });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* filters — sent to server */
  const [search,       setSearch]       = useState('');
  const [filterCat,    setFilterCat]    = useState('');
  const [filterStore,  setFilterStore]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalCount,   setTotalCount]   = useState(0);

  /* modals */
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [viewProduct,   setViewProduct]   = useState(null);

  /* alert items — separate lightweight fetch (no pagination, just low/out) */
  const [alertItems, setAlertItems] = useState([]);

  /*  fetch paginated inventory from server  */
  const fetchInventory = useCallback(async (pg = 1, opts = {}) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: pg, limit: ITEMS_PER_PAGE });
      if (opts.search      || search)      params.set('search',      opts.search      ?? search);
      if (opts.filterCat   || filterCat)   params.set('category_id', opts.filterCat   ?? filterCat);
      if (opts.filterStore || filterStore) params.set('store_id',    opts.filterStore  ?? filterStore);
      if (opts.filterStatus || filterStatus) params.set('status',   opts.filterStatus ?? filterStatus);

      const res = await fetch(`${API}/api/inventory?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        // backend now returns { data, total, page, limit, total_pages }
        setInventory(json.data        || []);
        setTotalPages(json.total_pages || 1);
        setTotalCount(json.total       || 0);
      } else {
        setError('Failed to load inventory.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  }, [token, search, filterCat, filterStore, filterStatus]);

  /*  fetch summary + categories + stores + alert items  */
  const fetchSupporting = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [sumRes, catRes, storeRes, alertRes] = await Promise.all([
        fetch(`${API}/api/inventory/summary`,                   { headers }),
        fetch(`${API}/api/shopproducts/categories`,             { headers }),
        fetch(`${API}/api/inventory/stores`,                    { headers }),
        // fetch low+out stock items for alert panel (small, unpaginated)
        fetch(`${API}/api/inventory?status=Low Stock&limit=200`, { headers }),
      ]);
      if (sumRes.ok)   setSummary(await sumRes.json());
      if (catRes.ok)   setCategories(await catRes.json());
      if (storeRes.ok) setStores(await storeRes.json());
      if (alertRes.ok) {
        const j = await alertRes.json();
        // also grab Out of Stock
        const outRes = await fetch(`${API}/api/inventory?status=Out of Stock&limit=200`, { headers });
        const outJ   = outRes.ok ? await outRes.json() : { data: [] };
        setAlertItems([...(j.data || []), ...(outJ.data || [])]);
      }
    } catch { /* silent — summary cards just show 0 */ }
  }, [token]);

  const refreshAll = useCallback(() => {
    fetchInventory(page);
    fetchSupporting();
  }, [fetchInventory, fetchSupporting, page]);

  /* initial load */
  useEffect(() => {
    fetchInventory(1);
    fetchSupporting();
  }, [fetchInventory, fetchSupporting]);

  /* when filters change — reset to page 1 */
  useEffect(() => {
    setPage(1);
    fetchInventory(1);
  }, [search, filterCat, filterStore, filterStatus]); // eslint-disable-line

  /* when page changes */
  useEffect(() => {
    fetchInventory(page);
  }, [page]); // eslint-disable-line

  /* outside click close dropdowns */
  useEffect(() => {
    const h = (e) => {
      if (menuDropdownRef.current    && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl = user.shop_logo ? `${API}${user.shop_logo}` : null;
  const renderShopLogo = () => {
    if (shopLogoUrl)
      return <img src={shopLogoUrl} alt={user.shop_name || 'Shop'}
        className="shop-sidebar-logo-img"
        onError={e => { e.target.style.display = 'none'; }} />;
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url)
      return <img src={`${API}${user.image_url}`} alt="Profile"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    return (
      <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>
        {initials}
      </span>
    );
  };

  const catColorClass = (catId) => {
    const idx = categories.findIndex(c => c.category_id === catId);
    return idx >= 0 ? CATEGORY_COLORS[idx % CATEGORY_COLORS.length] : 'prod-cat-0';
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem   = Math.min(page * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="shop-admin-container">

      {/* ══ SIDEBAR ══ */}
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
          <button className="mp-nav-item" onClick={() => navigate('/categories')}>
            <Tags size={18}/><span>Categories</span>
          </button>
          <button className="mp-nav-item active">
            <Boxes size={18}/><span>Inventory</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/salesrecords')}>
            <TrendingUp size={18}/><span>Sales Records</span>
          </button>
          <button className="mp-nav-item" onClick={() => navigate('/reportsandanalytics')}>
            <FileBarChart size={18}/><span>Reports & Analytics</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18}/><span>Subscription</span>
          </button>
          <div className="nav-divider"/>
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18}/><span>My Profile</span>
          </button>
          <button className="shop-nav-item logout-item" onClick={handleLogOut}>
            <LogOut size={18}/><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ══ MAIN ══ */}
      <main className="shop-admin-main">

        {/* ══ HEADER ══ */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Inventory</div>
          <div className="shop-header-actions">

            {/* Store filter dropdown */}
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                {filterStore
                  ? stores.find(s => String(s.store_id) === filterStore)?.name || 'Store'
                  : 'All Stores'
                } <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">Filter by Store</h4>
                    <button className="shop-menu-item"
                      onClick={() => { setFilterStore(''); setShowMenuDropdown(false); }}>
                      <Store size={16}/><span>All Stores</span>
                    </button>
                    {stores.map(s => (
                      <button key={s.store_id} className="shop-menu-item"
                        onClick={() => {
                          setFilterStore(String(s.store_id));
                          setShowMenuDropdown(false);
                        }}>
                        <Store size={16}/><span>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="inv-refresh-btn" onClick={refreshAll} title="Refresh">
              <RefreshCw size={15}/>
            </button>
            <div className="shop-icon-circle moon"><Moon size={16}/></div>
            <div className="shop-icon-circle bell"><Bell size={16}/></div>

            {/* Profile dropdown */}
            <div className="shop-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="shop-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="shop-profile-dropdown">
                  <div className="shop-profile-dropdown-header">
                    <div className="shop-profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
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
                    <button className="shop-profile-action-btn shop-logout-btn"
                      onClick={handleLogOut}>
                      <LogOut size={18}/><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ══ CONTENT ══ */}
        <div className="shop-dashboard-content">

          {/* Page title */}
          <div className="prod-page-header">
            <div>
              <h1 className="prod-title">Inventory Management</h1>
              <p className="prod-subtitle">
                Track stock levels and manage inventory across all stores
              </p>
            </div>
          </div>

          {/*  STAT CARDS — now 5 cards including inventory value  */}
          <div className="prod-stat-cards inv-stat-cards-5">

            <div className="prod-stat-card inv-card-clickable"
              onClick={() => { setFilterStatus(''); setPage(1); }}>
              <div className="prod-stat-icon-wrap total"><Layers size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Total Products</p>
                <p className="prod-stat-value">{summary.total_products?.toLocaleString() ?? 0}</p>
              </div>
            </div>

            <div className="prod-stat-card inv-card-clickable"
              onClick={() => { setFilterStatus('In Stock'); setPage(1); }}>
              <div className="prod-stat-icon-wrap instock"><CheckCircle size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">In Stock</p>
                <p className="prod-stat-value">{summary.in_stock?.toLocaleString() ?? 0}</p>
              </div>
            </div>

            <div className="prod-stat-card inv-card-clickable"
              onClick={() => { setFilterStatus('Low Stock'); setPage(1); }}>
              <div className="prod-stat-icon-wrap low"><TrendingDown size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Low Stock</p>
                <p className="prod-stat-value">{summary.low_stock?.toLocaleString() ?? 0}</p>
              </div>
            </div>

            <div className="prod-stat-card inv-card-clickable"
              onClick={() => { setFilterStatus('Out of Stock'); setPage(1); }}>
              <div className="prod-stat-icon-wrap out"><MinusCircle size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Out of Stock</p>
                <p className="prod-stat-value">{summary.out_of_stock?.toLocaleString() ?? 0}</p>
              </div>
            </div>

            {/*  NEW: total inventory value card  */}
            <div className="prod-stat-card">
              <div className="prod-stat-icon-wrap inv-value"><DollarSign size={20}/></div>
              <div className="prod-stat-info">
                <p className="prod-stat-label">Inventory Value</p>
                <p className="prod-stat-value inv-value-val">
                  {fmt(summary.total_inventory_value)}
                </p>
              </div>
            </div>

          </div>

          {/*  LOW STOCK ALERT PANEL  */}
          {alertItems.length > 0 && (
            <div className="inv-alert-panel">
              <div className="inv-alert-panel-header">
                <div className="inv-alert-title-wrap">
                  <AlertCircle size={17} className="inv-alert-icon"/>
                  <span className="inv-alert-title">
                    Low / Out of Stock Alerts ({alertItems.length})
                  </span>
                </div>
                <button className="inv-view-all-btn"
                  onClick={() => { setFilterStatus('Low Stock'); setPage(1); }}>
                  View All →
                </button>
              </div>
              <div className="prod-table-wrap">
                <table className="prod-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Store</th>
                      <th>Current</th>
                      <th>Reorder At</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertItems.slice(0, 8).map(p => {
                      const rl = p.reorder_level ?? 10;
                      const st = stockStatus(p.stock, rl);
                      return (
                        <tr key={p.product_id}
                          className={st === 'out' ? 'inv-row-out' : 'inv-row-low'}>
                          <td>
                            <div className="prod-thumb-cell">
                              {p.image_url
                                ? <img src={`${API}${p.image_url}`} alt={p.name}
                                    className="prod-thumb"
                                    onError={e => { e.target.style.display = 'none'; }} />
                                : <div className="prod-thumb-placeholder"><PackageIcon size={16}/></div>
                              }
                              <span className="prod-name">{p.name}</span>
                            </div>
                          </td>
                          <td><span className="prod-sku">{p.barcode || '—'}</span></td>
                          <td style={{ fontSize: '0.875rem', color: '#374151' }}>
                            {p.store_name || '—'}
                          </td>
                          <td>
                            <span className={`prod-stock-num ${st}`}>{p.stock}</span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                            {rl} {p.unit || 'pcs'}
                          </td>
                          <td>
                            <span className={`prod-status-badge ${st}`}>
                              <span className="prod-status-dot"/>
                              {stockLabel(p.stock, rl)}
                            </span>
                          </td>
                          <td>
                            <button className="inv-reorder-btn"
                              onClick={() => setAdjustProduct(p)}>
                              Reorder
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/*  FILTER BAR  */}
          <div className="prod-filter-bar">
            <div className="prod-search-wrap">
              <Search size={15} className="prod-search-icon"/>
              <input className="prod-search-input" placeholder="Search by name or barcode…"
                value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>

            <select className="prod-select" value={filterCat}
              onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>

            <select className="prod-select" value={filterStore}
              onChange={e => setFilterStore(e.target.value)}>
              <option value="">All Stores</option>
              {stores.map(s => (
                <option key={s.store_id} value={s.store_id}>{s.name}</option>
              ))}
            </select>

            <select className="prod-select" value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Stock</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {(search || filterCat || filterStore || filterStatus) && (
              <button className="inv-clear-btn"
                onClick={() => {
                  setSearch(''); setFilterCat('');
                  setFilterStore(''); setFilterStatus('');
                }}>
                <X size={13}/> Clear
              </button>
            )}
          </div>

          {/*  FULL INVENTORY TABLE  */}
          <div className="prod-table-card">
            {loading ? (
              <div className="prod-loading">Loading inventory…</div>
            ) : error ? (
              <div className="prod-empty">
                <div className="prod-empty-icon"><AlertCircle size={24}/></div>
                <h3>Error</h3><p>{error}</p>
              </div>
            ) : inventory.length === 0 ? (
              <div className="prod-empty">
                <div className="prod-empty-icon"><Boxes size={24}/></div>
                <h3>No products found</h3>
                <p>
                  {search || filterCat || filterStore || filterStatus
                    ? 'Try adjusting your filters.'
                    : 'Add products from the Products page to see them here.'}
                </p>
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
                        <th>Store</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Reorder At</th>
                        <th>Unit</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(p => {
                        const rl = p.reorder_level ?? 10;
                        const st = stockStatus(p.stock, rl);
                        return (
                          <tr key={p.product_id}
                            className={
                              st === 'out' ? 'inv-row-out' :
                              st === 'low' ? 'inv-row-low' : ''
                            }>
                            <td>
                              <div className="prod-thumb-cell">
                                {p.image_url
                                  ? <img src={`${API}${p.image_url}`} alt={p.name}
                                      className="prod-thumb"
                                      onError={e => { e.target.style.display = 'none'; }} />
                                  : <div className="prod-thumb-placeholder">
                                      <PackageIcon size={16}/>
                                    </div>
                                }
                                <span className="prod-name">{p.name}</span>
                              </div>
                            </td>
                            <td><span className="prod-sku">{p.barcode || '—'}</span></td>
                            <td>
                              {p.category_name
                                ? <span className={`prod-cat-badge ${catColorClass(p.category_id)}`}>
                                    {p.category_name}
                                  </span>
                                : <span style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>—</span>
                              }
                            </td>
                            <td style={{ fontSize: '0.875rem', color: '#374151' }}>
                              {p.store_name || '—'}
                            </td>
                            <td>
                              <span className="prod-price">{fmt(p.price)}</span>
                            </td>
                            <td>
                              <span className={`prod-stock-num ${st}`}>{p.stock}</span>
                            </td>
                            <td style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                              {rl} {p.unit || 'pcs'}
                            </td>
                            <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {p.unit || '—'}
                            </td>
                            <td>
                              <span className={`prod-status-badge ${st}`}>
                                <span className="prod-status-dot"/>
                                {stockLabel(p.stock, rl)}
                              </span>
                            </td>
                            <td>
                              <div className="prod-action-btns">
                                <button className="prod-tbl-btn-edit"
                                  onClick={() => setAdjustProduct(p)}
                                  title="Adjust Stock">
                                  Adjust
                                </button>
                                <button className="prod-tbl-btn-view"
                                  onClick={() => setViewProduct(p)}
                                  title="View Details">
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/*  SERVER-SIDE PAGINATION  */}
                <div className="prod-table-footer">
                  <span className="prod-pagination-info">
                    {totalCount > 0
                      ? `Showing ${startItem}–${endItem} of ${totalCount} products`
                      : 'No products'}
                  </span>
                  <div className="prod-pagination-btns">
                    <button className="prod-page-btn" disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft size={14}/> Previous
                    </button>
                    <span className="inv-page-indicator">
                      Page {page} of {totalPages}
                    </span>
                    <button className="prod-page-btn" disabled={page === totalPages}
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

      {/* ADJUST MODAL */}
      {adjustProduct && (
        <AdjustModal
          product={adjustProduct}
          token={token}
          onClose={() => setAdjustProduct(null)}
          onSaved={refreshAll}
        />
      )}

      {/* VIEW MODAL */}
      {viewProduct && (
        <ViewModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onAdjust={(p) => { setViewProduct(null); setAdjustProduct(p); }}
        />
      )}
    </div>
  );
};

export default Inventory;