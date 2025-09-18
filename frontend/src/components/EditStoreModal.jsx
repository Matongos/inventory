import React, { useState, useEffect } from 'react';
import './EditStoreModal.css';

/**
 * Edit Store Modal Component
 * Comprehensive form for editing store information
 * Features: All store fields, validation, image upload, operating hours
 */
const EditStoreModal = ({ 
  store, 
  isOpen, 
  onClose, 
  onStoreUpdated,
  onError,
  onSuccess 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    phone: '',
    email: '',
    manager_name: '',
    image: '',
    timezone: 'UTC',
    operating_hours: '',
    is_active: true,
    opening_date: '',
    square_footage: '',
    customer_rating: 5.0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');

  // Initialize form with store data
  useEffect(() => {
    if (store && isOpen) {
      setFormData({
        name: store.name || '',
        code: store.code || '',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        postal_code: store.postal_code || '',
        country: store.country || 'USA',
        phone: store.phone || '',
        email: store.email || '',
        manager_name: store.manager_name || '',
        image: store.image || '',
        timezone: store.timezone || 'UTC',
        operating_hours: store.operating_hours || '',
        is_active: store.is_active !== undefined ? store.is_active : true,
        opening_date: store.opening_date ? store.opening_date.split('T')[0] : '',
        square_footage: store.square_footage || '',
        customer_rating: store.customer_rating || 5.0
      });
      setImagePreview(store.image || '');
      setErrors({});
    }
  }, [store, isOpen]);

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll use a URL for the image
      // In a real app, you'd upload to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setImagePreview(imageUrl);
        handleChange('image', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Store code is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Square footage validation
    if (formData.square_footage && formData.square_footage < 0) {
      newErrors.square_footage = 'Square footage must be positive';
    }

    // Rating validation
    if (formData.customer_rating < 1 || formData.customer_rating > 5) {
      newErrors.customer_rating = 'Rating must be between 1 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/stores/${store.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess('Store updated successfully!');
        onStoreUpdated(data.store);
        onClose();
      } else {
        const errorData = await response.json();
        onError(errorData.error || 'Failed to update store');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      onError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content edit-store-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Edit Store: {store?.name}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="store-form">
            
            {/* Store Image Section */}
            <div className="form-section">
              <h3 className="section-title">Store Image</h3>
              <div className="image-upload-section">
                <div className="image-preview">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Store preview" 
                      className="store-image-preview"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <span className="placeholder-icon">🏪</span>
                      <span>No image</span>
                    </div>
                  )}
                </div>
                <div className="image-upload-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    id="store-image"
                  />
                  <label htmlFor="store-image" className="btn btn-secondary">
                    📷 Choose Image
                  </label>
                  <input
                    type="url"
                    placeholder="Or enter image URL"
                    value={formData.image}
                    onChange={(e) => {
                      handleChange('image', e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    className="image-url-input"
                  />
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Store Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`form-input ${errors.name ? 'error' : ''}`}
                    placeholder="Enter store name"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Store Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    className={`form-input ${errors.code ? 'error' : ''}`}
                    placeholder="ST001"
                    maxLength="10"
                  />
                  {errors.code && <span className="error-text">{errors.code}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Manager Name</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => handleChange('manager_name', e.target.value)}
                    className="form-input"
                    placeholder="Enter manager name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.value === 'true')}
                    className="form-input"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="form-section">
              <h3 className="section-title">Location</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={`form-input ${errors.address ? 'error' : ''}`}
                    placeholder="Enter full address"
                  />
                  {errors.address && <span className="error-text">{errors.address}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={`form-input ${errors.city ? 'error' : ''}`}
                    placeholder="Enter city"
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className={`form-input ${errors.state ? 'error' : ''}`}
                    placeholder="Enter state"
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    className="form-input"
                    placeholder="Enter postal code"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className={`form-input ${errors.country ? 'error' : ''}`}
                  >
                    <option value="USA">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.country && <span className="error-text">{errors.country}</span>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <h3 className="section-title">Contact Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && <span className="error-text">{errors.phone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="store@example.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="form-input"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Store Details */}
            <div className="form-section">
              <h3 className="section-title">Store Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Opening Date</label>
                  <input
                    type="date"
                    value={formData.opening_date}
                    onChange={(e) => handleChange('opening_date', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Square Footage</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.square_footage}
                    onChange={(e) => handleChange('square_footage', e.target.value)}
                    className={`form-input ${errors.square_footage ? 'error' : ''}`}
                    placeholder="2000"
                  />
                  {errors.square_footage && <span className="error-text">{errors.square_footage}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Rating</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.customer_rating}
                    onChange={(e) => handleChange('customer_rating', parseFloat(e.target.value))}
                    className={`form-input ${errors.customer_rating ? 'error' : ''}`}
                  />
                  {errors.customer_rating && <span className="error-text">{errors.customer_rating}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Operating Hours</label>
                  <textarea
                    value={formData.operating_hours}
                    onChange={(e) => handleChange('operating_hours', e.target.value)}
                    className="form-input"
                    placeholder="Mon-Fri: 9:00 AM - 9:00 PM&#10;Sat-Sun: 10:00 AM - 8:00 PM"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Store'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditStoreModal;


