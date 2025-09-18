"""
Categories API Routes
Comprehensive category management with CRUD operations, icons, and product relationships
"""

from flask import Blueprint, request, jsonify, session
from models import Category, Product, Inventory, Sale, db
from auth_decorators import require_auth, require_permission
from sqlalchemy import func, desc, asc
from datetime import datetime
import json

# Create Blueprint for category routes
categories_bp = Blueprint('categories', __name__)

# =============================================================================
# CATEGORY CRUD OPERATIONS
# =============================================================================

@categories_bp.route('/api/categories', methods=['GET'])
@require_auth
def get_categories():
    """
    Get all categories with comprehensive metrics
    Returns categories with product counts, stock levels, and sales data
    """
    try:
        # Get categories with product and inventory metrics
        categories_data = db.session.query(
            Category.id,
            Category.name,
            Category.description,
            Category.icon,
            Category.color,
            Category.parent_id,
            Category.is_active,
            Category.sort_order,
            Category.created_at,
            Category.updated_at,
            func.count(Product.id.distinct()).label('product_count'),
            func.coalesce(func.sum(Inventory.quantity), 0).label('total_stock'),
            func.count(Sale.id).label('total_sales'),
            func.coalesce(func.sum(Sale.total_price), 0).label('total_revenue')
        ).outerjoin(Product, Category.id == Product.category_id).outerjoin(
            Inventory, Product.id == Inventory.product_id
        ).outerjoin(Sale, Product.id == Sale.product_id).filter(
            Category.is_active == True
        ).group_by(Category.id).order_by(Category.sort_order, Category.name).all()
        
        categories_list = []
        for (cat_id, name, desc, icon, color, parent_id, is_active, sort_order,
             created_at, updated_at, product_count, total_stock, total_sales, total_revenue) in categories_data:
            
            # Get low stock count for this category
            low_stock_count = db.session.query(func.count(Inventory.id)).join(
                Product, Inventory.product_id == Product.id
            ).filter(
                Product.category_id == cat_id,
                Product.is_active == True,
                Inventory.quantity <= Inventory.min_stock
            ).scalar() or 0
            
            # Get out of stock count
            out_of_stock_count = db.session.query(func.count(Inventory.id)).join(
                Product, Inventory.product_id == Product.id
            ).filter(
                Product.category_id == cat_id,
                Product.is_active == True,
                Inventory.quantity <= 0
            ).scalar() or 0
            
            category_data = {
                'id': cat_id,
                'name': name,
                'description': desc,
                'icon': icon,
                'color': color,
                'parent_id': parent_id,
                'is_active': is_active,
                'sort_order': sort_order,
                'created_at': created_at.isoformat(),
                'updated_at': updated_at.isoformat(),
                'product_count': product_count or 0,
                'total_stock': int(total_stock or 0),
                'total_sales': total_sales or 0,
                'total_revenue': round(float(total_revenue or 0), 2),
                'low_stock_count': low_stock_count,
                'out_of_stock_count': out_of_stock_count,
                'performance_score': round(float(total_revenue or 0) / max(product_count or 1, 1), 2)
            }
            categories_list.append(category_data)
        
        return jsonify({
            'categories': categories_list,
            'total': len(categories_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500

@categories_bp.route('/api/categories/<int:category_id>', methods=['GET'])
@require_auth
def get_category(category_id):
    """
    Get detailed information about a specific category
    """
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Get products in this category
        products = Product.query.filter_by(category_id=category_id, is_active=True).all()
        
        # Get category statistics
        total_stock = 0
        low_stock_count = 0
        out_of_stock_count = 0
        
        for product in products:
            for inventory in product.inventory:
                total_stock += inventory.quantity
                if inventory.quantity <= inventory.min_stock:
                    low_stock_count += 1
                if inventory.quantity <= 0:
                    out_of_stock_count += 1
        
        # Get sales data (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_sales = db.session.query(
            func.count(Sale.id).label('sales_count'),
            func.sum(Sale.total_price).label('total_revenue')
        ).join(Product, Sale.product_id == Product.id).filter(
            Product.category_id == category_id,
            Sale.sale_date >= thirty_days_ago
        ).first()
        
        category_data = {
            'id': category.id,
            'name': category.name,
            'description': category.description,
            'icon': category.icon,
            'color': category.color,
            'parent_id': category.parent_id,
            'is_active': category.is_active,
            'sort_order': category.sort_order,
            'created_at': category.created_at.isoformat(),
            'updated_at': category.updated_at.isoformat(),
            'product_count': len(products),
            'total_stock': total_stock,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'recent_sales_count': recent_sales.sales_count or 0,
            'recent_revenue': round(float(recent_sales.total_revenue or 0), 2),
            'products': [
                {
                    'id': p.id,
                    'name': p.name,
                    'code': p.code,
                    'selling_price': float(p.selling_price or 0),
                    'total_stock': sum(inv.quantity for inv in p.inventory),
                    'is_low_stock': any(inv.quantity <= inv.min_stock for inv in p.inventory)
                } for p in products[:10]  # Limit to 10 products for performance
            ]
        }
        
        return jsonify(category_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch category: {str(e)}'}), 500

@categories_bp.route('/api/categories', methods=['POST'])
@require_auth
def create_category():
    """
    Create a new category
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category name is unique
        if Category.query.filter_by(name=data['name'].strip()).first():
            return jsonify({'error': 'Category name already exists'}), 400
        
        # Get the next sort order
        max_sort_order = db.session.query(func.max(Category.sort_order)).scalar() or 0
        
        # Create new category
        category = Category(
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            icon=data.get('icon', '📦'),
            color=data.get('color', '#6366F1'),
            parent_id=data.get('parent_id'),
            is_active=data.get('is_active', True),
            sort_order=max_sort_order + 1
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category_id': category.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create category: {str(e)}'}), 500

@categories_bp.route('/api/categories/<int:category_id>', methods=['PUT'])
@require_auth
def update_category(category_id):
    """
    Update an existing category
    """
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        data = request.get_json()
        
        # Check if name is unique (if being updated)
        if 'name' in data and data['name'] != category.name:
            if Category.query.filter_by(name=data['name'].strip()).first():
                return jsonify({'error': 'Category name already exists'}), 400
        
        # Update category fields
        updatable_fields = ['name', 'description', 'icon', 'color', 'parent_id', 'is_active', 'sort_order']
        
        for field in updatable_fields:
            if field in data:
                if field in ['is_active']:
                    setattr(category, field, bool(data[field]))
                elif field in ['parent_id', 'sort_order']:
                    setattr(category, field, int(data[field]) if data[field] else None)
                else:
                    setattr(category, field, str(data[field]).strip() if data[field] else '')
        
        category.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Category updated successfully',
            'category_id': category.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update category: {str(e)}'}), 500

@categories_bp.route('/api/categories/<int:category_id>', methods=['DELETE'])
@require_permission('admin')
def delete_category(category_id):
    """
    Soft delete a category (set is_active to False)
    Only superusers can delete categories
    """
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Check if category has products
        product_count = Product.query.filter_by(category_id=category_id, is_active=True).count()
        if product_count > 0:
            return jsonify({
                'error': f'Cannot delete category with {product_count} active products. Please reassign or deactivate products first.'
            }), 400
        
        # Soft delete - set is_active to False
        category.is_active = False
        category.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Category deactivated successfully',
            'category_id': category.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to deactivate category: {str(e)}'}), 500

# =============================================================================
# HELPER ENDPOINTS
# =============================================================================

@categories_bp.route('/api/categories/icons', methods=['GET'])
@require_auth
def get_category_icons():
    """
    Get available icons for categories
    """
    try:
        # Predefined category icons
        icons = [
            {'icon': '👕', 'name': 'Clothing', 'description': 'General clothing items'},
            {'icon': '👖', 'name': 'Bottoms', 'description': 'Pants, shorts, skirts'},
            {'icon': '🧥', 'name': 'Coats', 'description': 'Jackets, coats, outerwear'},
            {'icon': '👗', 'name': 'Dresses', 'description': 'Dresses and formal wear'},
            {'icon': '👟', 'name': 'Footwear', 'description': 'Shoes, boots, sandals'},
            {'icon': '👜', 'name': 'Accessories', 'description': 'Bags, jewelry, accessories'},
            {'icon': '🎽', 'name': 'Tops', 'description': 'T-shirts, blouses, tops'},
            {'icon': '👔', 'name': 'Formal', 'description': 'Business and formal wear'},
            {'icon': '🩳', 'name': 'Underwear', 'description': 'Undergarments and intimates'},
            {'icon': '🧢', 'name': 'Headwear', 'description': 'Hats, caps, headwear'},
            {'icon': '🧤', 'name': 'Gloves', 'description': 'Gloves and hand accessories'},
            {'icon': '🧣', 'name': 'Scarves', 'description': 'Scarves and neck accessories'},
            {'icon': '👓', 'name': 'Eyewear', 'description': 'Glasses and sunglasses'},
            {'icon': '⌚', 'name': 'Watches', 'description': 'Watches and timepieces'},
            {'icon': '💍', 'name': 'Jewelry', 'description': 'Rings, necklaces, jewelry'},
            {'icon': '🎒', 'name': 'Bags', 'description': 'Backpacks, purses, bags'},
            {'icon': '🏃', 'name': 'Sports', 'description': 'Athletic and sports wear'},
            {'icon': '🏖️', 'name': 'Swimwear', 'description': 'Swimsuits and beach wear'},
            {'icon': '❄️', 'name': 'Winter', 'description': 'Winter and cold weather gear'},
            {'icon': '☀️', 'name': 'Summer', 'description': 'Summer and warm weather items'}
        ]
        
        return jsonify({'icons': icons}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch icons: {str(e)}'}), 500

@categories_bp.route('/api/categories/colors', methods=['GET'])
@require_auth
def get_category_colors():
    """
    Get available colors for categories
    """
    try:
        # Predefined color palette
        colors = [
            {'color': '#FF6B6B', 'name': 'Red'},
            {'color': '#4ECDC4', 'name': 'Teal'},
            {'color': '#45B7D1', 'name': 'Blue'},
            {'color': '#96CEB4', 'name': 'Green'},
            {'color': '#FFEAA7', 'name': 'Yellow'},
            {'color': '#DDA0DD', 'name': 'Plum'},
            {'color': '#98D8C8', 'name': 'Mint'},
            {'color': '#F7DC6F', 'name': 'Gold'},
            {'color': '#BB8FCE', 'name': 'Purple'},
            {'color': '#85C1E9', 'name': 'Sky Blue'},
            {'color': '#F8C471', 'name': 'Orange'},
            {'color': '#82E0AA', 'name': 'Light Green'},
            {'color': '#F1948A', 'name': 'Pink'},
            {'color': '#85929E', 'name': 'Gray'},
            {'color': '#D7BDE2', 'name': 'Lavender'},
            {'color': '#A9DFBF', 'name': 'Sage'}
        ]
        
        return jsonify({'colors': colors}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch colors: {str(e)}'}), 500

@categories_bp.route('/api/categories/stats', methods=['GET'])
@require_auth
def get_categories_stats():
    """
    Get category statistics for the categories page
    """
    try:
        # Basic counts
        total_categories = Category.query.filter_by(is_active=True).count()
        
        # Categories with products
        categories_with_products = db.session.query(Category.id).join(
            Product, Category.id == Product.category_id
        ).filter(
            Category.is_active == True,
            Product.is_active == True
        ).distinct().count()
        
        # Empty categories
        empty_categories = total_categories - categories_with_products
        
        # Total products across all categories
        total_products = db.session.query(func.count(Product.id)).join(
            Category, Product.category_id == Category.id
        ).filter(
            Category.is_active == True,
            Product.is_active == True
        ).scalar() or 0
        
        # Average products per category
        avg_products_per_category = round(total_products / max(categories_with_products, 1), 1)
        
        return jsonify({
            'stats': {
                'total_categories': total_categories,
                'categories_with_products': categories_with_products,
                'empty_categories': empty_categories,
                'total_products': total_products,
                'avg_products_per_category': avg_products_per_category
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch category stats: {str(e)}'}), 500


