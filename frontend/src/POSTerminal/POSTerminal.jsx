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
import './POSTerminalstyles/POSTerminal.css';

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
  const [customTaxRate, setCustomTaxRate] = useState(8.5);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadProducts();
  }, []);

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
        console.log('Image URL will be:', `http://localhost:5000${normalizedProducts[0].image_url}`);
      }
      
      setProducts(normalizedProducts);
      const uniqueCategories = ['All', ...new Set(normalizedProducts.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
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
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
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
    setCustomTaxRate(8.5);
    setShowTaxModal(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * (customTaxRate / 100);
  const discount = discountType === 'percent' 
    ? (subtotal * discountValue / 100) 
    : discountValue;
  const total = subtotal + tax - discount;

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

  const handleLogOut = () => {
    navigate("/");
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
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: subtotal,
        tax: tax,
        discount: discount,
        total: total,
        payment_method: paymentMethod
      };

      const result = await salesAPI.create(saleData);
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
          const cartItem = cart.find(item => item.id === product.id);
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
      
      alert('Sale completed successfully!');
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
      src: `http://localhost:5000${user.image_url}`,
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
          src={`http://localhost:5000${product.image_url}`} 
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
          src={`http://localhost:5000${item.image_url}`} 
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
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <User size={18} />
            <span>POS Terminal</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/shiftreport')}>
            <FileText size={18} />
            <span>Shift Report</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/findproducts')}>
            <Search size={18} />
            <span>Find Products</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/returnproduct')}>
            <Package size={18} />
            <span>Return Product</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/mysales')}>
            <BarChart3 size={18} />
            <span>My Sales</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/settingss')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
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
                    <button className="menu-item" onClick={() => navigate('/settingss')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
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
                    <button className="profile-action-btn" onClick={() => navigate('/settingss')}>
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
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="product-card"
                  >
                    {renderProductImage(product)}
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">Rs.{product.price.toFixed(2)}</p>
                    <p className="product-stock">Stock: {product.stock}</p>
                  </div>
                ))}
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
                      <div key={item.id} className="cart-item">
                        {renderCartItemImage(item)}
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          <p className="item-price">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="item-controls">
                          <button onClick={() => removeFromCart(item.id)} className="qty-btn">-</button>
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

      {showReceiptModal && receiptData && (
        <div className="modal-overlay" onClick={closeReceiptModal}>
          <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt</h3>
              <button className="modal-close" onClick={closeReceiptModal}>&times;</button>
            </div>
            <div className="modal-body" style={{ background: '#fff' }}>
              <div className="receipt">
                <div className="receipt-header">
                  <h3 style={{ marginBottom: '5px', margin: 0 }}>{user.shop_name?.toUpperCase() || 'SHOP2DOOR'}</h3>
                  <p>{user.shop_name || 'Shop'} Branch</p>
                  <p>123 Main Street</p>
                  <p>Tel: 03345467856</p>
                  <hr style={{ borderStyle: 'dashed', margin: '10px 0' }} />
                  <p><strong>Receipt #: {receiptData.receiptNumber}</strong></p>
                  <p>Date: {receiptData.date}</p>
                  <p>Cashier: {receiptData.cashier}</p>
                </div>
                <hr style={{ borderStyle: 'dashed', margin: '10px 0' }} />
                <div className="receipt-items">
                  {receiptData.items.map(item => (
                    <div key={item.id} className="receipt-item">
                      <span>{item.name} x{item.quantity}</span>
                      <span>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <hr style={{ borderStyle: 'dashed', margin: '10px 0' }} />
                <div className="receipt-totals">
                  <div className="receipt-item">
                    <span>Subtotal:</span>
                    <span>Rs.{receiptData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="receipt-item">
                    <span>Tax ({customTaxRate}%):</span>
                    <span>Rs.{receiptData.tax.toFixed(2)}</span>
                  </div>
                  {receiptData.discount > 0 && (
                    <div className="receipt-item">
                      <span>Discount:</span>
                      <span>-Rs.{receiptData.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="receipt-item">
                    <strong>TOTAL:</strong>
                    <strong>Rs.{receiptData.total.toFixed(2)}</strong>
                  </div>
                  <hr style={{ borderStyle: 'dashed', margin: '10px 0' }} />
                  <div className="receipt-item">
                    <span>{receiptData.paymentMethod}:</span>
                    <span>Rs.{receiptData.amountPaid.toFixed(2)}</span>
                  </div>
                  {receiptData.paymentMethod === 'Cash' && (
                    <div className="receipt-item">
                      <span>Change:</span>
                      <span>Rs.{(receiptData.amountPaid - receiptData.total).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="receipt-footer">
                  <p>Thank you for shopping with us!</p>
                  <p>Returns within 7 days with receipt are acceptable only.</p>
                  <p>www.shop2door.com</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
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