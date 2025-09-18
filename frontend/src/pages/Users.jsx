import React, { useState, useEffect } from 'react';

/**
 * Users Management Page
 * Allows admin users to view, create, edit, and manage user accounts
 * Features role-based access control and user filtering
 */
const Users = ({ user, hasPermission }) => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    role: 'user', // Default to 'user' instead of 'employee'
    store_id: '',
    is_active: true
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1
  });

  useEffect(() => {
    // Load initial data
    fetchUsers();
    fetchRoles();
  }, [filters]);

  /**
   * Fetch users from the backend with current filters
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      params.append('page', filters.page);
      params.append('per_page', 10);

      const response = await fetch(`http://localhost:5000/api/users?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch available user roles and their descriptions
   */
  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/roles', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Fetch roles error:', error);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      role: 'user', // Default to 'user'
      store_id: '',
      is_active: true
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  /**
   * Handle create new user
   */
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User created successfully');
        resetForm();
        fetchUsers(); // Refresh user list
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.error('Create user error:', error);
    }
  };

  /**
   * Handle edit user
   */
  const handleEditUser = (userToEdit) => {
    setFormData({
      username: userToEdit.username,
      password: '', // Don't pre-fill password for security
      name: userToEdit.name,
      email: userToEdit.email,
      phone: userToEdit.phone || '',
      role: userToEdit.role,
      store_id: userToEdit.store_id || '',
      is_active: userToEdit.is_active
    });
    setEditingUser(userToEdit);
    setShowCreateForm(true);
  };

  /**
   * Handle update user
   */
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Don't send password if it's empty
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User updated successfully');
        resetForm();
        fetchUsers(); // Refresh user list
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.error('Update user error:', error);
    }
  };

  /**
   * Handle deactivate user
   */
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User deactivated successfully');
        fetchUsers(); // Refresh user list
      } else {
        setError(data.error || 'Failed to deactivate user');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.error('Deactivate user error:', error);
    }
  };

  /**
   * Get role badge styling based on role
   * Simplified to only superuser and user
   */
  const getRoleBadgeClass = (role) => {
    const roleStyles = {
      'superuser': 'status-badge role-superuser',
      'user': 'status-badge role-user'
    };
    return roleStyles[role] || 'status-badge role-user';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage user accounts and permissions</p>
      </div>

      {/* Success/Error Messages */}
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Filters and Actions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Search Filter */}
            <div>
              <input
                type="text"
                name="search"
                placeholder="Search users..."
                value={filters.search}
                onChange={handleFilterChange}
                className="form-input"
                style={{ width: '200px' }}
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="">All Roles</option>
                {Object.entries(roles).map(([roleKey, roleInfo]) => (
                  <option key={roleKey} value={roleKey}>
                    {roleInfo.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create User Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            + Create User
          </button>
        </div>
      </div>

      {/* Create/Edit User Form */}
      {showCreateForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            <button
              onClick={resetForm}
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              {/* Username */}
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  disabled={editingUser} // Don't allow username changes
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  required={!editingUser}
                  placeholder={editingUser ? "Leave blank to keep current password" : ""}
                />
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label" htmlFor="role">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  {Object.entries(roles).map(([roleKey, roleInfo]) => (
                    <option key={roleKey} value={roleKey}>
                      {roleInfo.name} - {roleInfo.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Status */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span className="form-label" style={{ margin: 0 }}>
                  Active Account
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Users ({users.length})</h3>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{userItem.name}</div>
                        {userItem.phone && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {userItem.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{userItem.username}</td>
                    <td>{userItem.email}</td>
                    <td>
                      <span className={getRoleBadgeClass(userItem.role)}>
                        {roles[userItem.role]?.name || userItem.role}
                      </span>
                    </td>
                    <td>
                      <span className={userItem.is_active ? 'status-active' : 'status-sold-out'}>
                        {userItem.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {userItem.last_login ? (
                        new Date(userItem.last_login).toLocaleDateString()
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEditUser(userItem)}
                          className="btn btn-secondary btn-sm"
                          disabled={userItem.role === 'superuser' && user.role !== 'superuser'}
                        >
                          Edit
                        </button>
                        {userItem.role !== 'superuser' && userItem.id !== user.id && (
                          <button
                            onClick={() => handleDeactivateUser(userItem.id)}
                            className="btn btn-sm"
                            style={{ 
                              backgroundColor: 'var(--error-color)', 
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
