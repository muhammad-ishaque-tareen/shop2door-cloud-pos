import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Store,
  Package,
  DollarSign,
  LogOut,
  User,
  Bell,
  Moon,
  Search,
  Eye,
  RefreshCw,
  Grid,
  List,
  X,
  MapPin,
  Phone,
  Calendar,
  Users2,
  ShoppingBag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/ManageShops.css';
import { API_BASE_URL } from '../config';

const ManageShops = () => {
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shops,               setShops]               = useState([]);
  const [filteredShops,       setFilteredShops]       = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [searchQuery,         setSearchQuery]         = useState('');
  const [packageFilter,       setPackageFilter]       = useState('All');
  // Default to list view (like Categories default is grid — here we default to list)
  const [viewMode,            setViewMode]            = useState('list'); // 'list' | 'card'

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewShop,      setViewShop]      = useState(null);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuDropdownRef.current    && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { fetchShops(); }, []);
  useEffect(() => { filterShops(); }, [shops, searchQuery, packageFilter]);

  // Fetch — backend already returns only active subscriptions; we additionally
  // enforce status === 'active' on the frontend to guard against edge cases.
  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/manage-shops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Keep only shops that have an active subscription
        setShops(data.filter(s => s.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search + active package only
  const filterShops = () => {
    let filtered = [...shops]; // already active-only from fetchShops

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.package?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q)
      );
    }

    if (packageFilter !== 'All') {
      filtered = filtered.filter(s =>
        s.package?.toLowerCase() === packageFilter.toLowerCase()
      );
    }

    setFilteredShops(filtered);
  };

  // Derive unique active package names for the filter dropdown
  const activePackages = [...new Set(shops.map(s => s.package).filter(Boolean))].sort();

  const openViewModal  = (shop) => { setViewShop(shop); setShowViewModal(true); };
  const closeViewModal = ()     => { setShowViewModal(false); setViewShop(null); };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  // Profile image helper
  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'SA';
    if (user.image_url) {
      return (
        <img
          src={`${API_BASE_URL}${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'ms-avatar-initials' : 'ms-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  // Shared shop logo renderer
  const renderShopLogo = (shop) =>
    shop.logo_url ? (
      <img
        src={`${API_BASE_URL}${shop.logo_url}`}
        alt={shop.name}
        className="ms-shop-logo-img"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    ) : (
      <Store size={22} color="#9333ea" />
    );

  return (
    <div className="ms-admin-container">
      {/* ── SIDEBAR ── */}
      <aside className="ms-admin-sidebar">
        <div className="ms-brand-header">
          <span className="ms-brand-title">SHOP2DOOR</span>
        </div>

        <nav className="ms-sidebar-nav">
          <button className="ms-nav-item" onClick={() => navigate('/systemadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>

          <div className="ms-nav-divider" />

          <button className="ms-nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} /><span>Shop Requests</span>
          </button>
          <button className="ms-nav-item active">
            <Store size={18} /><span>Manage Shops</span>
          </button>

          <div className="ms-nav-divider" />

          <button className="ms-nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} /><span>Manage Packages</span>
          </button>
          <button className="ms-nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} /><span>Subscriptions</span>
          </button>

          <div className="ms-nav-divider" />

          <button className="ms-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="ms-nav-item ms-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="ms-admin-main">
        {/* Top header */}
        <header className="ms-main-header">
          <div className="ms-breadcrumb">Admin &gt; Manage Shops</div>

          <div className="ms-header-actions">
            {/* Menu dropdown */}
            <div className="ms-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="ms-btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                Menu <span className="ms-dropdown-arrow">▼</span>
              </button>

              {showMenuDropdown && (
                <div className="ms-menu-dropdown">
                  <div className="ms-menu-section">
                    <h4 className="ms-menu-section-title">Quick Actions</h4>
                    <button className="ms-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemadmindashboard'); }}>
                      <LayoutDashboard size={18} /><span>Dashboard</span>
                    </button>
                    <button className="ms-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shoprequests'); }}>
                      <FileText size={18} /><span>Shop Requests</span>
                    </button>
                    <button className="ms-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/manageshops'); }}>
                      <Store size={18} /><span>Manage Shops</span>
                    </button>
                  </div>
                  <div className="ms-menu-divider" />
                  <div className="ms-menu-section">
                    <button className="ms-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/packages'); }}>
                      <Package size={18} /><span>Packages</span>
                    </button>
                    <button className="ms-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/subscriptions'); }}>
                      <DollarSign size={18} /><span>Subscriptions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="ms-icon-circle moon"><Moon size={16} /></div>
            <div className="ms-icon-circle bell"><Bell size={16} /></div>

            {/* Profile dropdown */}
            <div className="ms-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="ms-profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="ms-profile-dropdown">
                  <div className="ms-profile-dropdown-header">
                    <div className="ms-profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
                    <div className="ms-profile-dropdown-info">
                      <h4 className="ms-profile-name">{user.name || 'Admin'}</h4>
                      <p className="ms-profile-role">{user.role || 'System Admin'}</p>
                    </div>
                  </div>
                  <div className="ms-profile-divider" />
                  <div className="ms-profile-details">
                    <div className="ms-profile-detail-item">
                      <span className="ms-detail-icon">📧</span>
                      <span className="ms-detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="ms-profile-detail-item">
                      <span className="ms-detail-icon">📱</span>
                      <span className="ms-detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="ms-profile-divider" />
                  <div className="ms-profile-actions">
                    <button className="ms-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemadminprofile'); }}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="ms-profile-action-btn ms-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div className="ms-page-content">

          {/* Page title row */}
          <div className="ms-page-header">
            <div>
              <h1 className="ms-page-title">Manage Shops</h1>
              <p className="ms-page-subtitle">Active shops with valid subscriptions</p>
            </div>
            <span className="ms-shop-count">
              {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* ── Filter bar (mirrors Categories style) ── */}
          <div className="ms-filter-bar">
            {/* Search */}
            <div className="ms-search-input-wrapper">
              <Search className="ms-search-icon" size={18} />
              <input
                type="text"
                className="ms-search-input"
                placeholder="Search by name, package, address, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Package filter — only active packages appear */}
            <select
              className="ms-filter-select"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
            >
              <option value="All">All Packages</option>
              {activePackages.map(pkg => (
                <option key={pkg} value={pkg}>{pkg}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="ms-view-toggle">
              <button
                className={`ms-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={16} />
              </button>
              <button
                className={`ms-toggle-btn${viewMode === 'card' ? ' active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Card view"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>

          {/* ── Content area ── */}
          {loading ? (
            <div className="ms-loading-state">
              <RefreshCw size={20} className="ms-spin" />
              <span>Loading shops...</span>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="ms-empty-state">
              <div className="ms-empty-icon"><Store size={32} /></div>
              <h3 className="ms-empty-title">No active shops found</h3>
              <p className="ms-empty-text">Try adjusting your search or package filter</p>
            </div>
          ) : viewMode === 'list' ? (

            /*  LIST VIEW  */
            <div className="ms-list-card">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Shop</th>
                    <th>Code</th>
                    <th>Package</th>
                    <th>Stores</th>
                    <th>Users</th>
                    <th>Products</th>
                    <th>Sub. Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.map((shop, i) => (
                    <tr key={shop.shop_id}>
                      <td className="ms-tbl-num">{i + 1}</td>
                      <td>
                        <div className="ms-tbl-shop-cell">
                          <div className="ms-tbl-logo-wrap">
                            {renderShopLogo(shop)}
                          </div>
                          <div>
                            <div className="ms-tbl-shop-name">{shop.name}</div>
                            <div className="ms-tbl-shop-addr">{shop.address || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ms-tbl-code">{shop.code}</span>
                      </td>
                      <td>
                        <span className="ms-tbl-package-badge">{shop.package || '—'}</span>
                      </td>
                      <td className="ms-tbl-num">{shop.stores_used ?? 0}</td>
                      <td className="ms-tbl-num">{shop.users_used ?? 0}</td>
                      <td className="ms-tbl-num">{shop.products_used ?? 0}</td>
                      <td className="ms-tbl-date">
                        {shop.end_date
                          ? new Date(shop.end_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td>
                        <button
                          className="ms-tbl-btn-view"
                          onClick={() => openViewModal(shop)}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ms-list-footer">
                <span className="ms-list-info">
                  Showing {filteredShops.length} of {shops.length} active shop{shops.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

          ) : (

            /*  CARD VIEW  */
            <div className="ms-shops-grid">
              {filteredShops.map((shop) => (
                <div key={shop.shop_id} className="ms-shop-card">
                  <div className="ms-shop-card-header">
                    <div className="ms-shop-logo-wrap">
                      {renderShopLogo(shop)}
                    </div>

                    <div className="ms-shop-info">
                      <h3 className="ms-shop-name">{shop.name}</h3>
                      <p className="ms-shop-meta">
                        {shop.address || 'No address'} &bull; {shop.package || '—'}
                      </p>
                    </div>

                    {/* Always active — no inactive shops shown */}
                    <span className="ms-status-badge active">Active</span>
                  </div>

                  {/* Stats */}
                  <div className="ms-shop-stats">
                    <div className="ms-stat-item">
                      <div className="ms-stat-value">{shop.stores_used ?? 0}</div>
                      <div className="ms-stat-label">Stores</div>
                    </div>
                    <div className="ms-stat-item">
                      <div className="ms-stat-value">{shop.users_used ?? 0}</div>
                      <div className="ms-stat-label">Users</div>
                    </div>
                    <div className="ms-stat-item">
                      <div className="ms-stat-value">{shop.products_used ?? 0}</div>
                      <div className="ms-stat-label">Products</div>
                    </div>
                    <div className="ms-stat-item">
                      <div className="ms-stat-value ms-code">{shop.code}</div>
                      <div className="ms-stat-label">Code</div>
                    </div>
                  </div>

                  {/* View only — no Edit */}
                  <div className="ms-shop-actions">
                    <button
                      className="ms-action-btn ms-action-btn-view"
                      onClick={() => openViewModal(shop)}
                    >
                      <Eye size={15} /><span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── VIEW SHOP MODAL ── */}
      {showViewModal && viewShop && (
        <div className="ms-modal-overlay" onClick={closeViewModal}>
          <div className="ms-modal ms-modal-wide" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="ms-modal-header ms-view-header">
              <div className="ms-view-header-left">
                <div className="ms-view-icon">
                  {viewShop.logo_url ? (
                    <img
                      src={`${API_BASE_URL}${viewShop.logo_url}`}
                      alt={viewShop.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <Store size={24} />
                  )}
                </div>
                <div>
                  <h2 className="ms-modal-title">{viewShop.name}</h2>
                  <span className="ms-status-badge active">Active</span>
                </div>
              </div>
              <button className="ms-modal-close" onClick={closeViewModal}><X size={20} /></button>
            </div>

            {/* Body */}
            <div className="ms-modal-body">
              <div className="ms-view-grid">
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><MapPin size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Address</p>
                    <p className="ms-view-info-value">{viewShop.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><Store size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Shop Code</p>
                    <p className="ms-view-info-value ms-view-code">{viewShop.code || '—'}</p>
                  </div>
                </div>
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><Package size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Package</p>
                    <p className="ms-view-info-value">{viewShop.package || '—'}</p>
                  </div>
                </div>
                <div className="ms-view-info-card">
                  <div className="ms-view-info-icon"><Calendar size={16} /></div>
                  <div>
                    <p className="ms-view-info-label">Subscription Expires</p>
                    <p className="ms-view-info-value">
                      {viewShop.end_date ? new Date(viewShop.end_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="ms-view-stats">
                <div className="ms-view-stat-card">
                  <Store size={20} className="ms-view-stat-icon" />
                  <p className="ms-view-stat-value">{viewShop.stores_used ?? 0}</p>
                  <p className="ms-view-stat-label">Stores</p>
                </div>
                <div className="ms-view-stat-card">
                  <Users2 size={20} className="ms-view-stat-icon" />
                  <p className="ms-view-stat-value">{viewShop.users_used ?? 0}</p>
                  <p className="ms-view-stat-label">Users</p>
                </div>
                <div className="ms-view-stat-card">
                  <ShoppingBag size={20} className="ms-view-stat-icon" />
                  <p className="ms-view-stat-value">{viewShop.products_used ?? 0}</p>
                  <p className="ms-view-stat-label">Products</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="ms-modal-footer">
              <button className="ms-btn-cancel" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageShops;