import React, { useState, useEffect } from 'react';
import EditStoreModal from '../components/EditStoreModal';
import './Stores.css';

/**
 * Stores Management Component
 * Comprehensive store management with grid view, store details, and product listings
 * Features: Store cards, detailed store view, store-specific product filtering
 */
const Stores = () => {
  // State management
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  // Load stores data on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  /**
   * Fetch all stores from the API
   */
  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/stores', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.stores || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch stores');
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch products for a specific store
   */
  const fetchStoreProducts = async (storeId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/stores/${storeId}/products`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStoreProducts(data.products || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch store products');
      }
    } catch (error) {
      console.error('Error fetching store products:', error);
      setError('Network error. Please try again.');
    }
  };

  /**
   * Handle store selection
   */
  const handleStoreSelect = async (store) => {
    setSelectedStore(store);
    setShowStoreDetails(true);
    await fetchStoreProducts(store.id);
  };

  /**
   * Handle back to stores grid
   */
  const handleBackToStores = () => {
    setShowStoreDetails(false);
    setSelectedStore(null);
    setStoreProducts([]);
  };

  /**
   * Handle edit store
   */
  const handleEditStore = (store) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  /**
   * Handle store updated
   */
  const handleStoreUpdated = (updatedStore) => {
    // Update stores list
    setStores(prevStores => 
      prevStores.map(store => 
        store.id === updatedStore.id ? updatedStore : store
      )
    );
    
    // Update selected store if it's the one being edited
    if (selectedStore && selectedStore.id === updatedStore.id) {
      setSelectedStore(updatedStore);
    }
    
    // Refresh stores data to get latest statistics
    fetchStores();
  };

  /**
   * Handle success message
   */
  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  /**
   * Handle error message
   */
  const handleError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
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
   * Filter stores based on search term
   */
  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading stores...</p>
        </div>
      </div>
    );
  }

  // Show store details view
  if (showStoreDetails && selectedStore) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={handleBackToStores}
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
                ← Back to Stores
              </button>
              <div>
                <h1 className="page-title">{selectedStore.name}</h1>
                <p className="page-subtitle">{selectedStore.full_address}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleEditStore(selectedStore)}
              >
                Edit Store
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Store Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-value">{selectedStore.employees_count || 0}</div>
              <div className="stat-label">Employees</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <div className="stat-value">{selectedStore.total_inventory_items || 0}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🛍️</div>
            <div className="stat-info">
              <div className="stat-value">{selectedStore.unique_products_count || 0}</div>
              <div className="stat-label">Unique Products</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <div className="stat-value">{selectedStore.low_stock_items_count || 0}</div>
              <div className="stat-label">Low Stock Items</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-value">{formatCurrency(selectedStore.total_sales_today || 0)}</div>
              <div className="stat-label">Today's Sales</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-value">{formatCurrency(selectedStore.monthly_revenue || 0)}</div>
              <div className="stat-label">Monthly Revenue</div>
            </div>
          </div>
        </div>

        {/* Store Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Products at {selectedStore.name} ({storeProducts.length})
            </h3>
            <div className="card-actions">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          {storeProducts.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storeProducts
                    .filter(product =>
                      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      product.code.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(product => (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {product.primary_image ? (
                            <img 
                              src={`/api/products/${product.id}/image/${product.primary_image}`}
                              alt={product.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--border-color)'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            style={{ 
                              display: product.primary_image ? 'none' : 'flex',
                              width: '40px',
                              height: '40px',
                              backgroundColor: 'var(--secondary-color)',
                              borderRadius: '0.25rem',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem'
                            }}
                          >
                            📦
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{product.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Code: {product.code} | Brand: {product.brand || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {product.category && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: `${product.category.color}20`,
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem'
                          }}>
                            {product.category.icon} {product.category.name}
                          </span>
                        )}
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
                          {product.is_low_stock && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--warning-color)' }}>
                              Low Stock
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(product)}`}>
                          {getStatusText(product)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-sm"
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button 
                            className="btn btn-sm"
                            title="Edit Product"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Products Found</h3>
              <p>This store doesn't have any products assigned to it yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main stores grid view
  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Stores</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button className="btn btn-primary">
              + Add Store
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Stores Grid */}
      <div className="stores-grid">
        {filteredStores.length > 0 ? filteredStores.map(store => (
          <div 
            key={store.id} 
            className="store-card"
            onClick={() => handleStoreSelect(store)}
          >
            <div className="store-image">
              {store.image ? (
                <img 
                  src={store.image} 
                  alt={store.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="store-image-placeholder"
                style={{ display: store.image ? 'none' : 'flex' }}
              >
                <span className="placeholder-icon">🏪</span>
              </div>
            </div>
            <div className="store-info">
              <h3 className="store-name">{store.name}</h3>
              <p className="store-location">{store.city}, {store.state}</p>
              <div className="store-stats">
                <div className="store-stat">
                  <span className="stat-icon">👥</span>
                  <span className="stat-text">{store.employees_count || 0} employees</span>
                </div>
                <div className="store-stat">
                  <span className="stat-icon">📦</span>
                  <span className="stat-text">{store.total_inventory_items || 0} items</span>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="no-stores">
            <div className="no-stores-icon">🏪</div>
            <h3>No Stores Found</h3>
            <p>{searchTerm ? 'No stores match your search criteria.' : 'No stores available. Click "Add Store" to create your first store.'}</p>
          </div>
        )}
      </div>

      {/* Edit Store Modal */}
      <EditStoreModal
        store={editingStore}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingStore(null);
        }}
        onStoreUpdated={handleStoreUpdated}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );

  // Helper functions
  function getStatusBadgeClass(product) {
    if (!product.is_active) return 'status-inactive';
    if (product.is_out_of_stock) return 'status-out-of-stock';
    if (product.is_low_stock) return 'status-low-stock';
    return 'status-active';
  }

  function getStatusText(product) {
    if (!product.is_active) return 'Inactive';
    if (product.is_out_of_stock) return 'Out of Stock';
    if (product.is_low_stock) return 'Low Stock';
    return 'In Stock';
  }
};

export default Stores;