import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, User, LogOut, BarChart3, Package,
  Truck, CheckSquare, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './POSTerminalstyles/IncomingDeliveries.css';
import { API_BASE_URL } from '../config';

const API = API_BASE_URL;
const fmt = (n) => `Rs. ${parseFloat(n || 0).toLocaleString()}`;

const IncomingDeliveries = () => {
  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [loadError,       setLoadError]       = useState('');
  const [barcodeDrafts,   setBarcodeDrafts]   = useState({}); // { [order_id]: { [order_item_id]: value } }
  const [receivingId,     setReceivingId]     = useState(null);
  const [orderErrors,     setOrderErrors]     = useState({}); // { [order_id]: message }

  const [showMenuDropdown,    setShowMenuDropdown]    = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode,          setIsDarkMode]          = useState(false);

  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const user               = JSON.parse(localStorage.getItem('user') || '{}');
  const token               = localStorage.getItem('token');
  const navigate            = useNavigate();

  /*  Close dropdowns on outside click  */
  useEffect(() => {
    const handler = (e) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target))
        setShowMenuDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        setShowProfileDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /*  Load this store's pending deliveries  */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res  = await fetch(`${API}/api/incoming-deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load deliveries.');
      setOrders(data);
    } catch (err) {
      setLoadError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /*  Barcode input handling  */
  const setBarcodeDraft = (orderId, orderItemId, value) => {
    setBarcodeDrafts(prev => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), [orderItemId]: value },
    }));
  };

  const canReceive = (order) => {
    const drafts = barcodeDrafts[order.order_id] || {};
    return order.items
      .filter(it => it.needs_barcode)
      .every(it => (drafts[it.order_item_id] || '').trim().length > 0);
  };

  /*  Mark an order received  */
  const handleReceive = async (order) => {
    if (!canReceive(order)) return;

    setReceivingId(order.order_id);
    setOrderErrors(prev => ({ ...prev, [order.order_id]: '' }));

    try {
      const res = await fetch(`${API}/api/incoming-deliveries/${order.order_id}/receive`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ barcodes: barcodeDrafts[order.order_id] || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to receive delivery.');

      // Order is no longer pending — drop it locally and clear its drafts
      setOrders(prev => prev.filter(o => o.order_id !== order.order_id));
      setBarcodeDrafts(prev => {
        const next = { ...prev };
        delete next[order.order_id];
        return next;
      });
    } catch (err) {
      setOrderErrors(prev => ({ ...prev, [order.order_id]: err.message || 'Network error.' }));
    } finally {
      setReceivingId(null);
    }
  };

  /*  Handlers  */
  const toggleDarkMode      = () => setIsDarkMode(prev => !prev);
  const handleLogOut        = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };
  const handleMyProfile     = () => navigate('/myprofile');
  const handleProfileLogout = () => { setShowProfileDropdown(false); handleLogOut(); };

  /*  Render  */
  return (
    <div className="incoming-deliveries-container">

      {/*  Sidebar — identical structure/classnames to FindProducts  */}
      <aside className="pos-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/posterminal')}>
            <User size={18} /><span>POS Terminal</span>
          </button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/findproducts')}>
            <Search size={18} /><span>Find Products</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/returnproduct')}>
            <Package size={18} /><span>Return Product</span>
          </button>
          <button className="nav-item active">
            <Truck size={18} /><span>Incoming Deliveries</span>
          </button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/mysales')}>
            <BarChart3 size={18} /><span>My Sales</span>
          </button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={handleMyProfile}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  Main  */}
      <main className="incoming-deliveries-main">
        <header className="main-header">
          <div className="breadcrumb">POS &gt; Incoming Deliveries</div>
          <div className="header-actions">

            {/* Menu dropdown */}
            <div className="menu-dropdown-container" ref={menuDropdownRef}>
              <button className="btn-menu" onClick={() => setShowMenuDropdown(p => !p)}>
                Menu <span className="dropdown-arrow">▼</span>
              </button>

              {showMenuDropdown && (
                <div className="menu-dropdown">
                  <div className="menu-section">
                    <h4 className="menu-section-title">Quick Actions</h4>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/posterminal'); }}>
                      <ShoppingCart size={18} /><span>New Sale</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/findproducts'); }}>
                      <Search size={18} /><span>Find Products</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}>
                      <BarChart3 size={18} /><span>My Sales</span>
                    </button>
                  </div>

                  <div className="menu-divider"></div>

                  <div className="menu-section">
                    <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={toggleDarkMode}>
                      {isDarkMode ? '☀️' : '🌙'}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button className="profile-circle-btn" onClick={() => setShowProfileDropdown(p => !p)}>
                {user.image_url ? (
                  <img
                    src={`${API_BASE_URL}${user.image_url}`}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <span className="profile-initials">
                    {user.name?.substring(0, 2).toUpperCase() || 'ME'}
                  </span>
                )}
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user.image_url ? (
                        <img
                          src={`${API_BASE_URL}${user.image_url}`}
                          alt="Profile"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        <span className="avatar-initials">
                          {user.name?.substring(0, 2).toUpperCase() || 'ME'}
                        </span>
                      )}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">{user.name || 'User'}</h4>
                      <p className="profile-role">{user.role || 'Cashier'}</p>
                    </div>
                  </div>

                  <div className="profile-divider"></div>

                  <div className="profile-detail-item">
                    <span className="detail-icon">📧</span>
                    <span className="detail-text">{user.email || 'N/A'}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="detail-icon">📱</span>
                    <span className="detail-text">{user.phone || 'N/A'}</span>
                  </div>

                  <div className="profile-divider"></div>

                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={handleMyProfile}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="profile-action-btn logout-btn" onClick={handleProfileLogout}>
                      <LogOut size={18} /><span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/*  Content  */}
        <div className="incoming-deliveries-content">
          <div className="delivery-summary-card">
            <div className="delivery-summary-header">
              <h2 className="delivery-page-title">Incoming Deliveries</h2>
              <button className="delivery-refresh-btn" onClick={fetchOrders} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
              </button>
            </div>
            <p className="delivery-count-text">
              {loading
                ? 'Checking for deliveries…'
                : <>You have <strong>{orders.length}</strong> pending {orders.length === 1 ? 'delivery' : 'deliveries'} for your store.</>}
            </p>
          </div>

          {loading ? (
            <div className="delivery-empty">
              <div className="delivery-empty-icon">⏳</div>
              <h3 className="delivery-empty-title">Loading deliveries…</h3>
            </div>
          ) : loadError ? (
            <div className="delivery-empty">
              <div className="delivery-empty-icon"><AlertCircle size={32} /></div>
              <h3 className="delivery-empty-title">Something went wrong</h3>
              <p className="delivery-empty-text">{loadError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="delivery-empty">
              <div className="delivery-empty-icon"><Truck size={32} /></div>
              <h3 className="delivery-empty-title">No pending deliveries</h3>
              <p className="delivery-empty-text">Nothing waiting to be received at your store right now.</p>
            </div>
          ) : (
            <div className="delivery-list">
              {orders.map(order => (
                <div key={order.order_id} className="delivery-order-card">
                  <div className="delivery-order-top">
                    <div>
                      <h3 className="delivery-order-title">
                        Order #{order.order_id} — {order.supplier_name}
                      </h3>
                      <p className="delivery-order-meta">
                        {order.invoice_number && <>Invoice: {order.invoice_number} · </>}
                        Placed {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="delivery-order-total">{fmt(order.total)}</span>
                  </div>

                  {order.notes && <p className="delivery-order-notes">Note: {order.notes}</p>}

                  <div className="delivery-items-table">
                    <div className="delivery-items-header-row">
                      <span>Product</span><span>Qty</span><span>Barcode</span>
                    </div>
                    {order.items.map(item => (
                      <div key={item.order_item_id} className="delivery-item-row">
                        <span className="delivery-item-name">
                          {item.product_name}
                          {item.needs_barcode && <span className="delivery-new-badge">New product</span>}
                        </span>
                        <span className="delivery-item-qty">{item.quantity}</span>
                        <span className="delivery-item-barcode">
                          {item.needs_barcode ? (
                            <input
                              className="delivery-barcode-input"
                              placeholder="Scan or type barcode"
                              autoComplete="off"
                              value={barcodeDrafts[order.order_id]?.[item.order_item_id] || ''}
                              onChange={e => setBarcodeDraft(order.order_id, item.order_item_id, e.target.value)}
                            />
                          ) : (
                            <span className="delivery-linked-badge"><CheckSquare size={13} /> Linked</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {orderErrors[order.order_id] && (
                    <div className="delivery-error">
                      <AlertCircle size={14} /><span>{orderErrors[order.order_id]}</span>
                    </div>
                  )}

                  <div className="delivery-order-footer">
                    <button
                      className="delivery-receive-btn"
                      disabled={!canReceive(order) || receivingId === order.order_id}
                      onClick={() => handleReceive(order)}
                    >
                      <CheckSquare size={15} />
                      {receivingId === order.order_id ? 'Receiving…' : 'Mark Received'}
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

export default IncomingDeliveries;