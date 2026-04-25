import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Store,
  Plus,
  Users,TrendingUp,
  ShoppingCart,
  Package as PackageIcon,
  Diamond,
  LogOut,
  User,
  Bell, Tags, Boxes,
  Moon,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/ShopAdminDashboard.css';

const ShopAdminDashboard = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stores, setStores] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Fetch stores
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

  // Fetch usage data from DB
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/shop/usage', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUsageData(data);
        }
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchUsage();
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

  // Shop logo from DB via login response
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
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
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
    <div className="shop-admin-container">
      {/* SIDEBAR */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">
          {renderShopLogo()}
        </div>

        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          {/* NEW: Shop Profile */}
          <button className="shop-nav-item" onClick={() => navigate('/shopprofile')}>
            <Settings size={18} />
            <span>Shop Profile</span>
          </button>
          <div className="nav-divider" />

          <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18} />
            <span>My Stores</span>
          </button>
          {/* <button className="shop-nav-item" onClick={() => navigate('/addstore')}>
            <Plus size={18} />
            <span>Add Store</span>
          </button> */}

          <div className="nav-divider" />

          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} />
            <span>My Users</span>
          </button>
           <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} />
            <span>Suppliers</span>
          </button>
          {/* <button className="shop-nav-item" onClick={() => navigate('/adduser')}>
            <Plus size={18} />
            <span>Add User</span>
          </button> */}

          <div className="nav-divider" />

          <button className="shop-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18} />
            <span>Products</span>
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
            <Diamond size={18} />
            <span>Subscription</span>
          </button>
          <div className="nav-divider" />
           <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18} />
            <span>My Profile</span>
          </button>
          <button className="shop-nav-item logout-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="shop-admin-main">
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Dashboard</div>
          <div className="shop-header-actions">

            {/* Stores dropdown */}
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

        {/* DASHBOARD CONTENT */}
        <div className="shop-dashboard-content">
          <div className="shop-welcome-section">
            <h1 className="shop-welcome-title">
              Good Morning, {user.name?.split(' ')[0] || 'Admin'}!
            </h1>
          </div>

          {/* MY STORE */}
          <div className="my-store-section">
            <h2 className="section-title">MY STORE</h2>
            <div className="stores-grid">
              {loadingStores ? (
                <div className="store-card-loading">Loading stores...</div>
              ) : stores.length > 0 ? (
                stores.map((store, index) => (
                  <div key={store.id} className="store-card">
                    <div className="store-card-header">
                      <h3 className="store-card-title">
                        {store.name || `STORE ${index + 1}`}
                      </h3>
                      <span className="store-growth">Active</span>
                    </div>
                    <p className="store-location">
                      {store.address || store.city || 'No address'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="store-card">
                  <div className="store-card-header">
                    <h3 className="store-card-title">No Stores Yet</h3>
                  </div>
                  <p className="store-location">Add your first store</p>
                </div>
              )}
            </div>
          </div>

          {/* MY USAGE */}
          <div className="my-usage-section">
            <h2 className="section-title">MY USAGE</h2>
            {loadingUsage ? (
              <div className="usage-loading">Loading usage data...</div>
            ) : usageData ? (
              <div className="usage-grid">
                <div className="usage-card">
                  <h3 className="usage-label">Store</h3>
                  <div className="usage-bar-container">
                    <div
                      className="usage-bar purple"
                      style={{
                        width: `${Math.min((usageData.stores_used / usageData.max_stores) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="usage-count">
                    {usageData.stores_used}/{usageData.max_stores}
                  </p>
                </div>
                <div className="usage-card">
                  <h3 className="usage-label">User</h3>
                  <div className="usage-bar-container">
                    <div
                      className="usage-bar teal"
                      style={{
                        width: `${Math.min((usageData.users_used / usageData.max_users_per_store) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="usage-count">
                    {usageData.users_used}/{usageData.max_users_per_store}
                  </p>
                </div>
                <div className="usage-card">
                  <h3 className="usage-label">Product</h3>
                  <div className="usage-bar-container">
                    <div
                      className="usage-bar red"
                      style={{
                        width: `${Math.min((usageData.products_used / usageData.max_products) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="usage-count">
                    {usageData.products_used}/{usageData.max_products}
                  </p>
                </div>
              </div>
            ) : (
              <div className="usage-loading">No usage data available</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopAdminDashboard;