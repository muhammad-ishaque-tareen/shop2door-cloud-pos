import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Store, Users, ShoppingCart,
  Package as PackageIcon, Diamond, LogOut, User, Bell,
  Tags, Moon, Settings, TrendingUp, Boxes, Truck,
  Clock, Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/MyStores.css';
import './ShopAdminTerminalStyles/Suppliers.css';

const API = 'http://localhost:5000';

const Suppliers = () => {
  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stores,              setStores]              = useState([]);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate           = useNavigate();

  const user  = JSON.parse(localStorage.getItem('user')  || '{}');
  const token = localStorage.getItem('token');

  /* fetch stores for the header dropdown */
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch(`${API}/api/stores`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStores(await res.json());
      } catch { /* silent */ }
    };
    fetchStores();
  }, [token]);

  /* close dropdowns on outside click */
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
      return (
        <img src={shopLogoUrl} alt={user.shop_name || 'Shop'}
          className="shop-sidebar-logo-img"
          onError={(e) => { e.target.style.display = 'none'; }} />
      );
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url)
      return (
        <img src={`${API}${user.image_url}`} alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      );
    return (
      <span className={size === 'dropdown' ? 'avatar-initials' : 'profile-initials'}>
        {initials}
      </span>
    );
  };

  return (
    <div className="shop-admin-container">

      {/*  SIDEBAR  */}
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

          <div className="nav-divider" />

          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} /><span>My Users</span>
          </button>
          <button className="shop-nav-item active">
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
            <TrendingUp size={18} /><span>Sales Records</span>
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

      {/*  MAIN  */}
      <main className="shop-admin-main">

        {/* HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Suppliers</div>

          <div className="shop-header-actions">
            {/* Stores dropdown */}
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button className="shop-btn-menu"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
                All Stores <span className="shop-dropdown-arrow">▼</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <h4 className="shop-menu-section-title">My Stores</h4>
                    {stores.length > 0 ? stores.map(s => (
                      <button key={s.store_id} className="shop-menu-item"
                        onClick={() => setShowMenuDropdown(false)}>
                        <Store size={16} /><span>{s.name}</span>
                      </button>
                    )) : (
                      <div className="shop-menu-item">No stores found</div>
                    )}
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

        {/*  PAGE CONTENT  */}
        <div className="shop-dashboard-content">

          {/* Page title */}
          <div className="sp-page-header">
            <div>
              <h1 className="shop-welcome-title">Suppliers</h1>
              <p className="ms-subtitle">Manage your product suppliers and vendor relationships</p>
            </div>
          </div>

          {/* Under-development card */}
          <div className="sp-dev-card">

            {/* Badge */}
            <div className="sp-badge">
              <span className="sp-badge-dot" />
              In Development Phase
            </div>

            <h2 className="sp-dev-title">Supplier Management is on its way</h2>

            <p className="sp-dev-desc">
              We're building a complete supplier management system. add vendors, track purchase orders,
              monitor delivery timelines, and manage payment terms.     all from one place.
              This feature will be available soon.
            </p>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Suppliers;