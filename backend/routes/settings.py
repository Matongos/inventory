"""
Settings API Routes
System configuration, data import/export, and backup functionality
"""

from flask import Blueprint, request, jsonify, send_file
from models import Product, Category, Store, Inventory, Sale, User, db
from auth_decorators import require_auth, require_permission
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import csv
import io
import os
import tempfile
import zipfile

# Create Blueprint for settings routes
settings_bp = Blueprint('settings', __name__)

# =============================================================================
# DATA IMPORT ENDPOINTS
# =============================================================================

@settings_bp.route('/api/settings/import', methods=['POST'])
@require_auth
@require_permission('admin')
def import_data():
    """Import data from CSV or Excel files"""
    try:
        # Check if file is provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        import_type = request.form.get('import_type', 'stock')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'.csv', '.xlsx', '.xls'}
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Please use CSV or Excel files'}), 400
        
        # Process CSV files
        if file_extension == '.csv':
            imported_count = process_csv_import(file, import_type)
        else:
            # For Excel files, you'd need openpyxl or pandas
            return jsonify({'error': 'Excel import not yet implemented. Please use CSV files'}), 400
        
        return jsonify({
            'message': 'Data imported successfully',
            'imported_count': imported_count,
            'import_type': import_type
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Import failed: {str(e)}'}), 500

def process_csv_import(file, import_type):
    """Process CSV file import"""
    imported_count = 0
    
    # Read CSV content
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_reader = csv.DictReader(stream)
    
    # Get all existing categories and stores for lookup
    categories = {cat.name.lower(): cat.id for cat in Category.query.all()}
    stores = {store.name.lower(): store.id for store in Store.query.all()}
    
    # Default store and category (create if not exist)
    default_store = Store.query.filter_by(name='Main Store').first()
    if not default_store:
        default_store = Store(
            name='Main Store',
            code='MAIN',
            address='Default Address',
            city='Default City',
            state='Default State',
            postal_code='00000',
            country='USA'
        )
        db.session.add(default_store)
        db.session.commit()
    
    default_category = Category.query.filter_by(name='General').first()
    if not default_category:
        default_category = Category(
            name='General',
            description='General products',
            icon='📦',
            color='#6b7280'
        )
        db.session.add(default_category)
        db.session.commit()
    
    for row in csv_reader:
        try:
            # Clean and validate row data
            name = row.get('Product Name', '').strip()
            code = row.get('Product Code', '').strip()
            quantity = int(row.get('Quantity', 0) or 0)
            price = float(row.get('Price', 0) or 0)
            cost_price = float(row.get('Cost Price', 0) or 0)
            category_name = row.get('Category', 'General').strip()
            store_name = row.get('Store', 'Main Store').strip()
            
            if not name or not code:
                continue  # Skip rows without essential data
            
            # Check if product already exists
            existing_product = Product.query.filter_by(code=code).first()
            
            if existing_product:
                # Update existing product
                product = existing_product
                if price > 0:
                    product.selling_price = price
                if cost_price > 0:
                    product.cost_price = cost_price
                product.updated_at = datetime.utcnow()
            else:
                # Create new product
                # Get or create category
                category_id = categories.get(category_name.lower(), default_category.id)
                
                product = Product(
                    name=name,
                    code=code,
                    selling_price=price,
                    cost_price=cost_price,
                    category_id=category_id,
                    status='active',
                    is_active=True,
                    track_inventory=True
                )
                db.session.add(product)
                db.session.flush()  # Get product ID
            
            # Update or create inventory
            store_id = stores.get(store_name.lower(), default_store.id)
            
            inventory = Inventory.query.filter_by(
                product_id=product.id,
                store_id=store_id
            ).first()
            
            if inventory:
                # Update existing inventory
                inventory.quantity += quantity
                inventory.last_updated = datetime.utcnow()
            else:
                # Create new inventory entry
                inventory = Inventory(
                    product_id=product.id,
                    store_id=store_id,
                    quantity=quantity,
                    min_stock=10,  # Default minimum stock
                    last_updated=datetime.utcnow()
                )
                db.session.add(inventory)
            
            imported_count += 1
            
        except (ValueError, KeyError) as e:
            # Skip invalid rows
            continue
    
    db.session.commit()
    return imported_count

# =============================================================================
# DATA BACKUP ENDPOINTS
# =============================================================================

@settings_bp.route('/api/settings/backup', methods=['POST'])
@require_auth
@require_permission('admin')
def create_backup():
    """Create a complete system backup"""
    try:
        # Create backup data structure
        backup_data = {
            'metadata': {
                'created_at': datetime.utcnow().isoformat(),
                'version': '1.0.0',
                'backup_type': 'full_system'
            },
            'data': {}
        }
        
        # Backup Categories
        categories = Category.query.all()
        backup_data['data']['categories'] = [
            {
                'id': cat.id,
                'name': cat.name,
                'description': cat.description,
                'icon': cat.icon,
                'color': cat.color,
                'parent_id': cat.parent_id,
                'is_active': cat.is_active,
                'sort_order': cat.sort_order,
                'created_at': cat.created_at.isoformat() if cat.created_at else None,
                'updated_at': cat.updated_at.isoformat() if cat.updated_at else None
            }
            for cat in categories
        ]
        
        # Backup Stores
        stores = Store.query.all()
        backup_data['data']['stores'] = [
            {
                'id': store.id,
                'name': store.name,
                'code': store.code,
                'address': store.address,
                'city': store.city,
                'state': store.state,
                'postal_code': store.postal_code,
                'country': store.country,
                'phone': store.phone,
                'email': store.email,
                'manager_name': store.manager_name,
                'image': store.image,
                'timezone': store.timezone,
                'operating_hours': store.operating_hours,
                'is_active': store.is_active,
                'opening_date': store.opening_date.isoformat() if store.opening_date else None,
                'square_footage': store.square_footage,
                'customer_rating': store.customer_rating,
                'created_at': store.created_at.isoformat() if store.created_at else None,
                'updated_at': store.updated_at.isoformat() if store.updated_at else None
            }
            for store in stores
        ]
        
        # Backup Products
        products = Product.query.all()
        backup_data['data']['products'] = [
            {
                'id': product.id,
                'name': product.name,
                'code': product.code,
                'barcode': product.barcode,
                'description': product.description,
                'short_description': product.short_description,
                'brand': product.brand,
                'model': product.model,
                'category_id': product.category_id,
                'tags': product.tags,
                'cost_price': product.cost_price,
                'selling_price': product.selling_price,
                'msrp': product.msrp,
                'weight': product.weight,
                'dimensions': product.dimensions,
                'primary_image': product.primary_image,
                'images': product.images,
                'status': product.status,
                'is_active': product.is_active,
                'track_inventory': product.track_inventory,
                'allow_backorder': product.allow_backorder,
                'min_stock_level': product.min_stock_level,
                'max_stock_level': product.max_stock_level,
                'meta_title': product.meta_title,
                'meta_description': product.meta_description,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'updated_at': product.updated_at.isoformat() if product.updated_at else None
            }
            for product in products
        ]
        
        # Backup Inventory
        inventory_items = Inventory.query.all()
        backup_data['data']['inventory'] = [
            {
                'id': inv.id,
                'product_id': inv.product_id,
                'store_id': inv.store_id,
                'quantity': inv.quantity,
                'min_stock': inv.min_stock,
                'last_updated': inv.last_updated.isoformat() if inv.last_updated else None
            }
            for inv in inventory_items
        ]
        
        # Backup Sales (last 3 months to keep file size manageable)
        three_months_ago = datetime.utcnow().replace(day=1)
        for _ in range(3):
            if three_months_ago.month == 1:
                three_months_ago = three_months_ago.replace(year=three_months_ago.year - 1, month=12)
            else:
                three_months_ago = three_months_ago.replace(month=three_months_ago.month - 1)
        
        sales = Sale.query.filter(Sale.sale_date >= three_months_ago).all()
        backup_data['data']['sales'] = [
            {
                'id': sale.id,
                'order_number': sale.order_number,
                'product_id': sale.product_id,
                'store_id': sale.store_id,
                'quantity': sale.quantity,
                'unit_cost': sale.unit_cost,
                'unit_price': sale.unit_price,
                'discount_amount': sale.discount_amount,
                'tax_amount': sale.tax_amount,
                'total_price': sale.total_price,
                'customer_name': sale.customer_name,
                'customer_email': sale.customer_email,
                'customer_phone': sale.customer_phone,
                'status': sale.status,
                'payment_method': sale.payment_method,
                'payment_status': sale.payment_status,
                'sold_by_user_id': sale.sold_by_user_id,
                'notes': sale.notes,
                'customer_notes': sale.customer_notes,
                'sale_date': sale.sale_date.isoformat() if sale.sale_date else None,
                'created_at': sale.created_at.isoformat() if sale.created_at else None,
                'updated_at': sale.updated_at.isoformat() if sale.updated_at else None
            }
            for sale in sales
        ]
        
        # Backup Users (excluding sensitive data)
        users = User.query.all()
        backup_data['data']['users'] = [
            {
                'id': user.id,
                'username': user.username,
                'name': user.name,
                'email': user.email,
                'phone': user.phone,
                'role': user.role,
                'store_id': user.store_id,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            }
            for user in users
        ]
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            json.dump(backup_data, temp_file, indent=2, default=str)
            temp_file_path = temp_file.name
        
        # Return the file as download
        return send_file(
            temp_file_path,
            as_attachment=True,
            download_name=f'inventory-backup-{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json',
            mimetype='application/json'
        )
        
    except Exception as e:
        return jsonify({'error': f'Backup failed: {str(e)}'}), 500

# =============================================================================
# SYSTEM CONFIGURATION ENDPOINTS
# =============================================================================

@settings_bp.route('/api/settings/config', methods=['GET'])
@require_auth
def get_system_config():
    """Get system configuration"""
    try:
        config = {
            'version': '1.0.0',
            'database_stats': {
                'total_products': Product.query.count(),
                'total_categories': Category.query.count(),
                'total_stores': Store.query.count(),
                'total_users': User.query.count(),
                'total_sales': Sale.query.count(),
                'total_inventory_items': Inventory.query.count()
            },
            'system_info': {
                'last_backup': None,  # Could store this in a settings table
                'data_retention_days': 365,
                'max_file_size_mb': 10
            }
        }
        
        return jsonify({'config': config}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get system config: {str(e)}'}), 500

@settings_bp.route('/api/settings/export-template', methods=['GET'])
@require_auth
def export_import_template():
    """Export CSV template for data import"""
    try:
        # Create CSV template
        template_data = [
            ['Product Name', 'Product Code', 'Quantity', 'Price', 'Cost Price', 'Category', 'Store'],
            ['Sample Product 1', 'SP001', '100', '29.99', '15.00', 'Electronics', 'Main Store'],
            ['Sample Product 2', 'SP002', '50', '49.99', '25.00', 'Clothing', 'Main Store'],
            ['Sample Product 3', 'SP003', '75', '19.99', '10.00', 'Books', 'Branch Store']
        ]
        
        # Create temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='') as temp_file:
            csv_writer = csv.writer(temp_file)
            csv_writer.writerows(template_data)
            temp_file_path = temp_file.name
        
        return send_file(
            temp_file_path,
            as_attachment=True,
            download_name='import-template.csv',
            mimetype='text/csv'
        )
        
    except Exception as e:
        return jsonify({'error': f'Failed to export template: {str(e)}'}), 500

# =============================================================================
# THEME AND PREFERENCES
# =============================================================================

@settings_bp.route('/api/settings/theme', methods=['POST'])
@require_auth
def save_user_theme():
    """Save user theme preference"""
    try:
        data = request.get_json()
        theme = data.get('theme', 'purple')
        
        # In a full implementation, you'd save this to user preferences
        # For now, we'll just return success as theme is stored in localStorage
        
        return jsonify({
            'message': 'Theme preference saved',
            'theme': theme
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to save theme: {str(e)}'}), 500


