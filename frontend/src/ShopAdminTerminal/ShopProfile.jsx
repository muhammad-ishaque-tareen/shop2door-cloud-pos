import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Home, Store, Plus, Users,
  ShoppingCart, Package as PackageIcon, Diamond,
  LogOut, Settings, ArrowLeft, Building2,
  Phone, Mail, Clock, MapPin, Tag,
  User, Bell, Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/ShopProfile.css';

const ShopProfile = () => {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Fetch shop profile
  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/shop/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setShopData(data);
        } else {
          setError('Failed to load shop profile.');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchShopProfile();
  }, []);

  // Fetch stores for dropdown
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stores', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStores(data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Close dropdowns on outside click
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
    navigate("/");
  };

  const shopLogoUrl = user.shop_logo
    ? `http://localhost:5000${user.shop_logo}`
    : null;

  const renderShopLogo = () => {
    if (shopLogoUrl) {
      return (
        <img
          src={shopLogoUrl}
          alt={user.shop_name || 'Shop'}
          className="shop-sidebar-logo-img"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      );
    }
    return <span className="sp-brand-title">{user.shop_name || 'Shop'}</span>;
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url) {
      return (
        <img
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', borderRadius: '50%'
          }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'avatar-initials' : 'profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  return (
    <div className="sp-container">
      {/* SIDEBAR */}
      <aside className="sp-sidebar">
        <div className="sp-brand-header">
          {renderShopLogo()}
        </div>
        <nav className="sp-sidebar-nav">
          <button className="sp-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <button className="sp-nav-item active">
            <Settings size={18} /><span>Shop Profile</span>
          </button>
          <div className="sp-nav-divider" />
          <button className="sp-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18} /><span>My Stores</span>
          </button>
          <button className="sp-nav-item" onClick={() => navigate('/addstore')}>
            <Plus size={18} /><span>Add Store</span>
          </button>
          <div className="sp-nav-divider" />
          <button className="sp-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} /><span>My Users</span>
          </button>
          <button className="sp-nav-item" onClick={() => navigate('/adduser')}>
            <Plus size={18} /><span>Add User</span>
          </button>
          <div className="sp-nav-divider" />
          <button className="sp-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18} /><span>Products</span>
          </button>
          <button className="sp-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} /><span>Suppliers</span>
          </button>
          <div className="sp-nav-divider" />
          <button className="sp-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18} /><span>Subscription</span>
          </button>
          <div className="sp-nav-divider" />
          <button className="sp-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18} />
            <span>My Profile</span>
          </button>
          <button className="sp-nav-item sp-logout-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="sp-main">
        <header className="sp-header">
          <div className="sp-breadcrumb">
            <button className="sp-back-btn" onClick={() => navigate('/shopadmindashboard')}>
              <ArrowLeft size={16} />
            </button>
            Admin &gt; Shop Profile
          </div>

          {/* ── Header actions (same as Dashboard) ── */}
          <div className="sp-header-actions">

            {/* All Stores dropdown */}
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button
                className="shop-btn-menu"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
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
                        <button key={store.id} className="shop-menu-item"
                          onClick={() => setShowMenuDropdown(false)}>
                          <Store size={18} />
                          <span>{store.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="shop-menu-item">No stores found</div>
                    )}
                  </div>
                  <div className="shop-menu-divider" />
                  <div className="shop-menu-section">
                    <button className="shop-menu-item"
                      onClick={() => { setShowMenuDropdown(false); navigate('/mystores'); }}>
                      <Store size={18} /><span>View All Stores</span>
                    </button>
                    <button className="shop-menu-item"
                      onClick={() => { setShowMenuDropdown(false); navigate('/addstore'); }}>
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
              <button
                className="shop-profile-circle-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
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
                    <button className="shop-profile-action-btn shop-logout-btn"
                      onClick={handleLogOut}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="sp-content">
          {loading ? (
            <div className="sp-loading">
              <div className="sp-spinner" />
              <p>Loading shop profile...</p>
            </div>
          ) : error ? (
            <div className="sp-error">{error}</div>
          ) : shopData ? (
            <>
              {/* HERO CARD */}
              <div className="sp-hero-card">
                <div className="sp-hero-logo-wrap">
                  {shopData.logo_url ? (
                    <img
                      src={`http://localhost:5000${shopData.logo_url}`}
                      alt={shopData.name}
                      className="sp-hero-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="sp-hero-logo-fallback"
                    style={{ display: shopData.logo_url ? 'none' : 'flex' }}
                  >
                    <Building2 size={48} />
                  </div>
                </div>
                <div className="sp-hero-info">
                  <h1 className="sp-hero-name">{shopData.name}</h1>
                  <span className="sp-hero-code">Code: {shopData.code}</span>
                  {shopData.package_name && (
                    <span className="sp-hero-package">{shopData.package_name} Plan</span>
                  )}
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="sp-details-grid">
                <div className="sp-detail-card">
                  <div className="sp-detail-icon-wrap purple">
                    <MapPin size={20} />
                  </div>
                  <div className="sp-detail-body">
                    <p className="sp-detail-label">Address</p>
                    <p className="sp-detail-value">{shopData.address || 'Not provided'}</p>
                  </div>
                </div>

                <div className="sp-detail-card">
                  <div className="sp-detail-icon-wrap teal">
                    <Phone size={20} />
                  </div>
                  <div className="sp-detail-body">
                    <p className="sp-detail-label">Phone</p>
                    <p className="sp-detail-value">{shopData.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="sp-detail-card">
                  <div className="sp-detail-icon-wrap blue">
                    <Mail size={20} />
                  </div>
                  <div className="sp-detail-body">
                    <p className="sp-detail-label">Admin Email</p>
                    <p className="sp-detail-value">{shopData.admin_email || 'Not provided'}</p>
                  </div>
                </div>

                <div className="sp-detail-card">
                  <div className="sp-detail-icon-wrap orange">
                    <Clock size={20} />
                  </div>
                  <div className="sp-detail-body">
                    <p className="sp-detail-label">Opening Hours</p>
                    <p className="sp-detail-value">{shopData.opening_hours || 'Not provided'}</p>
                  </div>
                </div>

                <div className="sp-detail-card">
                  <div className="sp-detail-icon-wrap green">
                    <Tag size={20} />
                  </div>
                  <div className="sp-detail-body">
                    <p className="sp-detail-label">Subscription Plan</p>
                    <p className="sp-detail-value">{shopData.package_name || 'No active plan'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default ShopProfile;