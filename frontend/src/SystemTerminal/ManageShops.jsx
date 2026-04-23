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
  Search,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/ManageShops.css';

const ManageShops = () => {
  const [showMenuDropdown, setShowMenuDropdown]       = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shops, setShops]                             = useState([]);
  const [filteredShops, setFilteredShops]             = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [searchQuery, setSearchQuery]                 = useState('');
  const [statusFilter, setStatusFilter]               = useState('All');
  const [packageFilter, setPackageFilter]             = useState('All');

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  // ── Close dropdowns on outside click ─────────────────────────────────────
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

  useEffect(() => { fetchShops(); }, []);

  useEffect(() => { filterShops(); }, [shops, searchQuery, statusFilter, packageFilter]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/manage-shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShops(data);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filterShops = () => {
    let filtered = [...shops];

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.package?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (packageFilter !== 'All') {
      filtered = filtered.filter(s =>
        s.package?.toLowerCase() === packageFilter.toLowerCase()
      );
    }

    setFilteredShops(filtered);
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  // ── Profile image ─────────────────────────────────────────────────────────
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
    const cls = size === 'dropdown' ? 'ms-avatar-initials' : 'ms-profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  return (
    <div className="ms-admin-container">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
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

          <button className="ms-nav-item" onClick={() => navigate('/systemsettings')}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button className="ms-nav-item" onClick={() => navigate('/systemadminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="ms-nav-item ms-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="ms-admin-main">
        {/* Header */}
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
                    <button className="ms-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/settings'); }}>
                      <Settings size={18} /><span>Settings</span>
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
                    <button className="ms-profile-action-btn" onClick={() => { setShowProfileDropdown(false); navigate('/systemsettings'); }}>
                      <Settings size={18} /><span>Settings</span>
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

        {/* ── PAGE CONTENT ─────────────────────────────────────────────── */}
        <div className="ms-page-content">

          {/* Page header + filters */}
          <div className="ms-page-header">
            <div>
              <h1 className="ms-page-title">Manage Shops</h1>
              <p className="ms-page-subtitle">View and manage all registered shops</p>
            </div>
            <span className="ms-shop-count">{filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Search + filters */}
          <div className="ms-search-filter-bar">
            <div className="ms-search-input-wrapper">
              <Search className="ms-search-icon" size={18} />
              <input
                type="text"
                className="ms-search-input"
                placeholder="Search by name, package, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="ms-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="ms-filter-select"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
            >
              <option value="All">All Packages</option>
              <option value="Starter">Starter</option>
              <option value="Professional">Professional</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="ms-loading-state">
              <RefreshCw size={20} className="ms-spin" />
              <span>Loading shops...</span>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="ms-empty-state">
              <div className="ms-empty-icon"><Store size={32} /></div>
              <h3 className="ms-empty-title">No shops found</h3>
              <p className="ms-empty-text">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="ms-shops-grid">
              {filteredShops.map((shop) => (
                <div key={shop.shop_id} className="ms-shop-card">
                  <div className="ms-shop-card-header">
                    {/* Logo or icon */}
                    <div className="ms-shop-logo-wrap">
                      {shop.logo_url ? (
                        <img
                          src={`http://localhost:5000${shop.logo_url}`}
                          alt={shop.name}
                          className="ms-shop-logo-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Store size={24} color="#9333ea" />
                      )}
                    </div>

                    <div className="ms-shop-info">
                      <h3 className="ms-shop-name">{shop.name}</h3>
                      <p className="ms-shop-meta">
                        {shop.address || 'No address'} &bull; {shop.package || '—'}
                      </p>
                    </div>

                    <span className={`ms-status-badge ${shop.status === 'active' ? 'active' : 'inactive'}`}>
                      {shop.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stats row */}
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

                  {/* Actions */}
                  <div className="ms-shop-actions">
                    <button className="ms-action-btn" onClick={() => navigate(`/shop/${shop.shop_id}`)}>
                      <Eye size={15} /><span>View</span>
                    </button>
                    <button className="ms-action-btn" onClick={() => navigate(`/shop/edit/${shop.shop_id}`)}>
                      <Edit size={15} /><span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageShops;