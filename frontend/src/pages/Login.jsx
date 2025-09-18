import React, { useState } from 'react';

/**
 * Login Page Component
 * Handles user authentication with enhanced error handling and user feedback
 * Includes demo credentials and connection status indicators
 */
const Login = ({ onLogin }) => {
  // Form state
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'admin123'
  });
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form input changes
   * Clears error messages when user starts typing
   */
  const handleChange = (e) => {
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Validate form data before submission
   */
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission with enhanced error handling
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login
        onLogin(data.user);
      } else {
        // Handle different error types
        switch (response.status) {
          case 401:
            setError('Invalid username or password');
            break;
          case 400:
            setError(data.error || 'Please check your input');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(data.error || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      // Network or connection errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
      } else {
        setError('Connection error. Please check your internet connection and try again.');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fill form with demo credentials
   */
  const useDemoCredentials = () => {
    setFormData({
      username: 'admin',
      password: 'admin123'
    });
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 50%, #7C3AED 100%)',
      padding: '2rem',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <div style={{ 
        width: '400px', 
        maxWidth: '90vw',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'white',
            marginBottom: '0.5rem',
            letterSpacing: '-0.025em'
          }}>
            Inventor.io
          </h1>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            color: '#FEE2E2',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white'
            }} htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Insert username"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                color: '#374151',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'white'
            }} htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Insert password"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  paddingRight: '3rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#6B7280'
                }}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{ 
              width: '100%',
              padding: '0.875rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#7C3AED',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span>🔄</span>
                Signing in...
              </span>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        {/* Demo Credentials Section - Hidden for clean design */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <strong style={{ color: 'white' }}>Demo Credentials:</strong>
            <button
              type="button"
              onClick={useDemoCredentials}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              disabled={loading}
            >
              Use Demo
            </button>
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem' }}>
            Username: <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', color: 'white' }}>admin</code><br />
            Password: <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', color: 'white' }}>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
