import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard,
  FileText,
  Store,
  Package,
  DollarSign,
  Settings,
  LogOut,
  User,
  Bell,
  Calculator,
  Search,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './SystemTerminalStyles/ManageShops.css';

const ManageShops = () => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [packageFilter, setPackageFilter] = useState('All Packages');

  const menuDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

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

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [shops, searchQuery, statusFilter, packageFilter]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/shops');
      const data = await response.json();
      setShops(data);
      setFilteredShops(data);
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterShops = () => {
    let filtered = [...shops];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'Active') {
      filtered = filtered.filter(shop => shop.status === statusFilter);
    }

    // Package filter
    if (packageFilter !== 'All Packages') {
      filtered = filtered.filter(shop => shop.package === packageFilter);
    }

    setFilteredShops(filtered);
  };

  const handleView = (shopId) => {
    navigate(`/shop/${shopId}`);
  };

  const handleEdit = (shopId) => {
    navigate(`/shop/edit/${shopId}`);
  };

  const handleMyProfile = () => {
    navigate("/myprofile");
  };

  const handleLogOut = () => {
    localStorage.removeItem('user');
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

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="brand-header">
          <h1 className="brand-title">SHOP2DOOR</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/systemadmindashboard')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <div className="nav-section-title">SHOP MANAGEMENT</div>
          <button className="nav-item" onClick={() => navigate('/shoprequests')}>
            <FileText size={18} />
            <span>Shop Requests</span>
          </button>
          <button className="nav-item active">
            <Store size={18} />
            <span>Manage Shops</span>
          </button>
          <div className="nav-section-title">PACKAGES & BILLING</div>
          <button className="nav-item" onClick={() => navigate('/packages')}>
            <Package size={18} />
            <span>Packages</span>
          </button>
          <button className="nav-item" onClick={() => navigate('/subscriptions')}>
            <DollarSign size={18} />
            <span>Subscriptions</span>
          </button>
          <div className="nav-section-title">SYSTEM</div>
          <button className="nav-item" onClick={() => navigate('/settings')}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="nav-item" onClick={handleLogOut}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="main-header">
          <div className="breadcrumb">Admin &gt; Manage Shops</div>
          <div className="header-actions">
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
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/systemadmindashboard'); }}>
                      <LayoutDashboard size={18} />
                      <span>Dashboard</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/shoprequests'); }}>
                      <FileText size={18} />
                      <span>Shop Requests</span>
                    </button>
                    <button className="menu-item" onClick={() => { setShowMenuDropdown(false); navigate('/manageshops'); }}>
                      <Store size={18} />
                      <span>Manage Shops</span>
                    </button>
                  </div>

                  <div className="menu-divider"></div>

                  <div className="menu-section">
                    <h4 className="menu-section-title">Settings</h4>
                    <button className="menu-item" onClick={() => navigate('/settings')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="icon-circle calculator">
              <Calculator size={16} />
            </div>
            <div className="icon-circle bell">
              <Bell size={16} />
            </div>
            
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
                      <h4 className="profile-name">{user.name || 'Admin'}</h4>
                      <p className="profile-role">{user.role || 'System Admin'}</p>
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
                    <button className="profile-action-btn" onClick={() => navigate('/settings')}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                    <button className="profile-action-btn logout-btn" onClick={handleLogOut}>
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>All Status</option>
            </select>
            <select 
              className="filter-select"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
            >
              <option>All Packages</option>
              <option>Starter</option>
              <option>Professional</option>
              <option>Enterprise</option>
            </select>
          </div>

          <div className="page-header">
            <h1 className="page-title">Manage Shops</h1>
            <p className="page-subtitle">View and manage all registered shops</p>
          </div>

          {loading ? (
            <div className="loading-state">
              <p>Loading shops...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Store size={32} color="#9ca3af" />
              </div>
              <h3 className="empty-state-title">No shops found</h3>
              <p className="empty-state-text">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="shops-grid">
              {filteredShops.map((shop) => (
                <div key={shop.id} className="shop-card">
                  <div className="shop-card-header">
                    <div className="shop-icon">
                      <Store size={24} color="#6b7280" />
                    </div>
                    <div className="shop-info">
                      <h3 className="shop-name">{shop.name}</h3>
                      <p className="shop-meta">
                        {shop.category || 'Retail Store'} • {shop.package || 'Professional'}
                      </p>
                    </div>
                    <span className={`status-badge ${shop.status === 'Active' ? '' : 'inactive'}`}>
                      {shop.status || 'Active'}
                    </span>
                  </div>

                  <div className="shop-stats">
                    <div className="stat-item">
                      <div className="stat-value">{shop.stores || 3}</div>
                      <div className="stat-label">STORES</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{shop.users || 12}</div>
                      <div className="stat-label">USERS</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{shop.products ? `${(shop.products / 1000).toFixed(1)}K` : '12.5K'}</div>
                      <div className="stat-label">Products</div>
                    </div>
                  </div>

                  <div className="shop-actions">
                    <button className="action-btn-secondary" onClick={() => handleView(shop.id)}>
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                    <button className="action-btn-secondary" onClick={() => handleEdit(shop.id)}>
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                    <button className="action-btn-icon">
                      <MoreVertical size={16} />
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

export default ManageShops;