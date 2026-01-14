import React, { useState, useRef, useEffect} from 'react';
import { ShoppingCart, FileText, Search, Package, BarChart3, Settings, User, LogOut, Moon, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './POSTerminalstyles/ReturnProduct.css';

const ReturnProduct = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [orderId, setOrderId] = useState('ORD-2026-001');
  const [returnReason, setReturnReason] = useState('Changed Mind');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  
  const orderItems = [
    {
      id: 1,
      name: 'Organic Bananas',
      sku: 'FRU-001',
      qtySold: 2,
      unitPrice: 2.99,
      lineTotal: 5.98,
      returnQty: 1
    },
    {
      id: 2,
      name: 'Fresh Milk',
      sku: 'DAI-002',
      qtySold: 1,
      unitPrice: 3.49,
      lineTotal: 3.49,
      returnQty: 1
    },
    {
      id: 3,
      name: 'Whole Wheat Bread',
      sku: 'BAK-003',
      qtySold: 1,
      unitPrice: 4.99,
      lineTotal: 4.99,
      returnQty: 1
    }
  ];

  const [items, setItems] = useState(orderItems);

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleReturnQtyChange = (itemId, qty) => {
    setItems(items.map(item => 
      item.id === itemId ? { ...item, returnQty: parseInt(qty) || 0 } : item
    ));
  };
  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
  const itemsSubtotal = selectedItemsData.reduce((sum, item) => 
    sum + (item.unitPrice * item.returnQty), 0
  );
  const originalTax = itemsSubtotal * 0.085;
  const restockingFee = 0;
  const refundAmount = itemsSubtotal + originalTax - restockingFee;

  const handleProcessReturn = () => {
    // Handle return processing logic
    console.log('Processing return...');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // dark mode logic here
  };
  
  const handleProfileLogout = () => {
    setShowProfileDropdown(false);
    navigate('/');
  };

  return (
    <div className="return-container">
      {/* Sidebar */}
      <aside className="return-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">FreshMart</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/posterminal')}>
            <User size={18} />
            <span>POS Terminal</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/shiftreport')}>
            <FileText size={18} />
            <span>Shift Report</span>
          </button>
          <button className="nav-item" onClick={()=>navigate('/findproducts')}>
            <Search size={18} />
            <span>Find Products</span>
          </button>
          <button className="nav-item active" onClick={()=>navigate('/findproducts')}>
            <Package size={18} />
            <span>Return Product</span>
          </button>
          <button className="nav-item"  onClick={()=>navigate('/mysales')} >
            <BarChart3 size={18} />
            <span>My Sales</span>
          </button>
          <button className="nav-item"  onClick={()=>navigate('/settingss')} >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/myprofile')}>
            <User size={18} />
            <span>My Profile</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/')}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="return-main">
        {/* Header */}
        <header className="main-header">
          <div className="breadcrumb">POS &gt; Dashboard</div>
          <div className="header-actions">
            <button className="btn-shift-active">Shift Active</button>
            
            {/* Menu Dropdown */}
            <div className="menu-dropdown-container" ref={menuDropdownRef}>
              <button 
                className="btn-menu" 
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
                Menu <span className="dropdown-arrow">▼</span>
              </button>
        
              {showMenuDropdown && (
                <div className="menu-dropdown">
                  <div className="menu-section">
                    <h4 className="menu-section-title">Quick Actions</h4>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/posterminal'); }}>
                      <ShoppingCart size={18} />
                      <span>New Sale</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/findproducts'); }}>
                      <Search size={18} />
                      <span>Find Products</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shiftreport'); }}>
                      <FileText size={18} />
                      <span>Shift Report</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}>
                      <BarChart3 size={18} />
                      <span>My Sales</span>
                    </button>
                  </div>
        
                  <div className="menu-divider"></div>
        
                  <div className="menu-section">
                    <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={toggleDarkMode}>
                      {isDarkMode ? '☀️' : '🌙'}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button className="menu-item" onClick={()=>navigate('/settingss')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
        
            <div className="icon-circle moon">🌙</div>
            <div className="icon-circle calculator">🧮</div>
            
            {/* Profile Dropdown */}
            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button 
                className="profile-circle-btn" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <span className="profile-initials">AM</span>
              </button>
        
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      <span className="avatar-initials">AM</span>
                    </div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">Altaf Mehmood</h4>
                      <p className="profile-role">Cashier</p>
                    </div>
                  </div>
        
                  <div className="profile-divider"></div>
        
                  <div className="profile-details">
                    <div className="profile-detail-item">
                      <span className="detail-icon">📧</span>
                      <span className="detail-text">altaf.mehmood@freshmart.com</span>
                    </div>
                    <div className="profile-detail-item">
                      <span className="detail-icon">📱</span>
                      <span className="detail-text">+92 334 5467856</span>
                    </div>
                  </div>
        
                  <div className="profile-divider"></div>
        
                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={handleMyProfile}>
                      <User size={18} />
                      <span>My Profile</span>
                    </button>
                    <button className="profile-action-btn"  onClick={()=>navigate('/settingss')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                    <button className="profile-action-btn logout-btn" onClick={handleProfileLogout}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        

        {/* Content */}
        <div className="return-content">
          {/* Search Section */}
          <div className="search-section">
            <div className="search-wrapper-return">
              <Search className="search-icon-return" size={20} />
              <input
                type="text"
                placeholder="Search Sale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-return"
              />
            </div>
            <button className="btn-search">Search</button>
          </div>

          {/* Order ID */}
          <div className="order-id-section">
            <label className="order-id-label">Order ID / Receipt Number</label>
            <div className="order-id-value">{orderId}</div>
          </div>

          {/* Order Items Selection */}
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
                        checked={selectedItems.length === items.length}
                        onChange={handleSelectAll}
                        className="checkbox-input"
                      />
                      <span>Select</span>
                    </th>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th>Qty Sold</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                    <th>Return Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className={selectedItems.includes(item.id) ? 'selected-row' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="checkbox-input"
                        />
                      </td>
                      <td className="product-name-cell">{item.name}</td>
                      <td className="sku-cell">{item.sku}</td>
                      <td className="qty-cell">{item.qtySold}</td>
                      <td className="price-cell">Rs.{item.unitPrice.toFixed(2)}</td>
                      <td className="total-cell">Rs.{item.lineTotal.toFixed(2)}</td>
                      <td className="return-qty-cell">
                        <input
                          type="number"
                          min="0"
                          max={item.qtySold}
                          value={item.returnQty}
                          onChange={(e) => handleReturnQtyChange(item.id, e.target.value)}
                          className="qty-input"
                          disabled={!selectedItems.includes(item.id)}
                        />
                      </td>
                      <td className="subtotal-cell">Rs.{(item.unitPrice * item.returnQty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-actions">
              <button className="btn-select-all" onClick={handleSelectAll}>
                Select All
              </button>
              <button className="btn-clear-selection" onClick={handleClearSelection}>
                Clear Selection
              </button>
            </div>
          </div>

          {/* Refund Calculation */}
          <div className="refund-section">
            <div className="refund-header">
              <div className="refund-title-wrapper">
                <span className="section-icon-return">💰</span>
                <h2 className="section-title-return">Refund Calculation</h2>
              </div>
              <button className="btn-restock">
                <span className="restock-icon">📦</span>
                Restock Item
              </button>
            </div>

            <div className="refund-content-wrapper">
              <div className="refund-calculations">
                <div className="refund-row">
                  <span className="refund-label">Items Subtotal:</span>
                  <span className="refund-value">Rs.{itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="refund-row">
                  <span className="refund-label">Original Tax:</span>
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
                  <option value="Changed Mind">Changed Mind</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Wrong Item">Wrong Item</option>
                  <option value="Not as Described">Not as Described</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="refund-actions">
              <button className="btn-cancel">Cancel</button>
              <button className="btn-process-return" onClick={handleProcessReturn}>
                Process Return
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReturnProduct;