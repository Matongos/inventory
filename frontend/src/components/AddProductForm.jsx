import React from 'react';

/**
 * Add Product Form Component
 * Comprehensive form for creating new products matching the uploaded design
 */
const AddProductForm = ({ 
  showCreateForm, 
  setShowCreateForm, 
  productFormData, 
  handleFormChange, 
  handleCreateProduct, 
  resetProductForm, 
  categories, 
  loading 
}) => {
  
  if (!showCreateForm) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '2rem',
      paddingBottom: '2rem',
      overflowY: 'auto',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Form Header */}
        <div style={{
          padding: '2rem 2rem 1rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Add product
          </h2>
          <button 
            onClick={() => { setShowCreateForm(false); resetProductForm(); }}
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
        <form onSubmit={handleCreateProduct} style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Name Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Name*
                </label>
                <input
                  type="text"
                  value={productFormData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB'
                  }}
                />
              </div>

              {/* Description Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Description
                </label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Enter product description"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Category Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Category*
                </label>
                <select
                  value={productFormData.category_id}
                  onChange={(e) => handleFormChange('category_id', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Price*
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.selling_price}
                  onChange={(e) => handleFormChange('selling_price', e.target.value)}
                  placeholder="0.00"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB'
                  }}
                />
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Item Code Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Item code*
                </label>
                <input
                  type="text"
                  value={productFormData.code}
                  onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                  placeholder="Enter unique item code"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB'
                  }}
                />
              </div>

              {/* Stock Size Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Stock size*
                </label>
                <input
                  type="number"
                  min="0"
                  value={productFormData.initial_quantity}
                  onChange={(e) => {
                    handleFormChange('initial_quantity', e.target.value);
                    handleFormChange('create_inventory', e.target.value > 0);
                  }}
                  placeholder="Enter initial stock quantity"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB'
                  }}
                />
              </div>

              {/* Stores Availability Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Stores availability*
                </label>
                <select
                  value="all"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <option value="all">All stores</option>
                </select>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  marginTop: '0.25rem' 
                }}>
                  Product will be available in all active stores
                </p>
              </div>

              {/* Product Photos Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Product photos*
                </label>
                <div style={{
                  width: '100%',
                  height: '120px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '0.5rem',
                  backgroundColor: '#F9FAFB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>Click to upload photos</p>
                    <p style={{ fontSize: '0.75rem', margin: 0 }}>Image upload coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Fields Section */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Additional Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {/* Brand Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={productFormData.brand}
                  onChange={(e) => handleFormChange('brand', e.target.value)}
                  placeholder="Enter brand name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Barcode Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Barcode
                </label>
                <input
                  type="text"
                  value={productFormData.barcode}
                  onChange={(e) => handleFormChange('barcode', e.target.value)}
                  placeholder="Enter barcode"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Weight Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Weight (g)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={productFormData.weight}
                  onChange={(e) => handleFormChange('weight', e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {/* Cost Price Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Cost Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.cost_price}
                  onChange={(e) => handleFormChange('cost_price', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Min Stock Level Field */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: 'var(--text-primary)'
                }}>
                  Minimum Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={productFormData.min_stock_level}
                  onChange={(e) => handleFormChange('min_stock_level', e.target.value)}
                  placeholder="10"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button 
              type="button"
              onClick={() => { setShowCreateForm(false); resetProductForm(); }}
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
              {loading ? 'Creating...' : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;


