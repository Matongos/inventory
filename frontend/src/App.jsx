import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Stores from './pages/Stores';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Users from './pages/Users';
import './styles/globals.css';

function App() {
  // Authentication state management
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Check if user is logged in on app start
    checkAuthStatus();
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('app-theme') || 'violet';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  /**
   * Check current authentication status with the backend
   * This runs on app startup to restore user session
   */
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/current-user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Clear any stale authentication state
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Authentication check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful login
   * Updates authentication state with user data
   */
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  /**
   * Handle user logout
   * Clears session on backend and frontend
   */
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Check if current user has specific permission
   * Used for role-based access control in UI
   * Simplified system: superuser (full access) and user (standard access)
   */
  const hasPermission = (permission) => {
    if (!user) return false;
    
    const rolePermissions = {
      'superuser': ['view', 'edit', 'create', 'delete', 'admin'],
      'user': ['view', 'edit', 'create']
    };
    
    const userPermissions = rolePermissions[user.role] || ['view'];
    return userPermissions.includes(permission);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background-color)'
      }}>
        <div style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <div className="app">
          <Login onLogin={handleLogin} />
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app">
        <Sidebar user={user} onLogout={handleLogout} hasPermission={hasPermission} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} hasPermission={hasPermission} />} />
            <Route path="/products" element={<Products user={user} hasPermission={hasPermission} />} />
            <Route path="/categories" element={<Categories user={user} hasPermission={hasPermission} />} />
            <Route path="/stores" element={<Stores user={user} hasPermission={hasPermission} />} />
            <Route path="/finance" element={<Finance user={user} hasPermission={hasPermission} />} />
            <Route path="/users" element={
              hasPermission('admin') ? 
                <Users user={user} hasPermission={hasPermission} /> : 
                <Navigate to="/dashboard" replace />
            } />
            <Route path="/settings" element={<Settings user={user} hasPermission={hasPermission} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;