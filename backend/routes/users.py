"""
User Management Routes
Handles CRUD operations for user accounts with role-based access control
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash
from models import User, Store, db
from auth_decorators import require_auth, require_permission

# Create Blueprint for user routes
users_bp = Blueprint('users', __name__)

# =============================================================================
# USER MANAGEMENT ROUTES
# =============================================================================

@users_bp.route('/api/users', methods=['GET'])
@require_permission('admin')
def get_users():
    """
    Get all users with pagination and filtering
    Only accessible by admin/superuser roles
    """
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        role_filter = request.args.get('role', '')
        search = request.args.get('search', '')
        
        # Build query
        query = User.query
        
        # Apply role filter
        if role_filter:
            query = query.filter(User.role == role_filter)
        
        # Apply search filter (name, username, email)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.name.ilike(search_pattern),
                    User.username.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )
        
        # Order by creation date (newest first)
        query = query.order_by(User.created_at.desc())
        
        # Paginate results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Convert users to dict
        users = [user.to_dict() for user in pagination.items]
        
        return jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['GET'])
@require_permission('admin')
def get_user(user_id):
    """
    Get specific user by ID
    Only accessible by admin/superuser roles
    """
    try:
        user = User.query.get_or_404(user_id)
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch user: {str(e)}'}), 500

@users_bp.route('/api/users', methods=['POST'])
@require_permission('admin')
def create_user():
    """
    Create a new user account
    Only accessible by admin/superuser roles
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['username', 'password', 'name', 'email', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate role
        valid_roles = ['superuser', 'user']
        if data['role'] not in valid_roles:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Validate store_id if provided
        store_id = data.get('store_id')
        if store_id:
            store = Store.query.get(store_id)
            if not store:
                return jsonify({'error': 'Invalid store ID'}), 400
        
        # Create new user
        user = User(
            username=data['username'].strip(),
            password=generate_password_hash(data['password']),
            name=data['name'].strip(),
            email=data['email'].strip().lower(),
            role=data['role'],
            phone=data.get('phone', '').strip() or None,
            store_id=store_id,
            is_active=data.get('is_active', True)
        )
        
        # Save to database
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['PUT'])
@require_permission('admin')
def update_user(user_id):
    """
    Update user account
    Only accessible by admin/superuser roles
    """
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Prevent superuser from being modified by non-superusers
        current_user = request.current_user
        if user.role == 'superuser' and current_user.role != 'superuser':
            return jsonify({'error': 'Cannot modify superuser account'}), 403
        
        # Update fields if provided
        if 'name' in data:
            user.name = data['name'].strip()
        
        if 'email' in data:
            email = data['email'].strip().lower()
            # Check if email is already taken by another user
            existing_user = User.query.filter(User.email == email, User.id != user_id).first()
            if existing_user:
                return jsonify({'error': 'Email already exists'}), 409
            user.email = email
        
        if 'phone' in data:
            user.phone = data['phone'].strip() or None
        
        if 'role' in data:
            valid_roles = ['superuser', 'user']
            if data['role'] not in valid_roles:
                return jsonify({'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
            
            # Only superuser can assign superuser role
            if data['role'] == 'superuser' and current_user.role != 'superuser':
                return jsonify({'error': 'Only superuser can assign superuser role'}), 403
                
            user.role = data['role']
        
        if 'store_id' in data:
            store_id = data['store_id']
            if store_id:
                store = Store.query.get(store_id)
                if not store:
                    return jsonify({'error': 'Invalid store ID'}), 400
            user.store_id = store_id
        
        if 'is_active' in data:
            # Prevent deactivating superuser
            if user.role == 'superuser' and not data['is_active']:
                return jsonify({'error': 'Cannot deactivate superuser account'}), 403
            user.is_active = data['is_active']
        
        # Update password if provided
        if 'password' in data and data['password']:
            user.password = generate_password_hash(data['password'])
        
        # Save changes
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500

@users_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
@require_permission('admin')
def delete_user(user_id):
    """
    Delete user account (soft delete by deactivating)
    Only accessible by admin/superuser roles
    """
    try:
        user = User.query.get_or_404(user_id)
        
        # Prevent deletion of superuser accounts
        if user.role == 'superuser':
            return jsonify({'error': 'Cannot delete superuser account'}), 403
        
        # Prevent users from deleting themselves
        if user.id == request.current_user.id:
            return jsonify({'error': 'Cannot delete your own account'}), 403
        
        # Soft delete by deactivating the user
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500

@users_bp.route('/api/users/roles', methods=['GET'])
@require_auth
def get_user_roles():
    """
    Get available user roles and their descriptions
    Accessible by all authenticated users
    """
    roles = {
        'superuser': {
            'name': 'Super User',
            'description': 'Full system access with user management (acts as manager)',
            'permissions': ['view', 'edit', 'create', 'delete', 'admin']
        },
        'user': {
            'name': 'User',
            'description': 'Standard user access to system features',
            'permissions': ['view', 'edit', 'create']
        }
    }
    
    return jsonify({'roles': roles}), 200
