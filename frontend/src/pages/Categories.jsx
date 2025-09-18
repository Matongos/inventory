import React, { useState, useEffect } from 'react';

/**
 * Categories Management Component
 * Grid-based category management with icons, item counts, and CRUD operations
 * Features: Beautiful grid layout, category statistics, add/edit functionality
 */
const Categories = ({ user, hasPermission }) => {
  // State for categories data
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [availableIcons, setAvailableIcons] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  
  // State for UI controls
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for category form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: '📦',
    color: '#6366F1',
    parent_id: null,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    loadCategoriesData();
    loadCategoryStats();
    loadAvailableIcons();
    loadAvailableColors();
  }, []);

  /**
   * Load categories with metrics
   */
  const loadCategoriesData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5000/api/categories', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        throw new Error('Failed to load categories');
      }

    } catch (error) {
      console.error('Categories loading error:', error);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load category statistics
   */
  const loadCategoryStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories/stats', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  /**
   * Load available icons
   */
  const loadAvailableIcons = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories/icons', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableIcons(data.icons);
      }
    } catch (error) {
      console.error('Icons loading error:', error);
    }
  };

  /**
   * Load available colors
   */
  const loadAvailableColors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories/colors', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableColors(data.colors);
      }
    } catch (error) {
      console.error('Colors loading error:', error);
    }
  };

  /**
   * Handle category form changes
   */
  const handleFormChange = (field, value) => {
    setCategoryFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Validate category form
   */
  const validateCategoryForm = () => {
    const errors = [];
    
    if (!categoryFormData.name.trim()) {
      errors.push('Category name is required');
    }
    
    return errors;
  };

  /**
   * Create new category
   */
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateCategoryForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(categoryFormData)
      });

      if (response.ok) {
        setSuccess('Category created successfully!');
        setShowCreateForm(false);
        resetCategoryForm();
        loadCategoriesData();
        loadCategoryStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete category
   */
  const handleDeleteCategory = async (categoryId) => {
    if (!hasPermission('admin')) {
      setError('You do not have permission to delete categories');
      return;
    }

    if (!window.confirm('Are you sure you want to deactivate this category?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Category deactivated successfully!');
        loadCategoriesData();
        loadCategoryStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate category');
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle category selection for details view
   */
  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      setError('');

      // Load detailed category information
      const [categoryResponse, productsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/categories/${category.id}`, {
          credentials: 'include'
        }),
        fetch(`http://localhost:5000/api/products?category_id=${category.id}&per_page=100`, {
          credentials: 'include'
        })
      ]);

      if (categoryResponse.ok && productsResponse.ok) {
        const categoryData = await categoryResponse.json();
        const productsData = await productsResponse.json();
        
        setSelectedCategory(categoryData);
        setCategoryProducts(productsData.products);
        setShowCategoryDetails(true);
      } else {
        throw new Error('Failed to load category details');
      }

    } catch (error) {
      console.error('Category details loading error:', error);
      setError('Failed to load category details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Go back to categories grid view
   */
  const handleBackToCategories = () => {
    setShowCategoryDetails(false);
    setSelectedCategory(null);
    setCategoryProducts([]);
  };

  /**
   * Reset category form
   */
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      icon: '📦',
      color: '#6366F1',
      parent_id: null,
      is_active: true,
      sort_order: 0
    });
    setSelectedCategory(null);
  };

  /**
   * Format currency values
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  /**
   * Get status badge class for products
   */
  const getStatusBadgeClass = (product) => {
    if (!product.is_active) return 'status-badge status-inactive';
    if (product.is_out_of_stock) return 'status-badge status-out-of-stock';
    if (product.is_low_stock) return 'status-badge status-low-stock';
    return 'status-badge status-active';
  };

  /**
   * Get status text for products
   */
  const getStatusText = (product) => {
    if (!product.is_active) return 'Inactive';
    if (product.is_out_of_stock) return 'Out of Stock';
    if (product.is_low_stock) return 'Low Stock';
    return 'Active';
  };

  /**
   * Clear success/error messages
   */
  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Show loading state
  if (loading && categories.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Loading your categories...</p>
        </div>
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  // Show category details view if a category is selected
  if (showCategoryDetails && selectedCategory) {
    return (
      <div>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={handleBackToCategories}
                className="btn"
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--secondary-color)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ← Back to Categories
              </button>
              <div>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem', color: selectedCategory.color }}>{selectedCategory.icon}</span>
                  {selectedCategory.name}
                </h1>
                <p className="page-subtitle">{selectedCategory.description || 'No description available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            {success}
            <button onClick={clearMessages} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.2rem' }}>×</button>
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
            <button onClick={clearMessages} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.2rem' }}>×</button>
          </div>
        )}

        {/* Category Statistics Cards */}
        <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                  {selectedCategory.product_count}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Products
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>📦</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success-color)' }}>
                  {selectedCategory.total_stock}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Total Stock
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>📊</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning-color)' }}>
                  {selectedCategory.low_stock_count}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Low Stock
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                  {formatCurrency(selectedCategory.recent_revenue)}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Revenue (30d)
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>💰</div>
            </div>
          </div>
        </div>

        {/* Category Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Products in {selectedCategory.name} ({categoryProducts.length})
            </h3>
          </div>
          
          {categoryProducts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Code</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600' }}>{product.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Brand: {product.brand || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          backgroundColor: 'var(--secondary-color)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem'
                        }}>
                          {product.code}
                        </span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600' }}>{formatCurrency(product.selling_price)}</div>
                          {product.cost_price > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Cost: {formatCurrency(product.cost_price)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: '600' }}>{product.total_stock}</div>
                          {product.low_stock_stores.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--warning-color)' }}>
                              Low in: {product.low_stock_stores.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(product)}>
                          {getStatusText(product)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Products Yet</h3>
              <p>This category doesn't have any products assigned to it yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-subtitle">
              Last update: {categories.length > 0 ? formatDate(categories[0].updated_at) : 'Never'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600'
            }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {success}
          <button onClick={clearMessages} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.2rem' }}>×</button>
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={clearMessages} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* Categories Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {categories.length > 0 ? categories.map(category => (
          <div 
            key={category.id}
            className="card"
            style={{
              padding: '2rem',
              textAlign: 'center',
              position: 'relative',
              background: `linear-gradient(135deg, ${category.color}15, ${category.color}05)`,
              border: `1px solid ${category.color}30`,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => handleCategorySelect(category)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
          >
            {/* Delete Button for Superusers */}
            {hasPermission('admin') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCategory(category.id);
                }}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem'
                }}
                title="Delete Category"
              >
                ×
              </button>
            )}

            {/* Category Icon */}
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              color: category.color
            }}>
              {category.icon}
            </div>

            {/* Category Name */}
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {category.name}
            </h3>

            {/* Item Count */}
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              marginBottom: '1rem'
            }}>
              {category.product_count} items
            </p>

            {/* Category Stats */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: `1px solid ${category.color}20`
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--success-color)' }}>
                  {category.total_stock}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Stock
                </div>
              </div>
              
              {category.low_stock_count > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--warning-color)' }}>
                    {category.low_stock_count}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Low Stock
                  </div>
                </div>
              )}
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                  ${category.total_revenue.toFixed(0)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Revenue
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📂</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              No Categories Yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Create your first category to organize your products
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem' }}
            >
              Create First Category
            </button>
          </div>
        )}
      </div>

      {/* Add Category Form Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Form Header */}
            <div style={{
              padding: '2rem 2rem 1rem 2rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                Add New Category
              </h2>
              <button 
                onClick={() => { setShowCreateForm(false); resetCategoryForm(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateCategory} style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Name Field */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500'
                  }}>
                    Category Name*
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="Enter category name"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={categoryFormData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Enter category description"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500'
                  }}>
                    Icon
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
                    gap: '0.5rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    {availableIcons.map((iconData, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleFormChange('icon', iconData.icon)}
                        style={{
                          padding: '0.75rem',
                          border: categoryFormData.icon === iconData.icon ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                          borderRadius: '0.5rem',
                          backgroundColor: categoryFormData.icon === iconData.icon ? 'var(--primary-color)10' : 'white',
                          fontSize: '1.5rem',
                          cursor: 'pointer'
                        }}
                        title={iconData.description}
                      >
                        {iconData.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500'
                  }}>
                    Color
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem'
                  }}>
                    {availableColors.map((colorData, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleFormChange('color', colorData.color)}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: categoryFormData.color === colorData.color ? '3px solid var(--text-primary)' : '2px solid var(--border-color)',
                          borderRadius: '50%',
                          backgroundColor: colorData.color,
                          cursor: 'pointer'
                        }}
                        title={colorData.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ 
                marginTop: '2rem', 
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem'
              }}>
                <button 
                  type="button"
                  onClick={() => { setShowCreateForm(false); resetCategoryForm(); }}
                  className="btn"
                  style={{ 
                    padding: '0.75rem 2rem',
                    backgroundColor: 'var(--secondary-color)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ 
                    padding: '0.75rem 2rem',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  {loading ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;