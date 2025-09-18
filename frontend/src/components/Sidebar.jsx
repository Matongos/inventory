import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout, hasPermission }) => {
  const location = useLocation();

  // Base navigation items available to all users
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', permission: 'view' },
    { name: 'Products', href: '/products', icon: '📦', permission: 'view' },
    { name: 'Categories', href: '/categories', icon: '🏷️', permission: 'view' },
    { name: 'Stores', href: '/stores', icon: '🏪', permission: 'view' },
  ];

  // Additional navigation items based on permissions
  const conditionalNavigation = [
    { 
      name: 'Finance', 
      href: '/finance', 
      icon: '💰', 
      permission: 'view' // All users can access finance
    },
    { 
      name: 'Users', 
      href: '/users', 
      icon: '👥', 
      permission: 'admin',
      condition: () => hasPermission('admin') // Only superuser can manage users
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: '⚙️', 
      permission: 'view'
    },
  ];

  // Filter navigation based on permissions
  const navigation = [
    ...baseNavigation.filter(item => hasPermission(item.permission)),
    ...conditionalNavigation.filter(item => 
      item.condition ? item.condition() : hasPermission(item.permission)
    )
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Inventory</h1>
        <p className="sidebar-subtitle">Management System</p>
      </div>

      <nav>
        <ul className="sidebar-nav">
          {navigation.map((item) => (
            <li key={item.name} className="sidebar-nav-item">
              <Link
                to={item.href}
                className={`sidebar-nav-link ${
                  location.pathname === item.href ? 'active' : ''
                }`}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <div className="card" style={{ margin: 0, padding: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
