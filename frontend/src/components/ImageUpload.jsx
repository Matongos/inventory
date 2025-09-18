import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ 
  productId, 
  currentImages = [], 
  primaryImage = null, 
  onImageUploaded, 
  onPrimaryImageChanged,
  onImageDeleted,
  maxImages = 5 
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    // Check if we've reached the maximum number of images
    if (currentImages.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const file = files[0]; // Only handle one file at a time
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PNG, JPG, JPEG, GIF, or WEBP images.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    await uploadImage(file);
  };

  // Upload image to backend
  const uploadImage = async (file) => {
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/products/${productId}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (onImageUploaded) {
          onImageUploaded(data);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Set primary image
  const setPrimaryImage = async (filename) => {
    try {
      const response = await fetch(`/api/products/${productId}/set-primary-image`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      });

      if (response.ok) {
        const data = await response.json();
        if (onPrimaryImageChanged) {
          onPrimaryImageChanged(filename);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to set primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      setError('Network error. Please try again.');
    }
  };

  // Delete image
  const deleteImage = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/delete-image`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      });

      if (response.ok) {
        const data = await response.json();
        if (onImageDeleted) {
          onImageDeleted(filename, data.primary_image);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="image-upload-container">
      <div className="image-upload-header">
        <h4>Product Images</h4>
        <span className="image-count">{currentImages.length} / {maxImages}</span>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-dismiss" 
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Image Grid */}
      {currentImages.length > 0 && (
        <div className="images-grid">
          {currentImages.map((filename, index) => (
            <div 
              key={filename} 
              className={`image-item ${primaryImage === filename ? 'primary' : ''}`}
            >
              <div className="image-wrapper">
                <img 
                  src={`/api/products/${productId}/image/${filename}`}
                  alt={`Product image ${index + 1}`}
                  className="product-image-thumb"
                />
                
                {primaryImage === filename && (
                  <div className="primary-badge">Primary</div>
                )}

                <div className="image-actions">
                  {primaryImage !== filename && (
                    <button
                      className="action-btn primary-btn"
                      onClick={() => setPrimaryImage(filename)}
                      title="Set as primary image"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteImage(filename)}
                    title="Delete image"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {currentImages.length < maxImages && (
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div className="upload-progress">
              <div className="loading-spinner"></div>
              <p>Uploading image...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📷</div>
              <p className="upload-text">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <p className="upload-subtext">
                PNG, JPG, JPEG, GIF, WEBP up to 5MB
              </p>
            </div>
          )}
        </div>
      )}

      {currentImages.length === 0 && !uploading && (
        <div className="no-images-message">
          <div className="no-images-icon">🖼️</div>
          <p>No images uploaded yet</p>
          <p className="no-images-subtext">Upload your first product image above</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;


