import React, { useState, useRef } from 'react';
import './Settings.css';

/**
 * Settings Component
 * Essential system settings: Data import, theme switching, and backup
 * Features: CSV import for stock, theme switcher, system backup
 */
const Settings = ({ user, hasPermission }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem('app-theme') || 'violet'
  );
  
  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Handle file selection for import
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setImportFile(file);
    setError('');
    
    // For CSV files, show preview
    if (fileExtension === '.csv') {
      previewCSVFile(file);
    }
  };

  /**
   * Preview CSV file content
   */
  const previewCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\n').slice(0, 6); // Show first 5 rows + header
      const preview = lines.map(line => line.split(','));
      setImportPreview(preview);
      setShowImportPreview(true);
    };
    reader.readAsText(file);
  };

  /**
   * Handle data import
   */
  const handleImportData = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('import_type', 'stock'); // Could be 'products', 'inventory', etc.

      const response = await fetch('http://localhost:5000/api/settings/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Successfully imported ${data.imported_count} records!`);
        setImportFile(null);
        setImportPreview([]);
        setShowImportPreview(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to import data');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle theme change
   */
  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('app-theme', theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeNames = {
      'purple': 'Purple',
      'blackwhite': 'Black & White',
      'violet': 'Violet Gradient'
    };
    
    setSuccessMessage(`Theme changed to ${themeNames[theme] || theme}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  /**
   * Handle system backup
   */
  const handleBackupData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/settings/backup', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
        link.download = `inventory-backup-${timestamp}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSuccessMessage('Backup downloaded successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Backup error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear messages
   */
  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="page-container settings-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">System configuration and data management</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {successMessage}
          <button className="alert-close" onClick={clearMessages}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
          <button className="alert-close" onClick={clearMessages}>×</button>
        </div>
      )}

      {/* Settings Sections */}
      <div className="settings-sections">
        
        {/* Data Import Section */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">📁</div>
            <div className="card-info">
              <h3 className="card-title">Import Data</h3>
              <p className="card-description">Import new stock and inventory data from CSV or Excel files</p>
            </div>
          </div>
          
          <div className="card-content">
            <div className="import-section">
              <div className="file-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="file-input"
                  id="import-file"
                />
                <label htmlFor="import-file" className="file-upload-label">
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">
                    <strong>Choose file to import</strong>
                    <p>CSV, Excel (.csv, .xlsx, .xls)</p>
                  </div>
                </label>
              </div>

              {importFile && (
                <div className="selected-file">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{importFile.name}</span>
                    <span className="file-size">({(importFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleImportData}
                    disabled={loading}
                  >
                    {loading ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              )}

              {/* CSV Preview */}
              {showImportPreview && importPreview.length > 0 && (
                <div className="import-preview">
                  <h4>File Preview (first 5 rows):</h4>
                  <div className="preview-table">
                    <table>
                      <thead>
                        <tr>
                          {importPreview[0]?.map((header, index) => (
                            <th key={index}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(1).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="import-help">
                <h4>Import Format Requirements:</h4>
                <ul>
                  <li><strong>Product Name</strong> - Required field</li>
                  <li><strong>Product Code</strong> - Unique identifier</li>
                  <li><strong>Quantity</strong> - Stock amount</li>
                  <li><strong>Price</strong> - Selling price</li>
                  <li><strong>Category</strong> - Product category</li>
                  <li><strong>Store</strong> - Store location (optional)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">🎨</div>
            <div className="card-info">
              <h3 className="card-title">Theme Settings</h3>
              <p className="card-description">Choose your preferred color theme</p>
            </div>
          </div>
          
          <div className="card-content">
            <div className="theme-options">
              <div 
                className={`theme-option ${currentTheme === 'purple' ? 'active' : ''}`}
                onClick={() => handleThemeChange('purple')}
              >
                <div className="theme-preview purple-theme">
                  <div className="theme-color primary"></div>
                  <div className="theme-color secondary"></div>
                  <div className="theme-color accent"></div>
                </div>
                <div className="theme-info">
                  <h4>Purple Theme</h4>
                  <p>Modern purple with vibrant accents</p>
                </div>
                {currentTheme === 'purple' && <div className="theme-check">✓</div>}
              </div>

              <div 
                className={`theme-option ${currentTheme === 'blackwhite' ? 'active' : ''}`}
                onClick={() => handleThemeChange('blackwhite')}
              >
                <div className="theme-preview blackwhite-theme">
                  <div className="theme-color black"></div>
                  <div className="theme-color gray"></div>
                  <div className="theme-color white"></div>
                </div>
                <div className="theme-info">
                  <h4>Black & White</h4>
                  <p>Clean monochrome design</p>
                </div>
                {currentTheme === 'blackwhite' && <div className="theme-check">✓</div>}
              </div>

              <div 
                className={`theme-option ${currentTheme === 'violet' ? 'active' : ''}`}
                onClick={() => handleThemeChange('violet')}
              >
                <div className="theme-preview violet-theme">
                  <div className="theme-color violet-primary"></div>
                  <div className="theme-color violet-secondary"></div>
                  <div className="theme-color violet-accent"></div>
                </div>
                <div className="theme-info">
                  <h4>Violet Gradient</h4>
                  <p>Beautiful violet gradient design</p>
                </div>
                {currentTheme === 'violet' && <div className="theme-check">✓</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Backup Section */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">💾</div>
            <div className="card-info">
              <h3 className="card-title">Data Backup</h3>
              <p className="card-description">Create a backup of all your system data</p>
            </div>
          </div>
          
          <div className="card-content">
            <div className="backup-section">
              <div className="backup-info">
                <h4>What will be backed up:</h4>
                <ul>
                  <li>✅ All products and inventory</li>
                  <li>✅ Categories and stores</li>
                  <li>✅ Sales and transaction data</li>
                  <li>✅ User accounts and settings</li>
                  <li>✅ System configuration</li>
                </ul>
              </div>

              <div className="backup-actions">
                <button
                  className="btn btn-primary backup-btn"
                  onClick={handleBackupData}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <span className="backup-icon">💾</span>
                      Download Backup
                    </>
                  )}
                </button>
                
                <div className="backup-note">
                  <p><strong>Note:</strong> Backup files are in JSON format and can be used to restore your data if needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="settings-card">
          <div className="card-header">
            <div className="card-icon">ℹ️</div>
            <div className="card-info">
              <h3 className="card-title">System Information</h3>
              <p className="card-description">Current system status and information</p>
            </div>
          </div>
          
          <div className="card-content">
            <div className="system-info">
              <div className="info-item">
                <span className="info-label">Version:</span>
                <span className="info-value">v1.0.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Current User:</span>
                <span className="info-value">{user?.name || 'Unknown'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Role:</span>
                <span className="info-value role-badge">{user?.role || 'user'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Login:</span>
                <span className="info-value">
                  {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;