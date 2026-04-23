import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, FileText, Store, Package,
  DollarSign, Settings, LogOut, User, Bell,
  Moon, Plus, Check, Edit2, Trash2, X, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/Packages.css';

/* ─── tiny helpers ──────────────────────────────────────────────────────── */
const BASE = 'http://localhost:5000';

const emptyForm = {
  name: '', description: '', price: '',
  max_stores: '', max_users_per_store: '',
  max_products: '', max_storage_mb: '',
};

/* ══════════════════════════════════════════════════════════════════════════ */
const Packages = () => {
  const [packages, setPackages]             = useState([]);
  const [loading, setLoading]               = useState(true);

  // add-package modal
  const [showAddModal, setShowAddModal]     = useState(false);
  const [addForm, setAddForm]               = useState(emptyForm);
  const [addSaving, setAddSaving]           = useState(false);

  // edit-package modal
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [editSaving, setEditSaving]         = useState(false);

  const [showMenuDropdown, setShowMenuDropdown]       = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const menuRef    = useRef(null);
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  /* ── outside click ──────────────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current    && !menuRef.current.contains(e.target))    setShowMenuDropdown(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── fetch packages ─────────────────────────────────────────────────── */
  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${BASE}/api/packages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      console.error('fetchPackages error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── ADD package ────────────────────────────────────────────────────── */
  const handleAddSubmit = async () => {
    if (!addForm.name || !addForm.price) return;
    try {
      setAddSaving(true);
      const res = await fetch(`${BASE}/api/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setAddForm(emptyForm);
        fetchPackages();
      }
    } catch (err) {
      console.error('addPackage error:', err);
    } finally {
      setAddSaving(false);
    }
  };

  /* ── EDIT package (modal) ───────────────────────────────────────────── */
  const startEdit = (pkg) => {
    setEditingId(pkg.package_id);
    setEditForm({
      name:                pkg.name,
      description:         pkg.description || '',
      price:               pkg.price,
      max_stores:          pkg.max_stores,
      max_users_per_store: pkg.max_users_per_store,
      max_products:        pkg.max_products,
      max_storage_mb:      pkg.max_storage_mb,
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => { setShowEditModal(false); setEditingId(null); setEditForm({}); };

  const handleEditSave = async (packageId) => {
    try {
      setEditSaving(true);
      const res = await fetch(`${BASE}/api/packages/${packageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        cancelEdit();
        fetchPackages();
      }
    } catch (err) {
      console.error('editPackage error:', err);
    } finally {
      setEditSaving(false);
    }
  };

  /* ── DELETE package ─────────────────────────────────────────────────── */
  const handleDelete = async (packageId) => {
    if (!window.confirm('Delete this package? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BASE}/api/packages/${packageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPackages();
      else {
        const err = await res.json();
        alert(err.message || 'Could not delete package.');
      }
    } catch (err) {
      console.error('deletePackage error:', err);
    }
  };

  /* ── logout ─────────────────────────────────────────────────────────── */
  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  /* ── profile image ──────────────────────────────────────────────────── */
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'SA';
    if (user.image_url) {
      return (
        <img
          src={`${BASE}${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'pk-avatar-initials' : 'pk-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  /* ── feature list from a package row ───────────────────────────────── */
  const featureList = (pkg) => [
    `Up to ${pkg.max_stores} store${pkg.max_stores !== 1 ? 's' : ''}`,
    `${pkg.max_users_per_store} user${pkg.max_users_per_store !== 1 ? 's' : ''} per store`,
    `${pkg.max_products?.toLocaleString()} products`,
    `${pkg.max_storage_mb} MB storage`,
  ];

  /* ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="pk-admin-container">

      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside className="pk-admin-sidebar">
        <div className="pk-brand-header">
          <span className="pk-brand-title">SHOP2DOOR</span>
        </div>
        <nav className="pk-sidebar-nav">
          <button className="pk-nav-item" onClick={() => navigate('/systemadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <div className="pk-nav-divider" />
          <button className="pk-nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} /><span>Shop Requests</span>
          </button>
          <button className="pk-nav-item" onClick={() => navigate('/manageshops')}>
            <Store size={18} /><span>Manage Shops</span>
          </button>
          <div className="pk-nav-divider" />
          <button className="pk-nav-item active">
            <Package size={18} /><span>Packages</span>
          </button>
          <button className="pk-nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} /><span>Subscriptions</span>
          </button>
          <div className="pk-nav-divider" />
          <button className="pk-nav-item" onClick={() => navigate('/settings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button className="pk-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="pk-nav-item pk-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main className="pk-admin-main">

        {/* Header */}
        <header className="pk-main-header">
          <div className="pk-breadcrumb">Admin &gt; Packages</div>
          <div className="pk-header-actions">

            {/* Menu dropdown */}
            <div className="pk-menu-dropdown-container" ref={menuRef}>
              <button className="pk-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                Menu <span className="pk-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="pk-menu-dropdown">
                  <div className="pk-menu-section">
                    <h4 className="pk-menu-section-title">Quick Actions</h4>
                    {[
                      { label: 'Dashboard',    icon: <LayoutDashboard size={18} />, path: '/systemadmindashboard' },
                      { label: 'Shop Requests',icon: <FileText size={18} />,        path: '/shoprequests' },
                      { label: 'Manage Shops', icon: <Store size={18} />,           path: '/manageshops' },
                      { label: 'Packages',     icon: <Package size={18} />,         path: '/packages' },
                      { label: 'Subscriptions',icon: <DollarSign size={18} />,      path: '/subscriptions' },
                      { label: 'Settings',     icon: <Settings size={18} />,        path: '/settings' },
                    ].map(({ label, icon, path }) => (
                      <button key={label} className="pk-menu-item"
                        onClick={() => { setShowMenuDropdown(false); navigate(path); }}>
                        {icon}<span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pk-icon-circle moon"><Moon size={16} /></div>
            <div className="pk-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="pk-profile-dropdown-container" ref={profileRef}>
              <button className="pk-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>
              {showProfileDropdown && (
                <div className="pk-profile-dropdown">
                  <div className="pk-profile-dropdown-header">
                    <div className="pk-profile-dropdown-avatar">{renderProfileImage('dropdown')}</div>
                    <div className="pk-profile-dropdown-info">
                      <h4 className="pk-profile-name">{user.name || 'Admin'}</h4>
                      <p className="pk-profile-role">{user.role || 'System Admin'}</p>
                    </div>
                  </div>
                  <div className="pk-profile-divider" />
                  <div className="pk-profile-details">
                    <div className="pk-profile-detail-item">
                      <span className="pk-detail-icon">📧</span>
                      <span className="pk-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="pk-profile-detail-item">
                      <span className="pk-detail-icon">📱</span>
                      <span className="pk-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="pk-profile-divider" />
                  <div className="pk-profile-actions">
                    <button className="pk-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemadminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="pk-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }}>
                      <Settings size={18} /><span>Settings</span>
                    </button>
                    <button className="pk-profile-action-btn pk-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ──────────────────────────────────────────── */}
        <div className="pk-page-content">

          {/* Page header */}
          <div className="pk-page-header">
            <div>
              <h1 className="pk-page-title">Manage Packages</h1>
              <p className="pk-page-subtitle">View, add, edit and delete subscription packages</p>
            </div>
            <button className="pk-add-btn" onClick={() => { setShowAddModal(true); setAddForm(emptyForm); }}>
              <Plus size={18} /><span>Add Package</span>
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="pk-loading-state">
              <RefreshCw size={20} className="pk-spin" />
              <span>Loading packages…</span>
            </div>
          ) : packages.length === 0 ? (
            <div className="pk-empty-state">
              <div className="pk-empty-icon"><Package size={32} /></div>
              <h3 className="pk-empty-title">No packages yet</h3>
              <p className="pk-empty-text">Click "Add Package" to create the first one.</p>
            </div>
          ) : (
            /* 3 per row, 4th goes to next row */
            <div className="pk-packages-grid">
              {packages.map((pkg) => {
                const isEditing = editingId === pkg.package_id;

                return (
                  <div key={pkg.package_id} className="pk-package-card">
                    <div className="pk-card-header">
                      <h3 className="pk-card-name">{pkg.name}</h3>
                      {pkg.description && <p className="pk-card-desc">{pkg.description}</p>}
                    </div>

                    <div className="pk-price-row">
                      <span className="pk-price-currency">RS</span>
                      <span className="pk-price-amount">{Number(pkg.price).toLocaleString()}</span>
                      <span className="pk-price-interval">/mo</span>
                    </div>

                    <div className="pk-card-divider" />

                    <ul className="pk-feature-list">
                      {featureList(pkg).map((f, i) => (
                        <li key={i} className="pk-feature-item">
                          <Check size={15} className="pk-check-icon" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {pkg.shop_count > 0 && (
                      <p className="pk-shop-count-tag">{pkg.shop_count} shop{pkg.shop_count !== 1 ? 's' : ''} using this</p>
                    )}

                    <div className="pk-card-actions">
                      <button className="pk-btn-edit" onClick={() => startEdit(pkg)}>
                        <Edit2 size={14} /><span>Edit</span>
                      </button>
                      <button className="pk-btn-delete" onClick={() => handleDelete(pkg.package_id)}>
                        <Trash2 size={14} /><span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── ADD PACKAGE MODAL ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="pk-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="pk-modal">
            <div className="pk-modal-header">
              <h2 className="pk-modal-title">New Package</h2>
              <button className="pk-modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pk-modal-body">
              {[
                { label: 'Package Name *',    key: 'name',                type: 'text',   ph: 'e.g. Enterprise', min: null },
                { label: 'Description',       key: 'description',         type: 'text',   ph: 'Short tagline',   min: null },
                { label: 'Price (RS/month) *',key: 'price',               type: 'number', ph: '0',               min: 0    },
                { label: 'Max Stores',        key: 'max_stores',          type: 'number', ph: '0',               min: 0    },
                { label: 'Users per Store',   key: 'max_users_per_store', type: 'number', ph: '0',               min: 0    },
                { label: 'Max Products',      key: 'max_products',        type: 'number', ph: '0',               min: 0    },
                { label: 'Storage (MB)',      key: 'max_storage_mb',      type: 'number', ph: '0',               min: 0    },
              ].map(({ label, key, type, ph, min }) => (
                <label key={key} className="pk-field-label">
                  <span>{label}</span>
                  <input
                    type={type}
                    className="pk-field-input"
                    placeholder={ph}
                    value={addForm[key]}
                    min={min !== null ? min : undefined}
                    onChange={(e) => setAddForm({ ...addForm, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>

            <div className="pk-modal-footer">
              <button className="pk-modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="pk-modal-submit" onClick={handleAddSubmit} disabled={addSaving}>
                {addSaving ? 'Adding…' : 'Add Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PACKAGE MODAL ────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="pk-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}>
          <div className="pk-modal">
            <div className="pk-modal-header">
              <h2 className="pk-modal-title">Edit Package</h2>
              <button className="pk-modal-close" onClick={cancelEdit}>
                <X size={20} />
              </button>
            </div>

            <div className="pk-modal-body">
              {[
                { label: 'Package Name *',    key: 'name',                type: 'text',   ph: 'e.g. Enterprise', min: null },
                { label: 'Description',       key: 'description',         type: 'text',   ph: 'Short tagline',   min: null },
                { label: 'Price (RS/month) *',key: 'price',               type: 'number', ph: '0',               min: 0    },
                { label: 'Max Stores',        key: 'max_stores',          type: 'number', ph: '0',               min: 0    },
                { label: 'Users per Store',   key: 'max_users_per_store', type: 'number', ph: '0',               min: 0    },
                { label: 'Max Products',      key: 'max_products',        type: 'number', ph: '0',               min: 0    },
                { label: 'Storage (MB)',      key: 'max_storage_mb',      type: 'number', ph: '0',               min: 0    },
              ].map(({ label, key, type, ph, min }) => (
                <label key={key} className="pk-field-label">
                  <span>{label}</span>
                  <input
                    type={type}
                    className="pk-field-input"
                    placeholder={ph}
                    value={editForm[key]}
                    min={min !== null ? min : undefined}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>

            <div className="pk-modal-footer">
              <button className="pk-modal-cancel" onClick={cancelEdit}>Cancel</button>
              <button className="pk-modal-submit" onClick={() => handleEditSave(editingId)} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Packages;