import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Store,
  Plus,
  Users,
  ShoppingCart,
  Package as PackageIcon,
  Diamond,
  LogOut,
  User,
  Bell,
  Moon,
  Settings, Tags,
  ArrowLeft,
  ShoppingCart as CartIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/Subscription.css';

const Subscription = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Fetch subscription + usage data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, usageRes] = await Promise.all([
          fetch('http://localhost:5000/api/shop/subscription', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/shop/usage', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionData(subData);
          setBillingHistory(subData.billing_history || []);
        }
        if (usageRes.ok) {
          const uData = await usageRes.json();
          setUsageData(uData);
        }
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
    navigate('/');
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
    return <span className="shop-brand-title">{user.shop_name || 'Shop'}</span>;
  };

  const renderProfileImage = (size = 'default') => {
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';
    if (user.image_url) {
      return (
        <img
          src={`http://localhost:5000${user.image_url}`}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }
    const cls = size === 'dropdown' ? 'avatar-initials' : 'profile-initials';
    return <span className={cls}>{initials}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getBarPercent = (used, max) => {
    if (!max) return 0;
    return Math.min((used / max) * 100, 100);
  };

  return (
    <div className="shop-admin-container">
      {/* SIDEBAR — identical to ShopAdminDashboard */}
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">
          {renderShopLogo()}
        </div>

        <nav className="shop-sidebar-nav">
          <button className="shop-nav-item" onClick={() => navigate('/shopadmindashboard')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

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
          
          <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} />
            <span>Suppliers</span>
          </button>

          <div className="nav-divider" />

          <button className="shop-nav-item active">
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
          <div className="shop-breadcrumb">
            <button className="sub-back-btn" onClick={() => navigate('/shopadmindashboard')}>
              <ArrowLeft size={16} />
            </button>
            Admin &gt; Subscription
          </div>
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
                    <h4 className="shop-menu-section-title">Quick Links</h4>
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

        {/* SUBSCRIPTION CONTENT */}
        <div className="shop-dashboard-content">
          <div className="shop-welcome-section">
            <h1 className="shop-welcome-title">Subscription</h1>
            <p className="sub-page-subtitle">Manage your subscription plan</p>
          </div>

          {loading ? (
            <div className="sub-loading">
              <div className="sub-spinner" />
              <p>Loading subscription data...</p>
            </div>
          ) : error ? (
            <div className="sub-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* RENEWAL BANNER */}
              {subscriptionData?.end_date && (
                <div className="sub-renewal-banner">
                  <CheckCircle size={18} />
                  <span>
                    Your subscription renews on{' '}
                    <strong>{formatDate(subscriptionData.end_date)}</strong>
                  </span>
                </div>
              )}

              {/* MAIN GRID: Current Plan + Billing History */}
              <div className="sub-main-grid">

                {/* CURRENT PLAN CARD */}
                <div className="sub-plan-card">
                  <h2 className="sub-card-title">Current Plan</h2>

                  <div className="sub-plan-name-row">
                    <div className="sub-plan-icon">
                      <CartIcon size={24} />
                    </div>
                    <div>
                      <h3 className="sub-plan-name">
                        {subscriptionData?.package_name || usageData?.package_name || 'Professional'}
                      </h3>
                      {subscriptionData?.price && (
                        <p className="sub-plan-price">
                          Rs: {subscriptionData.price}/month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Usage Bars */}
                  {usageData && (
                    <div className="sub-usage-list">
                      <div className="sub-usage-row">
                        <span className="sub-usage-label">Stores</span>
                        <div className="sub-usage-bar-wrap">
                          <div className="sub-usage-bar-track">
                            <div
                              className="sub-usage-bar-fill purple"
                              style={{ width: `${getBarPercent(usageData.stores_used, usageData.max_stores)}%` }}
                            />
                          </div>
                        </div>
                        <span className="sub-usage-count">
                          {usageData.stores_used} / {usageData.max_stores}
                        </span>
                      </div>

                      <div className="sub-usage-row">
                        <span className="sub-usage-label">Users</span>
                        <div className="sub-usage-bar-wrap">
                          <div className="sub-usage-bar-track">
                            <div
                              className="sub-usage-bar-fill teal"
                              style={{ width: `${getBarPercent(usageData.users_used, usageData.max_users_per_store)}%` }}
                            />
                          </div>
                        </div>
                        <span className="sub-usage-count">
                          {usageData.users_used} / {usageData.max_users_per_store}
                        </span>
                      </div>

                      <div className="sub-usage-row">
                        <span className="sub-usage-label">Products</span>
                        <div className="sub-usage-bar-wrap">
                          <div className="sub-usage-bar-track">
                            <div
                              className="sub-usage-bar-fill red"
                              style={{ width: `${getBarPercent(usageData.products_used, usageData.max_products)}%` }}
                            />
                          </div>
                        </div>
                        <span className="sub-usage-count">
                          {usageData.products_used} / {usageData.max_products}
                        </span>
                      </div>
                    </div>
                  )}

                  <button className="sub-upgrade-btn">
                    <TrendingUp size={16} />
                    Upgrade Plan
                  </button>
                </div>

                {/* BILLING HISTORY CARD */}
                <div className="sub-billing-card">
                  <h2 className="sub-card-title">Billing History</h2>

                  {billingHistory.length > 0 ? (
                    <div className="sub-billing-list">
                      {billingHistory.map((item, index) => (
                        <div key={index} className="sub-billing-row">
                          <span className="sub-billing-date">
                            {formatDate(item.payment_date || item.created_at)}
                          </span>
                          <span className="sub-billing-desc">
                            {item.package_name || subscriptionData?.package_name} Plan
                          </span>
                          <span className="sub-billing-amount">
                            ${parseFloat(item.amount).toFixed(2)}
                          </span>
                          <span className="sub-billing-status paid">Paid</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="sub-billing-empty">
                      <Diamond size={32} />
                      <p>No billing history yet</p>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subscription;