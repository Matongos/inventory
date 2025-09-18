"""
Products API Routes
Comprehensive product management with CRUD operations, search, filtering, and inventory tracking
"""

from flask import Blueprint, request, jsonify, session, send_file
from models import Product, Category, Store, Inventory, Sale, User, db
from auth_decorators import require_auth, require_permission
from sqlalchemy import func, desc, asc, and_, or_
from datetime import datetime, timedelta
import json
import os
import uuid
from werkzeug.utils import secure_filename

# Create Blueprint for product routes
products_bp = Blueprint('products', __name__)

# =============================================================================
# IMAGE UPLOAD CONFIGURATION
# =============================================================================

# Allowed image extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Upload directory
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads', 'products')

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename):
    """Generate a unique filename while preserving the extension"""
    if '.' in original_filename:
        extension = original_filename.rsplit('.', 1)[1].lower()
        unique_id = str(uuid.uuid4())
        return f"{unique_id}.{extension}"
    return str(uuid.uuid4())

# =============================================================================
# PRODUCT CRUD OPERATIONS
# =============================================================================

@products_bp.route('/api/products', methods=['GET'])
@require_auth
def get_products():
    """
    Get products with advanced filtering, search, and pagination
    Query Parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20)
    - search: Search term for name, code, barcode, or description
    - category_id: Filter by category
    - status: Filter by status (active, inactive, low_stock, out_of_stock)
    - store_id: Filter by store (shows inventory for that store)
    - sort_by: Sort field (name, price, stock, created_at)
    - sort_order: Sort order (asc, desc)
    """
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # Max 100 items per page
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id', type=int)
        status = request.args.get('status', '').strip()
        store_id = request.args.get('store_id', type=int)
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Base query
        query = Product.query
        
        # Search functionality
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.code.ilike(search_term),
                    Product.barcode.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.brand.ilike(search_term)
                )
            )
        
        # Category filter
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        # Status filter
        if status:
            if status == 'active':
                query = query.filter(Product.is_active == True, Product.status == 'active')
            elif status == 'inactive':
                query = query.filter(Product.is_active == False)
            elif status == 'low_stock':
                # Join with inventory to find low stock products
                query = query.join(Inventory).filter(
                    Product.is_active == True,
                    Inventory.quantity <= Inventory.min_stock
                ).distinct()
            elif status == 'out_of_stock':
                # Join with inventory to find out of stock products
                query = query.join(Inventory).filter(
                    Product.is_active == True,
                    Inventory.quantity <= 0
                ).distinct()
        
        # Sorting
        sort_column = getattr(Product, sort_by, Product.name)
        if sort_order == 'desc':
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Pagination
        paginated_products = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # Format products data
        products_data = []
        for product in paginated_products.items:
            # Get inventory data for the product
            inventory_data = []
            total_stock = 0
            low_stock_stores = []
            
            for inventory in product.inventory:
                if not store_id or inventory.store_id == store_id:
                    inventory_info = {
                        'store_id': inventory.store_id,
                        'store_name': inventory.store.name,
                        'quantity': inventory.quantity,
                        'min_stock': inventory.min_stock,
                        'is_low_stock': inventory.quantity <= inventory.min_stock,
                        'last_updated': inventory.last_updated.isoformat() if inventory.last_updated else None
                    }
                    inventory_data.append(inventory_info)
                    total_stock += inventory.quantity
                    
                    if inventory.quantity <= inventory.min_stock:
                        low_stock_stores.append(inventory.store.name)
            
            # Get recent sales data
            recent_sales = Sale.query.filter(
                Sale.product_id == product.id,
                Sale.sale_date >= datetime.utcnow() - timedelta(days=30)
            ).count()
            
            product_data = {
                'id': product.id,
                'name': product.name,
                'code': product.code,
                'barcode': product.barcode,
                'description': product.description,
                'short_description': product.short_description,
                'brand': product.brand,
                'model': product.model,
                'category': {
                    'id': product.category.id,
                    'name': product.category.name,
                    'icon': product.category.icon,
                    'color': product.category.color
                } if product.category else None,
                'cost_price': float(product.cost_price or 0),
                'selling_price': float(product.selling_price or 0),
                'msrp': float(product.msrp or 0),
                'profit_margin': product.profit_margin,
                'weight': float(product.weight or 0),
                'primary_image': product.primary_image,
                'is_active': product.is_active,
                'status': product.status,
                'track_inventory': product.track_inventory,
                'allow_backorder': product.allow_backorder,
                'min_stock_level': product.min_stock_level,
                'max_stock_level': product.max_stock_level,
                'created_at': product.created_at.isoformat(),
                'updated_at': product.updated_at.isoformat(),
                
                # Computed fields
                'total_stock': total_stock,
                'is_low_stock': len(low_stock_stores) > 0,
                'is_out_of_stock': total_stock <= 0,
                'low_stock_stores': low_stock_stores,
                'recent_sales_count': recent_sales,
                'inventory': inventory_data if store_id else inventory_data[:3]  # Limit inventory data if not filtering by store
            }
            products_data.append(product_data)
        
        return jsonify({
            'products': products_data,
            'pagination': {
                'page': paginated_products.page,
                'pages': paginated_products.pages,
                'per_page': paginated_products.per_page,
                'total': paginated_products.total,
                'has_next': paginated_products.has_next,
                'has_prev': paginated_products.has_prev
            },
            'filters_applied': {
                'search': search,
                'category_id': category_id,
                'status': status,
                'store_id': store_id,
                'sort_by': sort_by,
                'sort_order': sort_order
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch products: {str(e)}'}), 500

@products_bp.route('/api/products/<int:product_id>', methods=['GET'])
@require_auth
def get_product(product_id):
    """
    Get detailed information about a specific product
    """
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get comprehensive inventory data
        inventory_data = []
        total_stock = 0
        try:
            for inventory in product.inventory:
                try:
                    inventory_info = {
                        'store_id': inventory.store_id,
                        'store_name': inventory.store.name if inventory.store else 'Unknown Store',
                        'store_code': inventory.store.code if inventory.store else '',
                        'quantity': inventory.quantity or 0,
                        'min_stock': inventory.min_stock or 0,
                        'is_low_stock': (inventory.quantity or 0) <= (inventory.min_stock or 0),
                        'last_updated': inventory.last_updated.isoformat() if inventory.last_updated else None
                    }
                    inventory_data.append(inventory_info)
                    total_stock += inventory.quantity or 0
                except Exception as inv_error:
                    print(f"Error processing inventory item: {inv_error}")
                    continue
        except Exception as inv_list_error:
            print(f"Error accessing inventory list: {inv_list_error}")
            inventory_data = []
        
        # Get sales history (last 30 days)
        sales_data = []
        try:
            sales_history = db.session.query(
                func.date(Sale.sale_date).label('date'),
                func.count(Sale.id).label('orders'),
                func.sum(Sale.quantity).label('quantity_sold'),
                func.sum(Sale.total_price).label('revenue')
            ).filter(
                Sale.product_id == product_id,
                Sale.sale_date >= datetime.utcnow() - timedelta(days=30)
            ).group_by(func.date(Sale.sale_date)).order_by('date').all()
            
            for date, orders, quantity, revenue in sales_history:
                sales_data.append({
                    'date': date.isoformat() if date else None,
                    'orders': orders or 0,
                    'quantity_sold': quantity or 0,
                    'revenue': float(revenue or 0)
                })
        except Exception as sales_error:
            print(f"Error fetching sales history: {sales_error}")
            sales_data = []
        
        product_data = {
            'id': product.id,
            'name': product.name,
            'code': product.code,
            'barcode': product.barcode,
            'description': product.description,
            'short_description': product.short_description,
            'brand': product.brand,
            'model': product.model,
            'category': {
                'id': product.category.id,
                'name': product.category.name,
                'icon': product.category.icon,
                'color': product.category.color
            } if product.category else None,
            'cost_price': float(product.cost_price or 0),
            'selling_price': float(product.selling_price or 0),
            'msrp': float(product.msrp or 0),
            'profit_margin': getattr(product, 'profit_margin', 0.0),
            'profit_amount': getattr(product, 'profit_amount', 0.0),
            'weight': float(product.weight or 0),
            'dimensions': {
                'length': float(product.dimensions_length or 0),
                'width': float(product.dimensions_width or 0),
                'height': float(product.dimensions_height or 0)
            },
            'primary_image': product.primary_image,
            'images': json.loads(product.images) if product.images else [],
            'is_active': product.is_active,
            'status': product.status,
            'track_inventory': product.track_inventory,
            'allow_backorder': product.allow_backorder,
            'min_stock_level': product.min_stock_level,
            'max_stock_level': product.max_stock_level,
            'meta_title': product.meta_title,
            'meta_description': product.meta_description,
            'created_at': product.created_at.isoformat(),
            'updated_at': product.updated_at.isoformat(),
            
            # Computed fields with error handling
            'total_stock': total_stock,
            'available_stock': getattr(product, 'available_stock', total_stock),
            'is_low_stock': getattr(product, 'is_low_stock', False),
            'is_out_of_stock': getattr(product, 'is_out_of_stock', total_stock <= 0),
            'total_sales_value': getattr(product, 'total_sales_value', 0.0),
            'total_units_sold': getattr(product, 'total_units_sold', 0),
            'average_sale_price': getattr(product, 'average_sale_price', 0.0),
            
            # Related data
            'inventory': inventory_data,
            'sales_history': sales_data
        }
        
        return jsonify(product_data), 200
        
    except Exception as e:
        print(f"Error in get_product for product_id {product_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch product: {str(e)}'}), 500

@products_bp.route('/api/products', methods=['POST'])
@require_auth
def create_product():
    """
    Create a new product with comprehensive validation
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'code', 'selling_price', 'category_id']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if category exists
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Check if product code is unique
        if Product.query.filter_by(code=data['code']).first():
            return jsonify({'error': 'Product code already exists'}), 400
        
        # Check if barcode is unique (if provided)
        if data.get('barcode') and Product.query.filter_by(barcode=data['barcode']).first():
            return jsonify({'error': 'Barcode already exists'}), 400
        
        # Create new product
        product = Product(
            name=data['name'].strip(),
            code=data['code'].strip().upper(),
            barcode=data.get('barcode', '').strip(),
            description=data.get('description', '').strip(),
            short_description=data.get('short_description', '').strip(),
            brand=data.get('brand', '').strip(),
            model=data.get('model', '').strip(),
            category_id=data['category_id'],
            cost_price=float(data.get('cost_price', 0)),
            selling_price=float(data['selling_price']),
            msrp=float(data.get('msrp', 0)),
            weight=float(data.get('weight', 0)),
            dimensions_length=float(data.get('dimensions', {}).get('length', 0)),
            dimensions_width=float(data.get('dimensions', {}).get('width', 0)),
            dimensions_height=float(data.get('dimensions', {}).get('height', 0)),
            primary_image=data.get('primary_image', ''),
            images=json.dumps(data.get('images', [])),
            is_active=data.get('is_active', True),
            status=data.get('status', 'active'),
            track_inventory=data.get('track_inventory', True),
            allow_backorder=data.get('allow_backorder', False),
            min_stock_level=int(data.get('min_stock_level', 10)),
            max_stock_level=int(data.get('max_stock_level', 1000)),
            meta_title=data.get('meta_title', ''),
            meta_description=data.get('meta_description', '')
        )
        
        db.session.add(product)
        db.session.flush()  # Get the product ID
        
        # Create initial inventory records for all stores (if requested)
        if data.get('create_inventory', False):
            stores = Store.query.filter_by(is_active=True).all()
            initial_quantity = int(data.get('initial_quantity', 0))
            
            for store in stores:
                inventory = Inventory(
                    product_id=product.id,
                    store_id=store.id,
                    quantity=initial_quantity,
                    min_stock=product.min_stock_level,
                    last_updated=datetime.utcnow()
                )
                db.session.add(inventory)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product_id': product.id
        }), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create product: {str(e)}'}), 500

@products_bp.route('/api/products/<int:product_id>', methods=['PUT'])
@require_auth
def update_product(product_id):
    """
    Update an existing product
    """
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Check if category exists (if being updated)
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Category not found'}), 404
        
        # Check if code is unique (if being updated)
        if 'code' in data and data['code'] != product.code:
            if Product.query.filter_by(code=data['code']).first():
                return jsonify({'error': 'Product code already exists'}), 400
        
        # Check if barcode is unique (if being updated)
        if 'barcode' in data and data['barcode'] != product.barcode:
            if data['barcode'] and Product.query.filter_by(barcode=data['barcode']).first():
                return jsonify({'error': 'Barcode already exists'}), 400
        
        # Update product fields
        updatable_fields = [
            'name', 'code', 'barcode', 'description', 'short_description', 'brand', 'model',
            'category_id', 'cost_price', 'selling_price', 'msrp', 'weight', 'primary_image',
            'is_active', 'status', 'track_inventory', 'allow_backorder', 'min_stock_level',
            'max_stock_level', 'meta_title', 'meta_description'
        ]
        
        for field in updatable_fields:
            if field in data:
                if field in ['cost_price', 'selling_price', 'msrp', 'weight']:
                    setattr(product, field, float(data[field]) if data[field] else 0)
                elif field in ['min_stock_level', 'max_stock_level', 'category_id']:
                    setattr(product, field, int(data[field]) if data[field] else 0)
                elif field in ['is_active', 'track_inventory', 'allow_backorder']:
                    setattr(product, field, bool(data[field]))
                else:
                    setattr(product, field, str(data[field]).strip() if data[field] else '')
        
        # Handle dimensions
        if 'dimensions' in data:
            dimensions = data['dimensions']
            product.dimensions_length = float(dimensions.get('length', 0))
            product.dimensions_width = float(dimensions.get('width', 0))
            product.dimensions_height = float(dimensions.get('height', 0))
        
        # Handle images
        if 'images' in data:
            product.images = json.dumps(data['images'])
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product_id': product.id
        }), 200
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update product: {str(e)}'}), 500

@products_bp.route('/api/products/<int:product_id>', methods=['DELETE'])
@require_permission('admin')
def delete_product(product_id):
    """
    Soft delete a product (set is_active to False)
    Only superusers can delete products
    """
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Soft delete - set is_active to False
        product.is_active = False
        product.status = 'inactive'
        product.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product deactivated successfully',
            'product_id': product.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to deactivate product: {str(e)}'}), 500

# =============================================================================
# HELPER ENDPOINTS
# =============================================================================

@products_bp.route('/api/products/categories', methods=['GET'])
@require_auth
def get_product_categories():
    """
    Get all active categories for product forms
    """
    try:
        categories = Category.query.filter_by(is_active=True).order_by(Category.name).all()
        
        categories_data = []
        for category in categories:
            categories_data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'icon': category.icon,
                'color': category.color
            })
        
        return jsonify({'categories': categories_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500

@products_bp.route('/api/products/stats', methods=['GET'])
@require_auth
def get_product_stats():
    """
    Get product statistics for the products page
    """
    try:
        # Basic counts
        total_products = Product.query.filter_by(is_active=True).count()
        active_products = Product.query.filter_by(is_active=True, status='active').count()
        inactive_products = Product.query.filter_by(is_active=False).count()
        
        # Low stock products
        low_stock_products = db.session.query(Product).join(Inventory).filter(
            Product.is_active == True,
            Inventory.quantity <= Inventory.min_stock
        ).distinct().count()
        
        # Out of stock products
        out_of_stock_products = db.session.query(Product).join(Inventory).filter(
            Product.is_active == True,
            Inventory.quantity <= 0
        ).distinct().count()
        
        # Categories with product counts
        category_stats = db.session.query(
            Category.name,
            Category.icon,
            Category.color,
            func.count(Product.id).label('product_count')
        ).join(Product, Category.id == Product.category_id).filter(
            Product.is_active == True
        ).group_by(Category.id).order_by(desc('product_count')).all()
        
        category_data = []
        for name, icon, color, count in category_stats:
            category_data.append({
                'category': name,
                'icon': icon,
                'color': color,
                'product_count': count
            })
        
        return jsonify({
            'stats': {
                'total_products': total_products,
                'active_products': active_products,
                'inactive_products': inactive_products,
                'low_stock_products': low_stock_products,
                'out_of_stock_products': out_of_stock_products
            },
            'category_breakdown': category_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch product stats: {str(e)}'}), 500

# =============================================================================
# IMAGE UPLOAD AND SERVING ENDPOINTS
# =============================================================================

@products_bp.route('/api/products/<int:product_id>/upload-image', methods=['POST'])
@require_auth
def upload_product_image(product_id):
    """Upload an image for a specific product"""
    try:
        # Check if the product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if file is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, gif, webp'}), 400
        
        # Generate unique filename
        filename = generate_unique_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save the file
        file.save(filepath)
        
        # Update product with image filename
        # If this is the first image, set it as primary
        if not product.primary_image:
            product.primary_image = filename
        
        # Add to images list (assuming it's stored as JSON string)
        if product.images:
            try:
                images_list = json.loads(product.images) if isinstance(product.images, str) else product.images
            except (json.JSONDecodeError, TypeError):
                images_list = []
        else:
            images_list = []
        
        if filename not in images_list:
            images_list.append(filename)
            product.images = json.dumps(images_list)
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'filename': filename,
            'is_primary': product.primary_image == filename,
            'image_url': f'/api/products/{product_id}/image/{filename}'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to upload image: {str(e)}'}), 500

@products_bp.route('/api/products/<int:product_id>/image/<filename>')
def serve_product_image(product_id, filename):
    """Serve a product image file"""
    try:
        # Security check: ensure the image belongs to the product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check if the filename is associated with this product
        valid_image = False
        if product.primary_image == filename:
            valid_image = True
        elif product.images:
            try:
                images_list = json.loads(product.images) if isinstance(product.images, str) else product.images
                if filename in images_list:
                    valid_image = True
            except (json.JSONDecodeError, TypeError):
                pass
        
        if not valid_image:
            return jsonify({'error': 'Image not found for this product'}), 404
        
        # Construct file path
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Check if file exists
        if not os.path.exists(filepath):
            return jsonify({'error': 'Image file not found on disk'}), 404
        
        # Serve the file
        return send_file(filepath)
        
    except Exception as e:
        return jsonify({'error': f'Failed to serve image: {str(e)}'}), 500

@products_bp.route('/api/products/<int:product_id>/set-primary-image', methods=['PUT'])
@require_auth
def set_primary_image(product_id):
    """Set a specific image as the primary image for a product"""
    try:
        # Get the product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get the filename from request
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400
        
        filename = data['filename']
        
        # Verify the image belongs to this product
        valid_image = False
        if product.images:
            try:
                images_list = json.loads(product.images) if isinstance(product.images, str) else product.images
                if filename in images_list:
                    valid_image = True
            except (json.JSONDecodeError, TypeError):
                pass
        
        if not valid_image:
            return jsonify({'error': 'Image not found for this product'}), 404
        
        # Set as primary image
        product.primary_image = filename
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Primary image updated successfully',
            'primary_image': filename
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to set primary image: {str(e)}'}), 500

@products_bp.route('/api/products/<int:product_id>/delete-image', methods=['DELETE'])
@require_auth
def delete_product_image(product_id):
    """Delete a specific image from a product"""
    try:
        # Get the product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get the filename from request
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400
        
        filename = data['filename']
        
        # Remove from images list
        if product.images:
            try:
                images_list = json.loads(product.images) if isinstance(product.images, str) else product.images
                if filename in images_list:
                    images_list.remove(filename)
                    product.images = json.dumps(images_list)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # If this was the primary image, set a new one or clear it
        if product.primary_image == filename:
            if product.images:
                try:
                    images_list = json.loads(product.images) if isinstance(product.images, str) else product.images
                    product.primary_image = images_list[0] if images_list else None
                except (json.JSONDecodeError, TypeError, IndexError):
                    product.primary_image = None
            else:
                product.primary_image = None
        
        # Delete the file from disk
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Image deleted successfully',
            'primary_image': product.primary_image
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete image: {str(e)}'}), 500