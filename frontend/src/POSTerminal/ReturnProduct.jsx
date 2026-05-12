import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart, FileText, Search, Package,
  BarChart3, Settings, User, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../services/api';
import './POSTerminalstyles/ReturnProduct.css';

const ReturnProduct = () => {
  const navigate = useNavigate();

  //  State 
  const [searchQuery,        setSearchQuery]        = useState('');
  const [returnReason,       setReturnReason]       = useState('Changed Mind');
  const [selectedItems,      setSelectedItems]      = useState([]);
  const [showMenuDropdown,   setShowMenuDropdown]   = useState(false);
  const [showProfileDropdown,setShowProfileDropdown]= useState(false);
  const [isDarkMode,         setIsDarkMode]         = useState(false);
  const [loadingSale,        setLoadingSale]        = useState(false);
  const [processingReturn,   setProcessingReturn]   = useState(false);
  const [currentSale,        setCurrentSale]        = useState(null);
  const [items,              setItems]              = useState([]);

  //  Refs & user 
  const menuDropdownRef    = useRef(null);
  const profileDropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  //  Click-outside handler 
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

  //  Search receipt 
  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return alert('Please enter a Receipt Number.');

    try {
      setLoadingSale(true);
      setCurrentSale(null);
      setItems([]);
      setSelectedItems([]);

      const sale = await salesAPI.getByReceipt(query);

      // Block if sale is already fully returned
      if (sale.status === 'returned') {
        alert('This sale has already been fully returned.');
        return;
      }

      setCurrentSale(sale);

      // Map items — compute returnable qty per line
      const saleItems = Array.isArray(sale.items) ? sale.items : [];
      setItems(saleItems.map((item, idx) => {
        const alreadyReturned = parseFloat(item.already_returned_qty) || 0;
        const returnable      = parseFloat(item.quantity) - alreadyReturned;
        return {
          id:             idx,
          sale_item_id:   item.sale_item_id,  // required by backend validation
          product_id:     item.product_id,
          name:           item.product_name,
          qtySold:        parseFloat(item.quantity),
          alreadyReturned,
          returnable,
          unitPrice:      parseFloat(item.price),
          lineTotal:      parseFloat(item.total),
          returnQty:      returnable > 0 ? returnable : 0,
          fullyReturned:  returnable <= 0,
        };
      }));
    } catch (error) {
      alert(error.message || 'Sale not found.');
    } finally {
      setLoadingSale(false);
    }
  };

  //  Selection helpers 
  const handleSelectAll = () => {
    const selectableIds = items.filter(i => !i.fullyReturned).map(i => i.id);
    const allSelected   = selectableIds.every(id => selectedItems.includes(id));
    setSelectedItems(allSelected ? [] : selectableIds);
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  //  Return qty change — capped at returnable qty 
  const handleReturnQtyChange = (id, qty) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, returnQty: Math.min(Math.max(parseInt(qty) || 0, 0), item.returnable) }
          : item
      )
    );
  };

  //  Refund calculation 
  const selectedItemsData = items.filter(i => selectedItems.includes(i.id));
  const itemsSubtotal     = selectedItemsData.reduce((s, i) => s + i.unitPrice * i.returnQty, 0);
  const originalTax       = itemsSubtotal * 0.085;
  const restockingFee     = 0;
  const refundAmount      = itemsSubtotal + originalTax - restockingFee;

  //  Process return 
  const handleProcessReturn = async () => {
    if (!currentSale)           return alert('No sale loaded.');
    if (!selectedItems.length)  return alert('Please select at least one item to return.');

    const hasZeroQty = selectedItemsData.some(i => i.returnQty === 0);
    if (hasZeroQty) return alert('Return quantity must be greater than 0 for selected items.');

    try {
      setProcessingReturn(true);
      await salesAPI.processReturn({
        sale_id: currentSale.sale_id,
        items: selectedItemsData.map(i => ({
          sale_item_id: i.sale_item_id,  // backend uses this to validate + track double-returns
          product_id:   i.product_id,
          quantity:     i.returnQty,
          unit_price:   i.unitPrice,
        })),
        reason: returnReason,
      });

      alert(`Return processed! Refund amount: Rs.${refundAmount.toFixed(2)}`);
      setCurrentSale(null);
      setItems([]);
      setSelectedItems([]);
      setSearchQuery('');
    } catch (error) {
      alert(error.message || 'Failed to process return.');
    } finally {
      setProcessingReturn(false);
    }
  };

  //  Auth helpers 
  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleDarkMode      = () => setIsDarkMode(!isDarkMode);
  const handleProfileLogout = () => { setShowProfileDropdown(false); handleLogOut(); };

  //  Render 
  return (
    <div className="return-container">

      {/*  Sidebar  */}
      <aside className="return-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/posterminal')}>
            <User size={18} /><span>POS Terminal</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/shiftreport')}>
            <FileText size={18} /><span>Shift Report</span>
          </button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/findproducts')}>
            <Search size={18} /><span>Find Products</span>
          </button>
          <button className="nav-item active">
            <Package size={18} /><span>Return Product</span>
          </button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/mysales')}>
            <BarChart3 size={18} /><span>My Sales</span>
          </button>
          {/* <button className="nav-item" onClick={() => navigate('/settings')}>
            <Settings size={18} /><span>Settings</span>
          </button> */}

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/myprofile')}>
            <User size={18} /><span>My Profile</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/*  Main  */}
      <main className="return-main">

        {/* Header */}
        <header className="main-header">
          <div className="breadcrumb">POS &gt; Return Product</div>
          <div className="header-actions">
            <button className="btn-shift-active">Shift Active</button>

            {/* Menu dropdown */}
            <div className="menu-dropdown-container" ref={menuDropdownRef}>
              <button className="btn-menu" onClick={() => setShowMenuDropdown(!showMenuDropdown)}>
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
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shiftreport'); }}>
                      <FileText size={18} /><span>Shift Report</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}>
                      <BarChart3 size={18} /><span>My Sales</span>
                    </button>
                  </div>
                  <div className="menu-divider" />
                  <div className="menu-section">
                    {/* <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={toggleDarkMode}>
                      {isDarkMode ? '☀️' : '🌙'}<span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button className="menu-item" onClick={() => navigate('/settingss')}>
                      <Settings size={18} /><span>Settings</span>
                    </button> */}
                  </div>
                </div>
              )}
            </div>

            <div className="icon-circle moon">🌙</div>
            <div className="icon-circle calculator">🧮</div>

            {/* Profile dropdown */}
            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button className="profile-circle-btn" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {user.image_url
                  ? <img src={`http://localhost:5000${user.image_url}`} alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span className="profile-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>}
              </button>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user.image_url
                        ? <img src={`http://localhost:5000${user.image_url}`} alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span className="avatar-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">{user.name || 'User'}</h4>
                      <p className="profile-role">{user.role || 'Cashier'}</p>
                    </div>
                  </div>
                  <div className="profile-divider" />
                  <div className="profile-details">
                    <div className="profile-detail-item">
                      <span className="detail-icon">📧</span>
                      <span className="detail-text">{user.email || 'N/A'}</span>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-icon">📱</span>
                      <span className="detail-text">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="profile-divider" />
                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={() => navigate('/myprofile')}>
                      <User size={18} /><span>My Profile</span>
                    </button>
                    <button className="profile-action-btn" onClick={() => navigate('/settingss')}>
                      <Settings size={18} /><span>Settings</span>
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

        {/* Content */}
        <div className="return-content">

          {/* Search bar */}
          <div className="search-section">
            <div className="search-wrapper-return">
              <Search className="search-icon-return" size={20} />
              <input
                type="text"
                placeholder="Enter Receipt Number (e.g. RCP-1234567890)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input-return"
              />
            </div>
            <button className="btn-search" onClick={handleSearch} disabled={loadingSale}>
              {loadingSale ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Receipt number display */}
          {currentSale && (
            <div className="order-id-section">
              <label className="order-id-label">Order ID / Receipt Number</label>
              <div className="order-id-value">{currentSale.receipt_no}</div>
            </div>
          )}

          {/* Empty state */}
          {!currentSale && !loadingSale && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <p>Search for a receipt number to load order items.</p>
            </div>
          )}

          {/* Items + Refund section */}
          {currentSale && items.length > 0 && (
            <>
              {/* Items table */}
              <div className="items-section">
                <div className="section-header-return">
                  <span className="section-icon-return">📦</span>
                  <h2 className="section-title-return">Order Items Selection</h2>
                </div>
                <div className="items-table-wrapper">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th className="th-checkbox">
                          <input
                            type="checkbox"
                            checked={
                              items.filter(i => !i.fullyReturned).length > 0 &&
                              items.filter(i => !i.fullyReturned).every(i => selectedItems.includes(i.id))
                            }
                            onChange={handleSelectAll}
                            className="checkbox-input"
                          />
                          <span>Select</span>
                        </th>
                        <th>Product Name</th>
                        <th>Qty Sold</th>
                        <th>Unit Price</th>
                        <th>Line Total</th>
                        <th>Return Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr
                          key={item.id}
                          className={
                            item.fullyReturned
                              ? 'disabled-row'
                              : selectedItems.includes(item.id) ? 'selected-row' : ''
                          }
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => !item.fullyReturned && handleSelectItem(item.id)}
                              className="checkbox-input"
                              disabled={item.fullyReturned}
                            />
                          </td>
                          <td className="product-name-cell">{item.name}</td>
                          <td className="qty-cell">{item.qtySold}</td>
                          <td className="price-cell">Rs.{item.unitPrice.toFixed(2)}</td>
                          <td className="total-cell">Rs.{item.lineTotal.toFixed(2)}</td>
                          <td className="return-qty-cell">
                            {item.fullyReturned ? (
                              <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>Returned</span>
                            ) : (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.returnable}
                                  value={item.returnQty}
                                  onChange={(e) => handleReturnQtyChange(item.id, e.target.value)}
                                  className="qty-input"
                                  disabled={!selectedItems.includes(item.id)}
                                />
                                {item.alreadyReturned > 0 && (
                                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'block' }}>
                                    {item.alreadyReturned} already returned
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                          <td className="subtotal-cell">
                            Rs.{item.fullyReturned ? '0.00' : (item.unitPrice * item.returnQty).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="table-actions">
                  <button className="btn-select-all" onClick={handleSelectAll}>Select All</button>
                  <button className="btn-clear-selection" onClick={() => setSelectedItems([])}>Clear Selection</button>
                </div>
              </div>

              {/* Refund calculation */}
              <div className="refund-section">
                <div className="refund-header">
                  <div className="refund-title-wrapper">
                    <span className="section-icon-return">💰</span>
                    <h2 className="section-title-return">Refund Calculation</h2>
                  </div>
                </div>
                <div className="refund-content-wrapper">
                  <div className="refund-calculations">
                    <div className="refund-row">
                      <span className="refund-label">Items Subtotal:</span>
                      <span className="refund-value">Rs.{itemsSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="refund-row">
                      <span className="refund-label">Original Tax (8.5%):</span>
                      <span className="refund-value">Rs.{originalTax.toFixed(2)}</span>
                    </div>
                    <div className="refund-row">
                      <span className="refund-label">Restocking Fee (-):</span>
                      <span className="refund-value">Rs.{restockingFee.toFixed(2)}</span>
                    </div>
                    <div className="refund-row refund-total">
                      <span className="refund-label-total">Refund Amount:</span>
                      <span className="refund-value-total">Rs.{refundAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="refund-reason-wrapper">
                    <label className="reason-label">Return Reason *</label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="reason-select"
                    >
                      <option value="Need Alternative">Need Alternative</option>
                      <option value="Defective Product">Defective Product</option>
                      <option value="Wrong Item">Wrong Item</option>
                      <option value="Not as Described">Not as Described</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="refund-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setCurrentSale(null);
                      setItems([]);
                      setSelectedItems([]);
                      setSearchQuery('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-process-return"
                    onClick={handleProcessReturn}
                    disabled={processingReturn}
                  >
                    {processingReturn ? 'Processing...' : 'Process Return'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReturnProduct;