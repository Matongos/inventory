import React, { useState, useEffect } from 'react';
import './ProductDetailsModal.css';

const ProductDetailsModal = ({ productId, product: productProp, isOpen, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch product details when modal opens or use provided product
  useEffect(() => {
    if (isOpen) {
      if (productProp) {
        // If product is provided as prop, use it directly
        console.log('Using provided product:', productProp); // Debug log
        setProduct(productProp);
        setLoading(false);
        setError(''); // Clear any previous errors
      } else if (productId) {
        // If only productId is provided, fetch the product
        console.log('Fetching product with ID:', productId); // Debug log
        fetchProductDetails();
      } else {
        setError('No product ID or product data provided');
        setLoading(false);
      }
    } else {
      // Reset state when modal closes
      setProduct(null);
      setError('');
      setActiveTab('overview');
    }
  }, [isOpen, productId, productProp]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Product API response:', data); // Debug log
        // The API returns the product directly, not nested in a 'product' property
        setProduct(data);
      } else {
        const errorData = await response.json();
        console.error('Product API error:', errorData); // Debug log
        setError(errorData.error || errorData.message || 'Failed to fetch product details');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (product) => {
    if (!product) return '';
    if (product.status !== 'active') return 'status-inactive';
    if (product.is_out_of_stock) return 'status-out-of-stock';
    if (product.is_low_stock) return 'status-low-stock';
    return 'status-active';
  };

  const getStatusText = (product) => {
    if (!product) return '';
    if (product.status !== 'active') return 'Inactive';
    if (product.is_out_of_stock) return 'Out of Stock';
    if (product.is_low_stock) return 'Low Stock';
    return 'In Stock';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-details-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Product Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading product details...</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {product && (
            <div className="product-details-content">
              {/* Product Header */}
              <div className="product-header">
                <div className="product-image-section">
                  {product.primary_image ? (
                    <img 
                      src={`http://localhost:5000/api/products/${product.id}/image/${product.primary_image}`} 
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="product-image-placeholder"
                    style={{ display: product.primary_image ? 'none' : 'flex' }}
                  >
                    <span className="placeholder-icon">📦</span>
                    <span>No Image</span>
                  </div>
                </div>
                
                <div className="product-basic-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.short_description || 'No description available'}</p>
                  
                  <div className="product-meta">
                    <div className="meta-item">
                      <span className="meta-label">Code:</span>
                      <span className="meta-value code">{product.code}</span>
                    </div>
                    {product.barcode && (
                      <div className="meta-item">
                        <span className="meta-label">Barcode:</span>
                        <span className="meta-value code">{product.barcode}</span>
                      </div>
                    )}
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`status-badge ${getStatusBadgeClass(product)}`}>
                        {getStatusText(product)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs-navigation">
                <button 
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-button ${activeTab === 'pricing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pricing')}
                >
                  Pricing
                </button>
                <button 
                  className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  Inventory
                </button>
                <button 
                  className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                          <div className="stat-value">{product.total_stock || 0}</div>
                          <div className="stat-label">Total Stock</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                          <div className="stat-value">{formatCurrency(product.total_sales_value || 0)}</div>
                          <div className="stat-label">Total Sales</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                          <div className="stat-value">{product.total_units_sold || 0}</div>
                          <div className="stat-label">Units Sold</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                          <div className="stat-value">{(product.profit_margin || 0).toFixed(1)}%</div>
                          <div className="stat-label">Profit Margin</div>
                        </div>
                      </div>
                    </div>

                    {product.category && (
                      <div className="category-info">
                        <h4>Category</h4>
                        <div className="category-badge">
                          <span className="category-icon" style={{ color: product.category.color }}>
                            {product.category.icon}
                          </span>
                          <span className="category-name">{product.category.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div className="pricing-tab">
                    <div className="pricing-grid">
                      <div className="price-item">
                        <div className="price-label">Selling Price</div>
                        <div className="price-value primary">{formatCurrency(product.selling_price)}</div>
                      </div>
                      {product.cost_price > 0 && (
                        <div className="price-item">
                          <div className="price-label">Cost Price</div>
                          <div className="price-value">{formatCurrency(product.cost_price)}</div>
                        </div>
                      )}
                      {product.msrp > 0 && (
                        <div className="price-item">
                          <div className="price-label">MSRP</div>
                          <div className="price-value">{formatCurrency(product.msrp)}</div>
                        </div>
                      )}
                      {product.profit_amount > 0 && (
                        <div className="price-item">
                          <div className="price-label">Profit per Unit</div>
                          <div className="price-value profit">{formatCurrency(product.profit_amount)}</div>
                        </div>
                      )}
                      {product.average_sale_price > 0 && (
                        <div className="price-item">
                          <div className="price-label">Average Sale Price</div>
                          <div className="price-value">{formatCurrency(product.average_sale_price)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'inventory' && (
                  <div className="inventory-tab">
                    <div className="inventory-summary">
                      <div className="inventory-item">
                        <span className="inventory-label">Total Stock:</span>
                        <span className="inventory-value">{product.total_stock || 0} units</span>
                      </div>
                      <div className="inventory-item">
                        <span className="inventory-label">Available Stock:</span>
                        <span className="inventory-value">{product.available_stock || product.total_stock || 0} units</span>
                      </div>
                      {product.min_stock_level > 0 && (
                        <div className="inventory-item">
                          <span className="inventory-label">Min Stock Level:</span>
                          <span className="inventory-value">{product.min_stock_level} units</span>
                        </div>
                      )}
                      {product.max_stock_level > 0 && (
                        <div className="inventory-item">
                          <span className="inventory-label">Max Stock Level:</span>
                          <span className="inventory-value">{product.max_stock_level} units</span>
                        </div>
                      )}
                    </div>

                    {/* Store Availability Section */}
                    <div className="store-availability">
                      <h4>🏪 Store Availability</h4>
                      {product.inventory && product.inventory.length > 0 ? (
                        <div className="stores-grid">
                          {product.inventory.map((store, index) => (
                            <div key={index} className={`store-card ${store.is_low_stock ? 'low-stock' : ''} ${store.quantity <= 0 ? 'out-of-stock' : ''}`}>
                              <div className="store-header">
                                <div className="store-name">
                                  <span className="store-icon">🏪</span>
                                  {store.store_name}
                                </div>
                                <div className={`stock-status ${store.quantity <= 0 ? 'out-of-stock' : store.is_low_stock ? 'low-stock' : 'in-stock'}`}>
                                  {store.quantity <= 0 ? 'Out of Stock' : store.is_low_stock ? 'Low Stock' : 'In Stock'}
                                </div>
                              </div>
                              
                              <div className="store-details">
                                <div className="stock-info">
                                  <div className="stock-item">
                                    <span className="label">Current Stock:</span>
                                    <span className="value">{store.quantity} units</span>
                                  </div>
                                  <div className="stock-item">
                                    <span className="label">Min Stock:</span>
                                    <span className="value">{store.min_stock} units</span>
                                  </div>
                                  {store.last_updated && (
                                    <div className="stock-item">
                                      <span className="label">Last Updated:</span>
                                      <span className="value">{formatDate(store.last_updated)}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Stock Level Visual Indicator */}
                                <div className="stock-level-bar">
                                  <div 
                                    className="stock-level-fill"
                                    style={{ 
                                      width: `${Math.min(100, (store.quantity / Math.max(store.min_stock * 3, 1)) * 100)}%`,
                                      backgroundColor: store.quantity <= 0 ? '#DC2626' : store.is_low_stock ? '#F59E0B' : '#059669'
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-inventory">
                          <span className="no-inventory-icon">📭</span>
                          <p>No inventory data available for any stores</p>
                        </div>
                      )}
                    </div>

                    {/* Low Stock Alert */}
                    {product.low_stock_stores && product.low_stock_stores.length > 0 && (
                      <div className="low-stock-alert">
                        <h4>⚠️ Low Stock Alert</h4>
                        <p>This product is running low in {product.low_stock_stores.length} store(s):</p>
                        <div className="alert-stores">
                          {product.low_stock_stores.map((store, index) => (
                            <span key={index} className="alert-store">{store}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="details-tab">
                    <div className="details-grid">
                      {product.brand && (
                        <div className="detail-item">
                          <span className="detail-label">Brand:</span>
                          <span className="detail-value">{product.brand}</span>
                        </div>
                      )}
                      {product.model && (
                        <div className="detail-item">
                          <span className="detail-label">Model:</span>
                          <span className="detail-value">{product.model}</span>
                        </div>
                      )}
                      {product.weight && (
                        <div className="detail-item">
                          <span className="detail-label">Weight:</span>
                          <span className="detail-value">{product.weight}</span>
                        </div>
                      )}
                      {product.dimensions && (
                        <div className="detail-item">
                          <span className="detail-label">Dimensions:</span>
                          <span className="detail-value">{product.dimensions}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Track Inventory:</span>
                        <span className="detail-value">{product.track_inventory ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Allow Backorder:</span>
                        <span className="detail-value">{product.allow_backorder ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(product.created_at)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Last Updated:</span>
                        <span className="detail-value">{formatDate(product.updated_at)}</span>
                      </div>
                    </div>

                    {product.tags && product.tags.length > 0 && (
                      <div className="tags-section">
                        <h4>Tags</h4>
                        <div className="tags-list">
                          {product.tags.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.description && (
                      <div className="description-section">
                        <h4>Description</h4>
                        <p className="product-description-full">{product.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {product && (
            <button className="btn btn-primary" onClick={() => {
              // TODO: Open edit modal
              console.log('Edit product:', product.id);
            }}>
              Edit Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;

