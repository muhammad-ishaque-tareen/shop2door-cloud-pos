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
  Moon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ShopAdminTerminalStyles/ShopAdminDashboard.css';

const ShopAdminDashboard = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch stores from database
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stores', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStores(data);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setShowMenuDropdown(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate("/");
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
    const initials = user.name?.substring(0, 2).toUpperCase() || 'AD';

    return user.image_url ? <img {...imageProps} /> : <span className={initialsClass}>{initials}</span>;
  };

  // Hard-coded usage data
  const usageData = {
    store: { current: 3, total: 5 },
    user: { current: 7, total: 10 },
    product: { current: 950, total: 1000 }
  };

  return (
    <div className="shop-admin-container">
      <aside className="shop-admin-sidebar">
        <div className="shop-brand-header">
          <h1 className="shop-brand-title">Fresh Mart 🛒</h1>
        </div>
        
        <nav className="shop-sidebar-nav">
          <div className="nav-section-title">SHOP MANAGEMENT</div>
          <button className="shop-nav-item active">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/shopsetting')}>
            <Home size={18} />
            <span>Shop Setting</span>
          </button>

          <div className="nav-section-title">STORE MANAGEMENT</div>
          <button className="shop-nav-item" onClick={() => navigate('/mystores')}>
            <Store size={18} />
            <span>My Stores</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/addstore')}>
            <Plus size={18} />
            <span>Add Store</span>
          </button>

          <div className="nav-section-title">USER MANAGEMENT</div>
          <button className="shop-nav-item" onClick={() => navigate('/myuser')}>
            <Users size={18} />
            <span>My User</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/adduser')}>
            <Plus size={18} />
            <span>Add User</span>
          </button>

          <div className="nav-section-title">PRODUCTS & INVENTORY</div>
          <button className="shop-nav-item" onClick={() => navigate('/products')}>
            <ShoppingCart size={18} />
            <span>Products</span>
          </button>
          <button className="shop-nav-item" onClick={() => navigate('/suppliers')}>
            <PackageIcon size={18} />
            <span>Suppliers</span>
          </button>

          <div className="nav-section-title">SETTINGS</div>
          <button className="shop-nav-item" onClick={() => navigate('/subscription')}>
            <Diamond size={18} />
            <span>Subscription</span>
          </button>
          <button className="shop-nav-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="shop-admin-main">
        <header className="shop-main-header">
          <div className="shop-breadcrumb">Admin &gt; Dashboard</div>
          <div className="shop-header-actions">
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
                    {loading ? (
                      <div className="shop-menu-item">Loading...</div>
                    ) : stores.length > 0 ? (
                      stores.map((store) => (
                        <button 
                          key={store.id} 
                          className="shop-menu-item"
                          onClick={() => {
                            setShowMenuDropdown(false);
                            // Navigate to specific store
                          }}
                        >
                          <Store size={18} />
                          <span>{store.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="shop-menu-item">No stores found</div>
                    )}
                  </div>

                  <div className="shop-menu-divider"></div>

                  <div className="shop-menu-section">
                    <button className="shop-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/mystores'); }}>
                      <Store size={18} />
                      <span>View All Stores</span>
                    </button>
                    <button className="shop-menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/addstore'); }}>
                      <Plus size={18} />
                      <span>Add New Store</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="shop-icon-circle moon">
              <Moon size={16} />
            </div>
            <div className="shop-icon-circle bell">
              <Bell size={16} />
            </div>
            
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

                  <div className="shop-profile-divider"></div>

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

                  <div className="shop-profile-divider"></div>

                  <div className="shop-profile-actions">
                    <button className="shop-profile-action-btn" onClick={handleMyProfile}>
                      <User size={18} />
                      <span>My Profile</span>
                    </button>
                    <button className="shop-profile-action-btn shop-logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="shop-dashboard-content">
          <div className="shop-welcome-section">
            <h1 className="shop-welcome-title">Good Morning, {user.name || 'Altaf'}!</h1>
          </div>

          <div className="my-store-section">
            <h2 className="section-title">MY STORE</h2>
            <div className="stores-grid">
              {loading ? (
                <div className="store-card-loading">Loading stores...</div>
              ) : stores.length > 0 ? (
                stores.map((store, index) => (
                  <div key={store.id} className="store-card">
                    <div className="store-card-header">
                      <h3 className="store-card-title">STORE {index + 1}</h3>
                      <span className="store-growth">+12%</span>
                    </div>
                    <p className="store-location">{store.location || store.city || 'Location'}</p>
                  </div>
                ))
              ) : (
                <div className="store-card">
                  <div className="store-card-header">
                    <h3 className="store-card-title">No Stores</h3>
                  </div>
                  <p className="store-location">Add your first store</p>
                </div>
              )}
            </div>
          </div>

          <div className="my-usage-section">
            <h2 className="section-title">MY USAGE</h2>
            <div className="usage-grid">
              <div className="usage-card">
                <h3 className="usage-label">Store</h3>
                <div className="usage-bar-container">
                  <div 
                    className="usage-bar purple" 
                    style={{ width: `${(usageData.store.current / usageData.store.total) * 100}%` }}
                  ></div>
                </div>
                <p className="usage-count">{usageData.store.current}/{usageData.store.total}</p>
              </div>

              <div className="usage-card">
                <h3 className="usage-label">User</h3>
                <div className="usage-bar-container">
                  <div 
                    className="usage-bar teal" 
                    style={{ width: `${(usageData.user.current / usageData.user.total) * 100}%` }}
                  ></div>
                </div>
                <p className="usage-count">{usageData.user.current}/{usageData.user.total}</p>
              </div>

              <div className="usage-card">
                <h3 className="usage-label">Product</h3>
                <div className="usage-bar-container">
                  <div 
                    className="usage-bar red" 
                    style={{ width: `${(usageData.product.current / usageData.product.total) * 100}%` }}
                  ></div>
                </div>
                <p className="usage-count">{usageData.product.current}/{usageData.product.total}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShopAdminDashboard;