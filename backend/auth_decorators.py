"""
Authentication decorators for Flask routes
Provides middleware for authentication and permission checking
"""

from functools import wraps
from flask import request, jsonify, session
from models import User

def require_auth(f):
    """
    Decorator to require authentication for protected routes
    Usage: @require_auth
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Get current user
        user = User.query.get(session['user_id'])
        if not user or not user.is_active:
            session.clear()
            return jsonify({'error': 'Invalid session'}), 401
        
        # Add user to request context
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

def require_permission(permission):
    """
    Decorator to require specific permission for routes
    Usage: @require_permission('admin')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'error': 'Authentication required'}), 401
            
            user = User.query.get(session['user_id'])
            if not user or not user.is_active:
                session.clear()
                return jsonify({'error': 'Invalid session'}), 401
            
            if not user.has_permission(permission):
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            request.current_user = user
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


