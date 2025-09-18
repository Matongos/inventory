import React, { useState, useEffect } from 'react';
import AddProductForm from '../components/AddProductForm';
import ProductDetailsModal from '../components/ProductDetailsModal';

/**
 * Products Page Component
 * Main interface for product management with CRUD operations
 */
const Products = ({ user, hasPermission }) => {
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Form data for creating products
  const [productFormData, setProductFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    description: '',
    brand: '',
    category_id: '',
    selling_price: '',
    cost_price: '',
    weight: '',
    initial_quantity: '',
    min_stock_level: '10',
    create_inventory: false
  });

  // Load data on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory, statusFilter]);

  /**
   * Fetch products with filters and pagination
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category_id: selectedCategory }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`http://localhost:5000/api/products?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setPagination(data.pagination || {});
        setError('');
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch categories for the dropdown
   */
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/categories', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  /**
   * Handle form input changes for product creation
   */
  const handleFormChange = (field, value) => {
    setProductFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle product creation
   */
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(productFormData)
      });

      if (response.ok) {
        setSuccess('Product created successfully!');
        setShowCreateForm(false);
        resetProductForm();
        fetchProducts(); // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset product form data
   */
  const resetProductForm = () => {
    setProductFormData({
      name: '',
      code: '',
      barcode: '',
      description: '',
      brand: '',
      category_id: '',
      selling_price: '',
      cost_price: '',
      weight: '',
      initial_quantity: '',
      min_stock_level: '10',
      create_inventory: false
    });
  };

  /**
   * Handle product selection for details modal
   */
  const handleProductSelect = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const productData = await response.json();
        setSelectedProduct(productData);
        setShowDetailsModal(true);
      } else {
        throw new Error('Failed to fetch product details');
      }
    } catch (err) {
      setError('Failed to load product details');
    }
  };

  /**
   * Format currency values
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (product) => {
    if (!product.is_active) {
      return { text: 'Inactive', color: '#DC2626', bg: '#FEE2E2' };
    }
    if (product.is_out_of_stock) {
      return { text: 'Out of Stock', color: '#DC2626', bg: '#FEE2E2' };
    }
    if (product.is_low_stock) {
      return { text: 'Low Stock', color: '#D97706', bg: '#FEF3C7' };
    }
    return { text: 'Active', color: '#059669', bg: '#D1FAE5' };
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Page Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            Products
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            margin: '0.5rem 0 0 0',
            fontSize: '1rem'
          }}>
            Manage your product inventory and catalog
          </p>
        </div>

        {hasPermission('create') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>+</span>
            Add Product
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#D1FAE5',
          color: '#047857',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #A7F3D0'
        }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #FECACA'
        }}>
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr 1fr 1fr', 
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search products by name, code, or barcode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Results Count */}
          <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {pagination.total ? `${pagination.total} products` : ''}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color)'
      }}>
        {loading ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No products found</h3>
            <p>Start by adding your first product to the inventory.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
              padding: '1rem 1.5rem',
              backgroundColor: '#F9FAFB',
              fontWeight: '600',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>Product</div>
              <div>Category</div>
              <div>Price</div>
              <div>Stock</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            <div>
              {products.map((product, index) => {
                const status = getStatusBadge(product);
                return (
                  <div
                    key={product.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                      padding: '1rem 1.5rem',
                      borderBottom: index < products.length - 1 ? '1px solid var(--border-color)' : 'none',
                      alignItems: 'center'
                    }}
                  >
                    {/* Product Info */}
                    <div>
                      <div style={{ 
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {product.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        Code: {product.code}
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      {product.category ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem'
                        }}>
                          <span>{product.category.icon}</span>
                          {product.category.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          No category
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div style={{ fontWeight: '500' }}>
                      {formatCurrency(product.selling_price)}
                    </div>

                    {/* Stock */}
                    <div>
                      <div style={{ fontWeight: '500' }}>
                        {product.total_stock || 0}
                      </div>
                      {product.is_low_stock && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#D97706',
                          marginTop: '0.25rem'
                        }}>
                          Low stock
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: status.bg,
                        color: status.color
                      }}>
                        {status.text}
                      </span>
                    </div>

                    {/* Actions */}
                    <div>
                      <button
                        onClick={() => handleProductSelect(product.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--secondary-color)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!pagination.has_prev}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
              opacity: pagination.has_prev ? 1 : 0.5
            }}
          >
            Previous
          </button>

          <span style={{ 
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            margin: '0 1rem'
          }}>
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!pagination.has_next}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              cursor: pagination.has_next ? 'pointer' : 'not-allowed',
              opacity: pagination.has_next ? 1 : 0.5
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Product Form Modal */}
      <AddProductForm
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        productFormData={productFormData}
        handleFormChange={handleFormChange}
        handleCreateProduct={handleCreateProduct}
        resetProductForm={resetProductForm}
        categories={categories}
        loading={loading}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
          hasPermission={hasPermission}
          onProductUpdate={fetchProducts}
        />
      )}
    </div>
  );
};

export default Products;

