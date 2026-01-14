import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Search, User, LogOut, BarChart3, FileText, Settings, Package, ArrowLeft, Filter, X } from 'lucide-react';
import './POSTerminalstyles/FindProducts.css';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';

const FindProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

//  Load products from backend
useEffect(() => {
  loadProducts();
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

const toggleDarkMode = () => {
  setIsDarkMode(!isDarkMode);
  // Add your dark mode logic here
};
  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

 const handleLogOut = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  navigate("/");
};

const handleProfileLogout = () => {
  setShowProfileDropdown(false);
  handleLogOut();
};
  return (
    <div className="find-products-container">
      {/* Sidebar */}
      <aside className="pos-sidebar">
        <div className="brand-header">
          <ShoppingCart className="brand-icon" size={24} />
          <h1 className="brand-title">{user.shop_name || 'Shop2Door'}</h1>
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
          <button className="nav-item active">
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
          <button className="nav-item"   onClick={()=>navigate('/settingss')} >
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

      {/* Main Content */}
      <main className="find-products-main">
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
            <button className="menu-item"  onClick={()=>navigate('/settingss')}>
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
  {user.image_url ? (
    <img 
      src={`http://localhost:5000${user.image_url}`} 
      alt="Profile"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
      }}
    />
  ) : (
    <span className="profile-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>
  )}
</button>

      {showProfileDropdown && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">
  {user.image_url ? (
    <img 
      src={`http://localhost:5000${user.image_url}`} 
      alt="Profile"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '50%'
      }}
    />
  ) : (
    <span className="avatar-initials">{user.name?.substring(0, 2).toUpperCase() || 'AM'}</span>
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
        <div className="find-products-content">
          {/* Search and Filter Section */}
          <div className="search-filter-section">
            <div className="search-header">
              <h2 className="page-title">Product Inventory</h2>
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-wrapper-large">
              <Search className="search-icon-large" size={24} />
              <input
                type="text"
                placeholder="Search by product name, barcode, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-large"
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Category Filters */}
            {showFilters && (
              <div className="filters-panel">
                <div className="filter-group">
                  <label className="filter-label">Filter by Category:</label>
                  <div className="category-filters">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`category-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="results-info">
              <p className="results-count">
                Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
              </p>
              {selectedCategory !== 'All' && (
                <button 
                  className="clear-filters-btn"
                  onClick={() => setSelectedCategory('All')}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>



          {/* Products List */}
          <div className="products-list-container">
            {loading ? (
              <div className="no-results">
              <div className="no-results-icon">⏳</div>
               <h3 className="no-results-title">Loading Products...</h3>
         </div>
      )  : filteredProducts.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3 className="no-results-title">No Products Found</h3>
                <p className="no-results-text">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="products-list">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="product-list-item"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="product-list-left">
                      <div className="product-list-emoji">
                  {product.image_url ? (
                 <img 
                  src={`http://localhost:5000${product.image_url}`} 
                  alt={product.name}
                  style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px'
                  }}
               />
              ) : (
             <span>{product.emoji || '📦'}</span>
              )}
            </div>
                      <div className="product-list-info">
                        <h3 className="product-list-name">{product.name}</h3>
                        <p className="product-list-category">{product.category}</p>
                        <p className="product-list-barcode">Barcode: {product.barcode}</p>
                      </div>
                    </div>
                    <div className="product-list-right">
                      <div className="product-list-price">Rs.{product.price.toFixed(2)}</div>
                      <div className={`product-list-stock ${product.stock < 20 ? 'low-stock' : ''}`}>
                        Stock: {product.stock}
                      </div>
                      <div className="product-list-status">
                        {product.stock > 0 ? (
                          <span className="status-badge in-stock">In Stock</span>
                        ) : (
                          <span className="status-badge out-of-stock">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Product Details</h3>
              <button className="modal-close" onClick={closeProductModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="product-detail-content">
                <div className="product-detail-emoji">{selectedProduct.emoji}</div>
                <div className="product-detail-info">
                  <h2 className="product-detail-name">{selectedProduct.name}</h2>
                  <div className="product-detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{selectedProduct.category}</span>
                  </div>
                  <div className="product-detail-row">
                    <span className="detail-label">Barcode:</span>
                    <span className="detail-value">{selectedProduct.barcode}</span>
                  </div>
                  <div className="product-detail-row">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value price-highlight">Rs.{selectedProduct.price.toFixed(2)}</span>
                  </div>
                  <div className="product-detail-row">
                    <span className="detail-label">Stock Available:</span>
                    <span className={`detail-value ${selectedProduct.stock < 20 ? 'low-stock-text' : 'stock-text'}`}>
                      {selectedProduct.stock} units
                    </span>
                  </div>
                  <div className="product-detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {selectedProduct.stock > 0 ? (
                        <span className="status-badge in-stock">In Stock</span>
                      ) : (
                        <span className="status-badge out-of-stock">Out of Stock</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeProductModal}>
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  closeProductModal();
                  navigate('/posterminal');
                }}
              >
                Go to POS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindProducts;