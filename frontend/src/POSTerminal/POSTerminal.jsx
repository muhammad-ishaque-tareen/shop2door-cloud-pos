import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  User, 
  LogOut, 
  BarChart3, 
  FileText, 
  Settings, 
  Package, 
  ShoppingBag 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productAPI, salesAPI } from '../services/api';
import { queueOrSendSale, initOfflineSync, subscribeToSyncStatus } from '../services/offlineSync';
import './POSTerminalstyles/POSTerminal.css';
import { API_BASE_URL } from '../config';

const POSTerminal = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [customTaxRate, setCustomTaxRate] = useState(5.8);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null); // fetched store details for receipt
  const [selectedProduct, setSelectedProduct] = useState(null); // for product detail modal
  const [syncStatus, setSyncStatus] = useState({ isOnline: navigator.onLine, isSyncing: false, pendingCount: 0 });

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    loadProducts();
    loadStoreInfo();

    initOfflineSync();
    const unsubscribe = subscribeToSyncStatus(setSyncStatus);
    return unsubscribe;
  }, []);

  // Fetch the current user's store so receipt shows correct name / address / phone
  const loadStoreInfo = async () => {
    const storeId = user.store_id;
    if (!storeId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/stores/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStoreInfo(await res.json());
    } catch (err) {
      console.error('Could not load store info:', err);
    }
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

  useEffect(() => {
    const keepFocus = (event) => {
      const activeElement = document.activeElement;
      const isInputField = activeElement?.tagName === 'INPUT' || 
                          activeElement?.tagName === 'TEXTAREA' || 
                          activeElement?.tagName === 'SELECT';
      
      if (barcodeInputRef.current && !isInputField) {
        barcodeInputRef.current.focus();
      }
    };
    
    const initialFocus = setTimeout(() => keepFocus(), 100);
    window.addEventListener('click', keepFocus);
    
    return () => {
      clearTimeout(initialFocus);
      window.removeEventListener('click', keepFocus);
    };
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productAPI.getAll();
      
      const normalizedProducts = data.map(product => ({
        ...product,
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock) || 0
      }));
      
      if (normalizedProducts.length > 0) {
        console.log('Sample product:', normalizedProducts[0]);
        console.log('Image URL will be:', `${API_BASE_URL}${normalizedProducts[0].image_url}`);
      }
      
      setProducts(normalizedProducts);
      const uniqueCategories = ['All', ...new Set(normalizedProducts.map(p => p.category_name).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.product_id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleBarcodeScanned = (barcode) => {
    const product = products.find(p => p.barcode === barcode.trim());
    
    if (product) {
      addToCart(product);
      console.log(`Added ${product.name} to cart via barcode: ${barcode}`);
    } else {
      alert(`Product with barcode "${barcode}" not found`);
    }
  };

  const removeFromCart = (productId) => {
    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem.quantity === 1) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product_id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    }
  };

  const clearCart = () => setCart([]);
  
  const applyDiscount = () => {
    setShowDiscountModal(false);
  };

  const applyTax = () => {
    setShowTaxModal(false);
  };

  const resetDiscount = () => {
    setDiscountValue(0);
    setDiscountReason('');
    setShowDiscountModal(false);
  };

  const resetTax = () => {
    setCustomTaxRate(5.8);
    setShowTaxModal(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (customTaxRate / 100);
  const discount = discountType === 'percent' 
    ? (subtotal * discountValue / 100) 
    : discountValue;
  const total = subtotal + tax - discount;

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category_name === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

 
const handleLogOut = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  navigate('/');
};
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty! Please add items before completing sale.');
      return;
    }

    for (const item of cart) {
      if (item.quantity > item.stock) {
        alert(`Insufficient stock for ${item.name}. Available: ${item.stock}`);
        return;
      }
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: total,
        payment_method: paymentMethod.toLowerCase()
      };

      const result = await queueOrSendSale(saleData);
      const receiptNumber = result.receipt_no;
      const currentDate = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      setProducts(prevProducts => 
        prevProducts.map(product => {
          const cartItem = cart.find(item => item.product_id === product.product_id);
          if (cartItem) {
            return { ...product, stock: product.stock - cartItem.quantity };
          }
          return product;
        })
      );

      setReceiptData({
        receiptNumber,
        date: currentDate,
        cashier: user.name || 'Cashier',
        items: cart,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        amountPaid: paymentMethod === 'Cash' ? Math.ceil(total / 10) * 10 : total,
      });

      setShowReceiptModal(true);
      setCart([]);
      setDiscountValue(0);
      setDiscountReason('');
    } catch (error) {
      console.error('Error completing sale:', error);
      alert(error.response?.data?.error || 'Failed to complete sale. Please try again.');
    }
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptData(null);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleProfileLogout = () => {
    setShowProfileDropdown(false);
    navigate('/');
  };

  const renderProfileImage = (size = 'default') => {
    const imageProps = {
      src: `${API_BASE_URL}${user.image_url}`,
      alt: "Profile",
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
      }
    };

    const initialsClass = size === 'dropdown' ? 'avatar-initials' : 'profile-initials';
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AM';

    return user.image_url ? <img {...imageProps} /> : <span className={initialsClass}>{initials}</span>;
  };

  const renderProductImage = (product) => {
    if (product.image_url) {
      return (
        <img 
          src={`${API_BASE_URL}${product.image_url}`} 
          alt={product.name}
          className="product-image"
        />
      );
    }
    return <div className="product-emoji">{product.emoji || '📦'}</div>;
  };

  const renderCartItemImage = (item) => {
    if (item.image_url) {
      return (
        <img 
          src={`${API_BASE_URL}${item.image_url}`} 
          alt={item.name}
          className="item-image"
        />
      );
    }
    return <span className="item-emoji">{item.emoji || '📦'}</span>;
  };

  return (
    <div className="pos-container">
      <input
        ref={barcodeInputRef}
        type="text"
        style={{ position: 'absolute', left: '-9999px' }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleBarcodeScanned(e.target.value);
            e.target.value = '';
          }
        }}
        aria-label="Barcode scanner input"
      />

      <aside className="pos-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={20} />
          <div className="brand-text">
            <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
            {(storeInfo?.name || user.store_name) && (
              <p className="brand-store-name">{storeInfo?.name || user.store_name}</p>
            )}
          </div>
        </div>

        {(!syncStatus.isOnline || syncStatus.pendingCount > 0) && (
          <div
            className="sync-status-badge"
            style={{
              margin: '0 16px 12px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: !syncStatus.isOnline ? '#fef3c7' : '#dbeafe',
              color: !syncStatus.isOnline ? '#92400e' : '#1e40af',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: !syncStatus.isOnline ? '#f59e0b' : '#3b82f6',
                flexShrink: 0,
              }}
            />
            {!syncStatus.isOnline
              ? `Offline${syncStatus.pendingCount > 0 ? `:- ${syncStatus.pendingCount} sale${syncStatus.pendingCount > 1 ? 's' : ''} queued` : ''}`
              : syncStatus.isSyncing
              ? `Syncing ${syncStatus.pendingCount} sale${syncStatus.pendingCount > 1 ? 's' : ''}...`
              : `${syncStatus.pendingCount} sale${syncStatus.pendingCount > 1 ? 's' : ''} pending sync`}
          </div>
        )}
        
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <User size={18} />
            <span>POS Terminal</span>
          </button>
          {/* <button className="nav-item" onClick={() => navigate('/shiftreport')}>
            <FileText size={18} />
            <span>Shift Report</span>
          </button> */}

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/findproducts')}>
            <Search size={18} />
            <span>Find Products</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/returnproduct')}>
            <Package size={18} />
            <span>Return Product</span>
          </button>

          <div className="nav-divider" />
          <button className="nav-item" onClick={() => navigate('/mysales')}>
            <BarChart3 size={18} />
            <span>My Sales</span>
          </button>
          {/* <button className="nav-item" onClick={() => navigate('/settings')}>
            <Settings size={18} />
            <span>Settings</span>
          </button> */}

          <div className="nav-divider" />
          <button className="nav-item" onClick={handleMyProfile}>
            <User size={18} />
            
            <span>My Profile</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="pos-main">
        <header className="main-header">
          <div className="breadcrumb">POS &gt; Dashboard</div>
          <div className="header-actions">
            <button className="btn-shift-active">Shift Active</button>
            
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
                    {/* <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shiftreport'); }}>
                      <FileText size={18} />
                      <span>Shift Report</span>
                    </button> */}
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mysales'); }}>
                      <BarChart3 size={18} />
                      <span>My Sales</span>
                    </button>
                  </div>

                  <div className="menu-divider"></div>

                  <div className="menu-section">
                    {/* <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={toggleDarkMode}>
                      {isDarkMode ? '☀️' : '🌙'}
                      <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button className="menu-item" onClick={() => navigate('/settingss')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button> */}
                  </div>
                </div>
              )}
            </div>

            <div className="icon-circle moon">🌙</div>
            <div className="icon-circle calculator">🧮</div>
            
            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button 
                className="profile-circle-btn" 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {renderProfileImage()}
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {renderProfileImage('dropdown')}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4 className="profile-name">{user.name || 'User'}</h4>
                      <p className="profile-role">{user.role || 'Cashier'}</p>
                    </div>
                  </div>

                  <div className="profile-divider"></div>

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

                  <div className="profile-divider"></div>

                  <div className="profile-actions">
                    <button className="profile-action-btn" onClick={handleMyProfile}>
                      <User size={18} />
                      <span>My Profile</span>
                    </button>
                    {/* <button className="profile-action-btn" onClick={() => navigate('/settingss')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button> */}
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

        <div className="pos-content-grid">
          <section className="products-section">
            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="category-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <p>No products found</p>
              </div>
            ) : (
              <div className="products-table-wrapper">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => (
                      <tr
                        key={product.product_id}
                        className={`product-row ${product.stock === 0 ? 'out-of-stock' : ''}`}
                      >
                        <td className="col-num">{index + 1}</td>
                        <td className="col-name">
                          <button
                            className="product-name-btn"
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </button>
                        </td>
                        <td className="col-category">{product.category_name || '—'}</td>
                        <td className="col-price">Rs.{product.price.toFixed(2)}</td>
                        <td className="col-stock">
                          <span className={`stock-badge ${product.stock <= 5 ? 'low' : 'ok'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="col-add">
                          <button
                            className="add-to-cart-btn"
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                            title={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                          >
                            +
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <aside className="cart-section">
            <div className="cart-header">
              <div className="cart-title-wrapper">
                <ShoppingBag className="cart-icon" size={24} />
                <h2 className="cart-title">Cart</h2>
              </div>
              <div className="cart-count-badge">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <h3 className="empty-title">Cart is Empty</h3>
                <p className="empty-subtitle">Add products to start a sale</p>
              </div>
            ) : (
              <>
                <div className="cart-items-container">
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.product_id} className="cart-item">
                        {renderCartItemImage(item)}
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          <p className="item-price">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="item-controls">
                          <button onClick={() => removeFromCart(item.product_id)} className="qty-btn">-</button>
                          <span className="qty-display">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="qty-btn">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="totals-card">
              <div className="total-row">
                <span className="total-label">Subtotal</span>
                <span className="total-value">Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">Tax ({customTaxRate}%)</span>
                <span className="total-value">Rs.{tax.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span className="total-label">
                  Discount {discountValue > 0 && `(${discountType === 'percent' ? `${discountValue}%` : `$${discountValue}`})`}
                </span>
                <span className="total-value">Rs.{discount.toFixed(2)}</span>
              </div>
              <div className="total-divider"></div>
              <div className="total-row grand-total">
                <span className="total-label-grand">Total</span>
                <span className="total-value-grand">Rs.{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="payment-methods">
              {['Cash', 'Card', 'Mobile'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`payment-btn ${paymentMethod === method ? 'active' : ''}`}
                >
                  {method}
                </button>
              ))}
            </div>

            <button className="btn-complete-sale" onClick={handleCompleteSale}>
              Complete Sale
            </button>
            <div className="action-buttons">
              <button className="btn-action" onClick={() => setShowDiscountModal(true)}>Discount %</button>
              <button className="btn-action" onClick={() => setShowTaxModal(true)}>Tax %</button>
              <button onClick={clearCart} className="btn-clear">Clear</button>
            </div>
          </aside>
        </div>
      </main>

      {showDiscountModal && (
        <div className="modal-overlay" onClick={() => setShowDiscountModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Apply Discount</h3>
              <button className="modal-close" onClick={() => setShowDiscountModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Discount Type</label>
                <select className="form-control" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Value</label>
                <input type="number" className="form-control" value={discountValue} onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)} placeholder="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Reason (Optional)</label>
                <input type="text" className="form-control" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} placeholder="e.g., Loyalty discount" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={resetDiscount}>Cancel</button>
              <button className="btn btn-primary" onClick={applyDiscount}>Apply Discount</button>
            </div>
          </div>
        </div>
      )}

      {showTaxModal && (
        <div className="modal-overlay" onClick={() => setShowTaxModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Adjust Tax Rate</h3>
              <button className="modal-close" onClick={() => setShowTaxModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input type="number" className="form-control" value={customTaxRate} onChange={(e) => setCustomTaxRate(parseFloat(e.target.value) || 0)} placeholder="8.5" step="0.1" min="0" max="100" />
              </div>
              <div className="form-group">
                <label>Current Tax Amount</label>
                <input type="text" className="form-control" value={`$${tax.toFixed(2)}`} disabled />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={resetTax}>Reset to Default</button>
              <button className="btn btn-primary" onClick={applyTax}>Apply Tax</button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Product Details</h3>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
            </div>
            <div className="modal-body product-detail-body">
              <div className="product-detail-image-wrap">
                {selectedProduct.image_url
                  ? <img src={`${API_BASE_URL}${selectedProduct.image_url}`} alt={selectedProduct.name} className="product-detail-img" />
                  : <div className="product-detail-emoji">{selectedProduct.emoji || '📦'}</div>
                }
              </div>
              <div className="product-detail-info">
                <h2 className="pd-name">{selectedProduct.name}</h2>
                <div className="pd-row"><span className="pd-label">Category</span><span className="pd-value">{selectedProduct.category_name || '—'}</span></div>
                <div className="pd-row"><span className="pd-label">Price</span><span className="pd-value pd-price">Rs.{selectedProduct.price.toFixed(2)}</span></div>
                <div className="pd-row"><span className="pd-label">Stock</span>
                  <span className={`pd-value stock-badge ${selectedProduct.stock <= 5 ? 'low' : 'ok'}`}>{selectedProduct.stock} units</span>
                </div>
                {selectedProduct.barcode && <div className="pd-row"><span className="pd-label">Barcode</span><span className="pd-value pd-barcode">{selectedProduct.barcode}</span></div>}
                {selectedProduct.description && <div className="pd-row pd-desc"><span className="pd-label">Description</span><span className="pd-value">{selectedProduct.description}</span></div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedProduct(null)}>Close</button>
              <button
                className="btn btn-primary"
                disabled={selectedProduct.stock === 0}
                onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
              >
                + Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && receiptData && (
        <div className="modal-overlay" onClick={closeReceiptModal}>
          <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h2 className="modal-title">Shop2Door</h2>
              <button className="modal-close" onClick={closeReceiptModal}>&times;</button>
            </div>
            <div className="modal-body receipt-modal-body">
              {/*  Thermal Receipt  */}
              <div className="receipt" id="thermal-receipt">

                {/*  HEADER  */}
                <div className="receipt-header">
                  <p className="rct-shop-name">{user.shop_name?.toUpperCase() || 'SHOP2DOOR'}</p>
                  {(storeInfo?.name || user.store_name) && (
                    <p className="rct-store-name">{storeInfo?.name || user.store_name}</p>
                  )}
                  {(storeInfo?.address || user.store_address) && (
                    <p className="rct-meta">{storeInfo?.address || user.store_address}</p>
                  )}
                  {(storeInfo?.phone || user.store_phone) && (
                    <p className="rct-meta">Tel: {storeInfo?.phone || user.store_phone}</p>
                  )}
                </div>

                <div className="rct-divider">{'- '.repeat(24)}</div>

                {/*  SALE INFO  */}
                <div className="rct-info-block">
                  <div className="rct-row">
                    <span>Receipt #</span>
                    <span>{receiptData.receiptNumber}</span>
                  </div>
                  <div className="rct-row">
                    <span>Date</span>
                    <span>{receiptData.date}</span>
                  </div>
                  <div className="rct-row">
                    <span>Cashier</span>
                    <span>{receiptData.cashier}</span>
                  </div>
                  <div className="rct-row">
                    <span>Payment</span>
                    <span>{receiptData.paymentMethod}</span>
                  </div>
                </div>

                <div className="rct-divider">{'= '.repeat(25)}</div>

                {/*  COLUMN HEADER  */}
                <div className="rct-col-header">
                  <span className="rct-col-desc">Description</span>
                  <span className="rct-col-qty">Qty</span>
                  <span className="rct-col-price">Price</span>
                  <span className="rct-col-total">Total</span>
                </div>

                <div className="rct-divider rct-divider-thin">{'- '.repeat(24)}</div>

                {/*  ITEMS  */}
                <div className="rct-items">
                  {receiptData.items.map(item => (
                    <div key={item.product_id} className="rct-item-block">
                      <div className="rct-item-row">
                        <span className="rct-col-desc rct-item-name">{item.name}</span>
                        <span className="rct-col-qty">{item.quantity}</span>
                        <span className="rct-col-price">Rs.{item.price.toFixed(2)}</span>
                        <span className="rct-col-total">Rs.{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rct-divider">{'= '.repeat(24)}</div>

                {/*  TOTALS  */}
                <div className="rct-totals">
                  <div className="rct-total-row">
                    <span>Subtotal</span>
                    <span>Rs.{receiptData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="rct-total-row">
                    <span>Tax ({customTaxRate}%)</span>
                    <span>Rs.{receiptData.tax.toFixed(2)}</span>
                  </div>
                  {receiptData.discount > 0 && (
                    <div className="rct-total-row rct-discount">
                      <span>Discount{discountReason ? ` (${discountReason})` : ''}</span>
                      <span>-Rs.{receiptData.discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="rct-divider rct-divider-thin">{'- '.repeat(24)}</div>

                  <div className="rct-total-row rct-grand-total">
                    <span>TOTAL</span>
                    <span>Rs.{receiptData.total.toFixed(2)}</span>
                  </div>

                  <div className="rct-divider rct-divider-thin">{'- '.repeat(24)}</div>

                  <div className="rct-total-row">
                    <span>{receiptData.paymentMethod} Paid</span>
                    <span>Rs.{receiptData.amountPaid.toFixed(2)}</span>
                  </div>
                  {receiptData.paymentMethod === 'Cash' && (
                    <div className="rct-total-row rct-change">
                      <span>Change Due</span>
                      <span>Rs.{(receiptData.amountPaid - receiptData.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="rct-divider">{'* '.repeat(24)}</div>

                {/* ══ FOOTER ══ */}
                <div className="receipt-footer">
                  <p>*** Thank You For Shopping With Us! ***</p>
                  <p>Returns accepted within 7 days with receipt</p>
                  <p>www.shop2door.com</p>
                  <p className="rct-item-count">{receiptData.items.reduce((s, i) => s + i.quantity, 0)} item(s) sold</p>
                </div>

              </div>{/* /receipt */}
            </div>
            <div className="modal-footer no-print">
              <button className="btn btn-outline" onClick={closeReceiptModal}>Close</button>
              <button className="btn btn-primary" onClick={handlePrintReceipt}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSTerminal;