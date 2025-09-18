from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from database import db
import os

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
CORS(app, supports_credentials=True)

# Import models after db initialization
from models import User, Product, Category, Store, Inventory, Sale

# Import and register blueprints
from routes.users import users_bp
from routes.dashboard import dashboard_bp
from routes.products import products_bp
from routes.categories import categories_bp
from routes.stores import stores_bp
from routes.finance import finance_bp
from routes.settings import settings_bp

# Create tables
with app.app_context():
    # Create tables if they don't exist (preserves existing data)
    db.create_all()
    
    # Create superuser only if it doesn't exist
    existing_admin = User.query.filter_by(username='admin').first()
    if not existing_admin:
        superuser = User(
            username='admin',
            password=generate_password_hash('admin123'),
            role='superuser',
            name='System Administrator',
            email='admin@inventory.com'
        )
        db.session.add(superuser)
        db.session.commit()
        print("Superuser created: admin/admin123")
    else:
        print("Superuser already exists: admin/admin123")

# Basic routes
@app.route('/')
def home():
    return jsonify({
        'message': 'Inventory Management System API',
        'version': '1.0.0',
        'status': 'running'
    })

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

@app.route('/api/login', methods=['POST'])
def login():
    """
    User login endpoint with enhanced security and session management
    Validates credentials, updates last_login, and creates secure session
    """
    try:
        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        # Validate required fields
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Find user by username (case-insensitive)
        user = User.query.filter(User.username.ilike(username)).first()
        
        # Check if user exists and is active
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated. Contact administrator.'}), 401
        
        # Verify password
        if not check_password_hash(user.password, password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Update last login time
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create secure session
        session.permanent = True  # Enable permanent session
        session['user_id'] = user.id
        session['username'] = user.username
        session['role'] = user.role
        session['login_time'] = datetime.utcnow().isoformat()
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed. Please try again.'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    User logout endpoint - clears session and provides confirmation
    """
    try:
        # Get user info before clearing session for logging
        user_id = session.get('user_id')
        username = session.get('username')
        
        # Clear all session data
        session.clear()
        
        # Log logout event
        if username:
            app.logger.info(f"User {username} (ID: {user_id}) logged out")
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        app.logger.error(f"Logout error: {str(e)}")
        # Still clear session even if there's an error
        session.clear()
        return jsonify({'message': 'Logout completed'}), 200

@app.route('/api/current-user')
def current_user():
    """
    Get current authenticated user information
    Validates session and returns user data
    """
    try:
        # Check if user is authenticated
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Get user from database
        user = User.query.get(session['user_id'])
        if not user:
            # User was deleted - clear session
            session.clear()
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is still active
        if not user.is_active:
            session.clear()
            return jsonify({'error': 'Account deactivated'}), 401
        
        # Return user data
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        app.logger.error(f"Current user error: {str(e)}")
        return jsonify({'error': 'Failed to get user information'}), 500

# Authentication decorators moved to auth_decorators.py to avoid circular imports

# =============================================================================
# REGISTER BLUEPRINTS
# =============================================================================

app.register_blueprint(users_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(products_bp)
app.register_blueprint(categories_bp)
app.register_blueprint(stores_bp)
app.register_blueprint(finance_bp)
app.register_blueprint(settings_bp)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
