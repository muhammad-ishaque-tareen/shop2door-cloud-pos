import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Store,
  Plus,
  Users,
  ShoppingCart,
  Package as PackageIcon,FileBarChart,
  Diamond,
  LogOut, Boxes,
  User,
  Bell,
  Moon,
  Settings, Tags,
  ArrowLeft,
  ShoppingCart as CartIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  X,
  Zap,
  Star,
  Crown,
  CreditCard,
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/Subscription.css';
import { API_BASE_URL } from '../config';

const Subscription = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upgrade modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Fetch subscription + usage + billing data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, billingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/shop/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/shop/usage`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/shop/billing-history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionData(subData);
      }
      if (usageRes.ok) {
        const uData = await usageRes.json();
        setUsageData(uData);
      }
      if (billingRes.ok) {
        const bData = await billingRes.json();
        setBillingHistory(Array.isArray(bData) ? bData : []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  };

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

  // Open upgrade modal — fetch higher plans
  const handleUpgradeClick = async () => {
    setShowUpgradeModal(true);
    setPurchaseSuccess(false);
    setPurchaseError('');
    setSelectedPlan(null);
    setPlansLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/available-plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailablePlans(Array.isArray(data) ? data : []);
      } else {
        setAvailablePlans([]);
      }
    } catch {
      setAvailablePlans([]);
    } finally {
      setPlansLoading(false);
    }
  };

  // Purchase plan
  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    setPurchaseError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/shop/upgrade-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ package_id: selectedPlan.package_id })
      });
      const data = await res.json();
      if (res.ok) {
        setPurchaseSuccess(true);
        // Refresh all data after upgrade
        await fetchAllData();
      } else {
        setPurchaseError(data.message || 'Purchase failed. Please try again.');
      }
    } catch {
      setPurchaseError('Network error. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
    setSelectedPlan(null);
    setPurchaseSuccess(false);
    setPurchaseError('');
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const shopLogoUrl = user.shop_logo
    ? `${API_BASE_URL}${user.shop_logo}`
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
          src={`${API_BASE_URL}${user.image_url}`}
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

  const getPlanIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('enterprise')) return <Crown size={22} />;
    if (n.includes('professional') || n.includes('pro')) return <Star size={22} />;
    return <Zap size={22} />;
  };

  const getBillingStatusClass = (status) => {
    if (!status) return 'paid';
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'completed' || s === 'success') return 'paid';
    if (s === 'pending') return 'pending';
    return 'failed';
  };

  return (
    <div className="shop-admin-container">
      {/* SIDEBAR */}
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

          <div className="nav-divider" />

          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} />
            <span>My Users</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} />
            <span>Suppliers</span>
          </button>

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
            <TrendingUp size={18} /><span>Sales Records</span>
          </button>
           <button className="mp-nav-item" onClick={()=> navigate('/reportsandanalytics')}>
            <FileBarChart size={18}/><span>Reports & Analytics</span>
          </button>

          <button className="shop-nav-item active">
            <Diamond size={18} /> <span>Subscription</span>
          </button>
          <div className="nav-divider" />
          <button className="shop-nav-item" onClick={() => navigate('/adminprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="shop-nav-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Log Out</span>
          </button>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="shop-admin-main">
        {/* HEADER */}
        <header className="shop-main-header">
          <div className="shop-breadcrumb">
            <button className="sub-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            Subscription
          </div>

          <div className="shop-header-actions">
            <div className="shop-menu-dropdown-container" ref={menuDropdownRef}>
              <button
                className="shop-btn-menu"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
                Menu <span className="shop-dropdown-arrow">▾</span>
              </button>
              {showMenuDropdown && (
                <div className="shop-menu-dropdown">
                  <div className="shop-menu-section">
                    <p className="shop-menu-section-title">Quick Actions</p>
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

              {/* MAIN GRID */}
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
                          Rs: {parseFloat(subscriptionData.price).toLocaleString()}/month
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

                  <button className="sub-upgrade-btn" onClick={handleUpgradeClick}>
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
                            {item.package_name || item.plan_name || subscriptionData?.package_name} Plan
                          </span>
                          <span className="sub-billing-amount">
                            Rs: {parseFloat(item.amount).toLocaleString()}
                          </span>
                          <span className={`sub-billing-status ${getBillingStatusClass(item.status)}`}>
                            {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Paid'}
                          </span>
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

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="sub-modal-overlay" onClick={handleCloseModal}>
          <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-header">
              <div>
                <h2 className="sub-modal-title">Upgrade Your Plan</h2>
                <p className="sub-modal-subtitle">Choose a plan that fits your business</p>
              </div>
              <button className="sub-modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {purchaseSuccess ? (
              <div className="sub-purchase-success">
                <div className="sub-success-icon">
                  <CheckCircle size={48} />
                </div>
                <h3>Plan Upgraded Successfully!</h3>
                <p>Your new plan is now active. All limits have been updated.</p>
                <button className="sub-upgrade-btn" onClick={handleCloseModal}>
                  Done
                </button>
              </div>
            ) : (
              <>
                {plansLoading ? (
                  <div className="sub-loading">
                    <div className="sub-spinner" />
                    <p>Loading available plans...</p>
                  </div>
                ) : availablePlans.length === 0 ? (
                  <div className="sub-billing-empty">
                    <Crown size={36} />
                    <p>You are already on the highest plan!</p>
                  </div>
                ) : (
                  <div className="sub-plans-grid">
                    {availablePlans.map((plan) => (
                      <div
                        key={plan.package_id}
                        className={`sub-plan-option ${selectedPlan?.package_id === plan.package_id ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="sub-plan-option-header">
                          <div className="sub-plan-option-icon">
                            {getPlanIcon(plan.name)}
                          </div>
                          {selectedPlan?.package_id === plan.package_id && (
                            <div className="sub-plan-selected-badge">
                              <CheckCircle size={14} /> Selected
                            </div>
                          )}
                        </div>
                        <h3 className="sub-plan-option-name">{plan.name}</h3>
                        <p className="sub-plan-option-price">
                          Rs: {parseFloat(plan.price).toLocaleString()}
                          <span>/month</span>
                        </p>
                        <ul className="sub-plan-features">
                          <li>🏪 {plan.max_stores} Stores</li>
                          <li>👥 {plan.max_users_per_store} Users </li>
                          <li>📦 {plan.max_products.toLocaleString()} Products</li>
                          <li>💾 {plan.max_storage_mb >= 1000 ? `${plan.max_storage_mb / 1000} GB` : `${plan.max_storage_mb} MB`} Storage</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {purchaseError && (
                  <div className="sub-error" style={{ marginTop: '1rem' }}>
                    <AlertCircle size={18} />
                    <span>{purchaseError}</span>
                  </div>
                )}

                {availablePlans.length > 0 && (
                  <div className="sub-modal-footer">
                    <button
                      className="sub-cancel-btn"
                      onClick={handleCloseModal}
                      disabled={purchasing}
                    >
                      Cancel
                    </button>
                    <button
                      className="sub-upgrade-btn sub-purchase-btn"
                      onClick={handlePurchase}
                      disabled={!selectedPlan || purchasing}
                    >
                      {purchasing ? (
                        <>
                          <Loader size={16} className="sub-spin-icon" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          {selectedPlan
                            ? `Purchase ${selectedPlan.name}  Rs: ${parseFloat(selectedPlan.price).toLocaleString()}`
                            : 'Select a Plan'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;