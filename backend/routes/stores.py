"""
Stores API Routes
Comprehensive store management with CRUD operations, statistics, and product listings
"""

from flask import Blueprint, request, jsonify
from models import Store, Product, Inventory, Sale, User, db
from auth_decorators import require_auth, require_permission
from sqlalchemy import func, desc, asc, and_, or_
from datetime import datetime, timedelta
import json

# Create Blueprint for store routes
stores_bp = Blueprint('stores', __name__)

# =============================================================================
# STORE CRUD OPERATIONS
# =============================================================================

@stores_bp.route('/api/stores', methods=['GET'])
@require_auth
def get_stores():
    """Get all stores with basic information and statistics"""
    try:
        # Get query parameters
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Build query
        query = Store.query.filter(Store.is_active == True)
        
        # Apply search filter
        if search:
            search_filter = or_(
                Store.name.ilike(f'%{search}%'),
                Store.city.ilike(f'%{search}%'),
                Store.state.ilike(f'%{search}%'),
                Store.country.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if hasattr(Store, sort_by):
            if sort_order == 'desc':
                query = query.order_by(desc(getattr(Store, sort_by)))
            else:
                query = query.order_by(asc(getattr(Store, sort_by)))
        else:
            query = query.order_by(Store.name)
        
        stores = query.all()
        
        # Enhance stores with statistics
        stores_data = []
        for store in stores:
            store_dict = store.to_dict()
            
            # Get employee count
            employee_count = User.query.filter(
                User.store_id == store.id,
                User.is_active == True
            ).count()
            store_dict['employees_count'] = employee_count
            
            # Get inventory statistics
            inventory_stats = db.session.query(
                func.count(Inventory.id).label('total_items'),
                func.sum(Inventory.quantity).label('total_quantity'),
                func.count(func.distinct(Inventory.product_id)).label('unique_products')
            ).filter(Inventory.store_id == store.id).first()
            
            store_dict['total_inventory_items'] = inventory_stats.total_items or 0
            store_dict['total_quantity'] = inventory_stats.total_quantity or 0
            store_dict['unique_products_count'] = inventory_stats.unique_products or 0
            
            # Get low stock items count
            low_stock_count = db.session.query(Inventory).join(Product).filter(
                Inventory.store_id == store.id,
                Inventory.quantity <= Product.min_stock_level,
                Product.is_active == True
            ).count()
            store_dict['low_stock_items_count'] = low_stock_count
            
            # Get today's sales
            today = datetime.utcnow().date()
            today_sales = db.session.query(
                func.sum(Sale.total_price).label('total_sales'),
                func.count(Sale.id).label('order_count')
            ).filter(
                Sale.store_id == store.id,
                func.date(Sale.sale_date) == today
            ).first()
            
            store_dict['total_sales_today'] = today_sales.total_sales or 0
            store_dict['orders_today'] = today_sales.order_count or 0
            
            # Get monthly revenue
            month_start = today.replace(day=1)
            monthly_revenue = db.session.query(
                func.sum(Sale.total_price).label('revenue')
            ).filter(
                Sale.store_id == store.id,
                func.date(Sale.sale_date) >= month_start
            ).scalar()
            
            store_dict['monthly_revenue'] = monthly_revenue or 0
            
            stores_data.append(store_dict)
        
        return jsonify({
            'stores': stores_data,
            'total': len(stores_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stores: {str(e)}'}), 500

@stores_bp.route('/api/stores/<int:store_id>', methods=['GET'])
@require_auth
def get_store(store_id):
    """Get detailed information about a specific store"""
    try:
        store = Store.query.get(store_id)
        if not store:
            return jsonify({'error': 'Store not found'}), 404
        
        store_dict = store.to_dict()
        
        # Get comprehensive statistics
        # Employee count
        employee_count = User.query.filter(
            User.store_id == store_id,
            User.is_active == True
        ).count()
        store_dict['employees_count'] = employee_count
        
        # Inventory statistics
        inventory_stats = db.session.query(
            func.count(Inventory.id).label('total_items'),
            func.sum(Inventory.quantity).label('total_quantity'),
            func.count(func.distinct(Inventory.product_id)).label('unique_products')
        ).filter(Inventory.store_id == store_id).first()
        
        store_dict['total_inventory_items'] = inventory_stats.total_items or 0
        store_dict['total_quantity'] = inventory_stats.total_quantity or 0
        store_dict['unique_products_count'] = inventory_stats.unique_products or 0
        
        # Low stock items
        low_stock_count = db.session.query(Inventory).join(Product).filter(
            Inventory.store_id == store_id,
            Inventory.quantity <= Product.min_stock_level,
            Product.is_active == True
        ).count()
        store_dict['low_stock_items_count'] = low_stock_count
        
        # Sales statistics
        today = datetime.utcnow().date()
        
        # Today's sales
        today_sales = db.session.query(
            func.sum(Sale.total_price).label('total_sales'),
            func.count(Sale.id).label('order_count')
        ).filter(
            Sale.store_id == store_id,
            func.date(Sale.sale_date) == today
        ).first()
        
        store_dict['total_sales_today'] = today_sales.total_sales or 0
        store_dict['orders_today'] = today_sales.order_count or 0
        
        # Yesterday's sales for comparison
        yesterday = today - timedelta(days=1)
        yesterday_sales = db.session.query(
            func.sum(Sale.total_price).label('total_sales')
        ).filter(
            Sale.store_id == store_id,
            func.date(Sale.sale_date) == yesterday
        ).scalar()
        
        store_dict['total_sales_yesterday'] = yesterday_sales or 0
        
        # Monthly revenue
        month_start = today.replace(day=1)
        monthly_revenue = db.session.query(
            func.sum(Sale.total_price).label('revenue')
        ).filter(
            Sale.store_id == store_id,
            func.date(Sale.sale_date) >= month_start
        ).scalar()
        
        store_dict['monthly_revenue'] = monthly_revenue or 0
        
        # Top selling products
        top_products = db.session.query(
            Product.name,
            func.sum(Sale.quantity).label('total_sold'),
            func.sum(Sale.total_price).label('total_revenue')
        ).join(Sale, Product.id == Sale.product_id).filter(
            Sale.store_id == store_id,
            func.date(Sale.sale_date) >= month_start
        ).group_by(Product.id, Product.name).order_by(
            desc('total_sold')
        ).limit(5).all()
        
        store_dict['top_products'] = [
            {
                'name': name,
                'total_sold': total_sold,
                'total_revenue': total_revenue
            }
            for name, total_sold, total_revenue in top_products
        ]
        
        # Top categories
        top_categories = db.session.query(
            Product.category_id,
            func.count(Sale.id).label('sales_count'),
            func.sum(Sale.total_price).label('total_revenue')
        ).join(Sale, Product.id == Sale.product_id).filter(
            Sale.store_id == store_id,
            func.date(Sale.sale_date) >= month_start
        ).group_by(Product.category_id).order_by(
            desc('total_revenue')
        ).limit(5).all()
        
        # Get category names
        category_ids = [cat[0] for cat in top_categories]
        categories = db.session.query(Product.category_id, Product.category).filter(
            Product.category_id.in_(category_ids)
        ).distinct().all()
        
        category_map = {cat_id: cat for cat_id, cat in categories}
        
        store_dict['top_categories'] = [
            {
                'category_id': cat_id,
                'category_name': category_map.get(cat_id, 'Unknown'),
                'sales_count': sales_count,
                'total_revenue': total_revenue
            }
            for cat_id, sales_count, total_revenue in top_categories
        ]
        
        return jsonify({'store': store_dict}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch store details: {str(e)}'}), 500

@stores_bp.route('/api/stores/<int:store_id>/products', methods=['GET'])
@require_auth
def get_store_products(store_id):
    """Get all products available at a specific store"""
    try:
        # Verify store exists
        store = Store.query.get(store_id)
        if not store:
            return jsonify({'error': 'Store not found'}), 404
        
        # Get query parameters
        search = request.args.get('search', '').strip()
        category_id = request.args.get('category_id', type=int)
        status = request.args.get('status', '')
        sort_by = request.args.get('sort_by', 'name')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Build base query - get products that have inventory at this store
        query = db.session.query(Product).join(Inventory).filter(
            Inventory.store_id == store_id,
            Product.is_active == True
        ).distinct()
        
        # Apply search filter
        if search:
            search_filter = or_(
                Product.name.ilike(f'%{search}%'),
                Product.code.ilike(f'%{search}%'),
                Product.barcode.ilike(f'%{search}%'),
                Product.brand.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        # Apply category filter
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        # Apply status filter
        if status:
            if status == 'active':
                query = query.filter(Product.status == 'active')
            elif status == 'inactive':
                query = query.filter(Product.status == 'inactive')
            elif status == 'low_stock':
                query = query.filter(Product.min_stock_level > 0)
                # This would need a more complex subquery for actual low stock
            elif status == 'out_of_stock':
                query = query.filter(Inventory.quantity <= 0)
        
        # Apply sorting
        if hasattr(Product, sort_by):
            if sort_order == 'desc':
                query = query.order_by(desc(getattr(Product, sort_by)))
            else:
                query = query.order_by(asc(getattr(Product, sort_by)))
        else:
            query = query.order_by(Product.name)
        
        products = query.all()
        
        # Enhance products with store-specific inventory data
        products_data = []
        for product in products:
            product_dict = product.to_dict()
            
            # Get inventory for this store
            inventory = Inventory.query.filter(
                Inventory.store_id == store_id,
                Inventory.product_id == product.id
            ).first()
            
            if inventory:
                product_dict['store_quantity'] = inventory.quantity
                product_dict['store_min_stock'] = inventory.min_stock
                product_dict['store_is_low_stock'] = inventory.is_low_stock
            else:
                product_dict['store_quantity'] = 0
                product_dict['store_min_stock'] = 0
                product_dict['store_is_low_stock'] = False
            
            # Override total_stock with store-specific quantity
            product_dict['total_stock'] = product_dict['store_quantity']
            product_dict['is_low_stock'] = product_dict['store_is_low_stock']
            product_dict['is_out_of_stock'] = product_dict['store_quantity'] <= 0
            
            products_data.append(product_dict)
        
        return jsonify({
            'products': products_data,
            'total': len(products_data),
            'store': {
                'id': store.id,
                'name': store.name,
                'city': store.city,
                'state': store.state
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch store products: {str(e)}'}), 500

@stores_bp.route('/api/stores', methods=['POST'])
@require_auth
@require_permission('admin')
def create_store():
    """Create a new store"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'city', 'state', 'country']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new store
        store = Store(
            name=data['name'],
            code=data.get('code', ''),
            address=data.get('address', ''),
            city=data['city'],
            state=data['state'],
            postal_code=data.get('postal_code', ''),
            country=data['country'],
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            manager_name=data.get('manager_name', ''),
            image=data.get('image', ''),
            timezone=data.get('timezone', 'UTC'),
            operating_hours=data.get('operating_hours', ''),
            is_active=data.get('is_active', True),
            opening_date=data.get('opening_date'),
            square_footage=data.get('square_footage'),
            customer_rating=data.get('customer_rating', 0.0)
        )
        
        db.session.add(store)
        db.session.commit()
        
        return jsonify({
            'message': 'Store created successfully',
            'store': store.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create store: {str(e)}'}), 500

@stores_bp.route('/api/stores/<int:store_id>', methods=['PUT'])
@require_auth
@require_permission('admin')
def update_store(store_id):
    """Update an existing store"""
    try:
        store = Store.query.get(store_id)
        if not store:
            return jsonify({'error': 'Store not found'}), 404
        
        data = request.get_json()
        
        # Update store fields
        updatable_fields = [
            'name', 'code', 'address', 'city', 'state', 'postal_code', 'country',
            'phone', 'email', 'manager_name', 'image', 'timezone', 'operating_hours',
            'is_active', 'opening_date', 'square_footage', 'customer_rating'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(store, field, data[field])
        
        store.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Store updated successfully',
            'store': store.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update store: {str(e)}'}), 500

@stores_bp.route('/api/stores/<int:store_id>', methods=['DELETE'])
@require_auth
@require_permission('admin')
def delete_store(store_id):
    """Deactivate a store (soft delete)"""
    try:
        store = Store.query.get(store_id)
        if not store:
            return jsonify({'error': 'Store not found'}), 404
        
        # Soft delete - set as inactive
        store.is_active = False
        store.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Store deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to deactivate store: {str(e)}'}), 500

# =============================================================================
# STORE STATISTICS AND ANALYTICS
# =============================================================================

@stores_bp.route('/api/stores/statistics', methods=['GET'])
@require_auth
def get_stores_statistics():
    """Get overall statistics for all stores"""
    try:
        # Total stores
        total_stores = Store.query.filter(Store.is_active == True).count()
        
        # Total employees across all stores
        total_employees = User.query.filter(
            User.is_active == True,
            User.store_id.isnot(None)
        ).count()
        
        # Total inventory items across all stores
        total_inventory_items = db.session.query(
            func.sum(Inventory.quantity).label('total_items')
        ).scalar() or 0
        
        # Total unique products across all stores
        unique_products = db.session.query(
            func.count(func.distinct(Inventory.product_id)).label('unique_products')
        ).scalar() or 0
        
        # Low stock items across all stores
        low_stock_items = db.session.query(Inventory).join(Product).filter(
            Inventory.quantity <= Product.min_stock_level,
            Product.is_active == True
        ).count()
        
        # Today's total sales across all stores
        today = datetime.utcnow().date()
        today_sales = db.session.query(
            func.sum(Sale.total_price).label('total_sales'),
            func.count(Sale.id).label('order_count')
        ).filter(func.date(Sale.sale_date) == today).first()
        
        # Monthly revenue across all stores
        month_start = today.replace(day=1)
        monthly_revenue = db.session.query(
            func.sum(Sale.total_price).label('revenue')
        ).filter(func.date(Sale.sale_date) >= month_start).scalar() or 0
        
        return jsonify({
            'statistics': {
                'total_stores': total_stores,
                'total_employees': total_employees,
                'total_inventory_items': total_inventory_items,
                'unique_products': unique_products,
                'low_stock_items': low_stock_items,
                'today_sales': today_sales.total_sales or 0,
                'today_orders': today_sales.order_count or 0,
                'monthly_revenue': monthly_revenue
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch store statistics: {str(e)}'}), 500
