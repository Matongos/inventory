"""
Dashboard API Routes
Provides comprehensive analytics and metrics for the dashboard/home page
"""

from flask import Blueprint, request, jsonify, session
from models import User, Product, Category, Store, Inventory, Sale, db
from auth_decorators import require_auth
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
import json

# Create Blueprint for dashboard routes
dashboard_bp = Blueprint('dashboard', __name__)

# =============================================================================
# DASHBOARD OVERVIEW ROUTES
# =============================================================================

@dashboard_bp.route('/api/dashboard/overview', methods=['GET'])
@require_auth
def get_dashboard_overview():
    """
    Get main dashboard overview metrics
    Returns key performance indicators and summary statistics
    """
    try:
        # Calculate date ranges
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)
        last_30_days = today - timedelta(days=30)
        last_7_days = today - timedelta(days=7)
        
        # Basic counts
        total_products = Product.query.filter_by(is_active=True).count()
        total_categories = Category.query.filter_by(is_active=True).count()
        total_stores = Store.query.filter_by(is_active=True).count()
        total_users = User.query.filter_by(is_active=True).count()
        
        # Sales metrics
        today_sales = db.session.query(func.sum(Sale.total_price)).filter(
            func.date(Sale.sale_date) == today
        ).scalar() or 0
        
        yesterday_sales = db.session.query(func.sum(Sale.total_price)).filter(
            func.date(Sale.sale_date) == yesterday
        ).scalar() or 0
        
        last_30_days_sales = db.session.query(func.sum(Sale.total_price)).filter(
            Sale.sale_date >= last_30_days
        ).scalar() or 0
        
        # Orders/transactions
        today_orders = Sale.query.filter(func.date(Sale.sale_date) == today).count()
        last_7_days_orders = Sale.query.filter(Sale.sale_date >= last_7_days).count()
        
        # Stock metrics
        total_inventory = db.session.query(func.sum(Inventory.quantity)).scalar() or 0
        low_stock_items = Inventory.query.filter(
            Inventory.quantity <= Inventory.min_stock
        ).count()
        
        out_of_stock_items = Inventory.query.filter(
            Inventory.quantity <= 0
        ).count()
        
        # Calculate growth percentages
        sales_growth = 0
        if yesterday_sales > 0:
            sales_growth = ((today_sales - yesterday_sales) / yesterday_sales) * 100
        
        return jsonify({
            'overview': {
                'total_products': total_products,
                'total_categories': total_categories,
                'total_stores': total_stores,
                'total_users': total_users,
                'total_inventory_items': int(total_inventory),
                'low_stock_items': low_stock_items,
                'out_of_stock_items': out_of_stock_items
            },
            'sales_metrics': {
                'today_sales': round(float(today_sales), 2),
                'yesterday_sales': round(float(yesterday_sales), 2),
                'last_30_days_sales': round(float(last_30_days_sales), 2),
                'sales_growth_percentage': round(sales_growth, 2),
                'today_orders': today_orders,
                'last_7_days_orders': last_7_days_orders
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch dashboard overview: {str(e)}'}), 500

@dashboard_bp.route('/api/dashboard/recent-activity', methods=['GET'])
@require_auth
def get_recent_activity():
    """
    Get recent activity and events for the dashboard
    Returns recent sales, low stock alerts, and system events
    """
    try:
        # Get recent sales (last 10)
        recent_sales = Sale.query.order_by(desc(Sale.created_at)).limit(10).all()
        
        # Get recent low stock alerts
        low_stock_products = db.session.query(Product, Inventory).join(
            Inventory, Product.id == Inventory.product_id
        ).filter(
            Inventory.quantity <= Inventory.min_stock,
            Product.is_active == True
        ).order_by(Inventory.quantity.asc()).limit(5).all()
        
        # Get recently added products (last 5)
        new_products = Product.query.filter_by(is_active=True).order_by(
            desc(Product.created_at)
        ).limit(5).all()
        
        # Format recent sales
        sales_activity = []
        for sale in recent_sales:
            sales_activity.append({
                'type': 'sale',
                'title': f'Sale #{sale.order_number}',
                'description': f'{sale.product.name} - {sale.quantity} units - ${sale.total_price:.2f}',
                'store': sale.store.name,
                'timestamp': sale.created_at.isoformat(),
                'icon': '💰',
                'color': '#10B981'
            })
        
        # Format low stock alerts
        stock_alerts = []
        for product, inventory in low_stock_products:
            stock_alerts.append({
                'type': 'low_stock',
                'title': f'Low Stock Alert',
                'description': f'{product.name} - Only {inventory.quantity} left in {inventory.store.name}',
                'store': inventory.store.name,
                'timestamp': inventory.last_updated.isoformat() if inventory.last_updated else datetime.utcnow().isoformat(),
                'icon': '⚠️',
                'color': '#F59E0B'
            })
        
        # Format new products
        product_activity = []
        for product in new_products:
            product_activity.append({
                'type': 'new_product',
                'title': f'New Product Added',
                'description': f'{product.name} - {product.category.name}',
                'store': 'System',
                'timestamp': product.created_at.isoformat(),
                'icon': '📦',
                'color': '#6366F1'
            })
        
        # Combine and sort all activities by timestamp
        all_activities = sales_activity + stock_alerts + product_activity
        all_activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'recent_activity': all_activities[:15],  # Return top 15 most recent
            'summary': {
                'recent_sales_count': len(sales_activity),
                'low_stock_alerts_count': len(stock_alerts),
                'new_products_count': len(product_activity)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch recent activity: {str(e)}'}), 500

@dashboard_bp.route('/api/dashboard/sales-chart', methods=['GET'])
@require_auth
def get_sales_chart_data():
    """
    Get sales data for charts and graphs
    Returns sales by status, daily sales trends, and category breakdown
    """
    try:
        # Get date range from query params (default to last 30 days)
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        # Sales by status
        status_sales = db.session.query(
            Sale.status,
            func.count(Sale.id).label('count'),
            func.sum(Sale.total_price).label('total_value')
        ).filter(
            Sale.sale_date >= start_date
        ).group_by(Sale.status).all()
        
        sales_by_status = []
        for status, count, total_value in status_sales:
            sales_by_status.append({
                'status': status.title(),
                'count': count,
                'total_value': round(float(total_value or 0), 2),
                'color': {
                    'confirmed': '#10B981',
                    'packed': '#F59E0B', 
                    'shipped': '#3B82F6',
                    'delivered': '#8B5CF6',
                    'refunded': '#EF4444',
                    'cancelled': '#6B7280'
                }.get(status, '#6B7280')
            })
        
        # Daily sales trend
        daily_sales = db.session.query(
            func.date(Sale.sale_date).label('date'),
            func.count(Sale.id).label('orders'),
            func.sum(Sale.total_price).label('revenue')
        ).filter(
            Sale.sale_date >= start_date
        ).group_by(func.date(Sale.sale_date)).order_by('date').all()
        
        daily_trend = []
        for date, orders, revenue in daily_sales:
            daily_trend.append({
                'date': date.isoformat(),
                'orders': orders,
                'revenue': round(float(revenue or 0), 2)
            })
        
        # Sales by category
        category_sales = db.session.query(
            Category.name,
            Category.icon,
            Category.color,
            func.count(Sale.id).label('sales_count'),
            func.sum(Sale.total_price).label('total_revenue')
        ).join(Product, Category.id == Product.category_id).join(
            Sale, Product.id == Sale.product_id
        ).filter(
            Sale.sale_date >= start_date
        ).group_by(Category.id).order_by(desc('total_revenue')).all()
        
        category_breakdown = []
        for name, icon, color, count, revenue in category_sales:
            category_breakdown.append({
                'category': name,
                'icon': icon,
                'color': color,
                'sales_count': count,
                'revenue': round(float(revenue or 0), 2)
            })
        
        return jsonify({
            'sales_by_status': sales_by_status,
            'daily_trend': daily_trend,
            'category_breakdown': category_breakdown,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch sales chart data: {str(e)}'}), 500

@dashboard_bp.route('/api/dashboard/inventory-stats', methods=['GET'])
@require_auth
def get_inventory_stats():
    """
    Get inventory statistics and stock information
    Returns stock levels, categories, and store-wise breakdown
    """
    try:
        # Stock level statistics
        total_stock = db.session.query(func.sum(Inventory.quantity)).scalar() or 0
        
        # Low stock items (quantity <= min_stock)
        low_stock_query = db.session.query(
            Product.name,
            Product.code,
            Category.name.label('category_name'),
            Category.icon,
            Store.name.label('store_name'),
            Inventory.quantity,
            Inventory.min_stock
        ).join(Product, Inventory.product_id == Product.id).join(
            Category, Product.category_id == Category.id
        ).join(Store, Inventory.store_id == Store.id).filter(
            Inventory.quantity <= Inventory.min_stock,
            Product.is_active == True
        ).order_by(Inventory.quantity.asc()).limit(10).all()
        
        low_stock_items = []
        for name, code, cat_name, icon, store_name, quantity, min_stock in low_stock_query:
            low_stock_items.append({
                'product_name': name,
                'product_code': code,
                'category': cat_name,
                'category_icon': icon,
                'store': store_name,
                'current_stock': quantity,
                'min_stock': min_stock,
                'urgency': 'critical' if quantity == 0 else 'low' if quantity <= min_stock * 0.5 else 'warning'
            })
        
        # Stock by category
        category_stock = db.session.query(
            Category.name,
            Category.icon,
            Category.color,
            func.sum(Inventory.quantity).label('total_stock'),
            func.count(Product.id.distinct()).label('product_count')
        ).join(Product, Category.id == Product.category_id).join(
            Inventory, Product.id == Inventory.product_id
        ).filter(
            Product.is_active == True,
            Category.is_active == True
        ).group_by(Category.id).order_by(desc('total_stock')).all()
        
        stock_by_category = []
        for name, icon, color, stock, product_count in category_stock:
            stock_by_category.append({
                'category': name,
                'icon': icon,
                'color': color,
                'total_stock': int(stock or 0),
                'product_count': product_count,
                'percentage': round((float(stock or 0) / float(total_stock)) * 100, 1) if total_stock > 0 else 0
            })
        
        # Stock by store
        store_stock = db.session.query(
            Store.name,
            Store.code,
            Store.city,
            func.sum(Inventory.quantity).label('total_stock'),
            func.count(Inventory.id).label('inventory_records')
        ).join(Inventory, Store.id == Inventory.store_id).filter(
            Store.is_active == True
        ).group_by(Store.id).order_by(desc('total_stock')).all()
        
        stock_by_store = []
        for name, code, city, stock, records in store_stock:
            stock_by_store.append({
                'store_name': name,
                'store_code': code,
                'city': city,
                'total_stock': int(stock or 0),
                'inventory_records': records
            })
        
        return jsonify({
            'summary': {
                'total_stock': int(total_stock),
                'low_stock_count': len(low_stock_items),
                'categories_count': len(stock_by_category),
                'stores_count': len(stock_by_store)
            },
            'low_stock_items': low_stock_items,
            'stock_by_category': stock_by_category,
            'stock_by_store': stock_by_store
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch inventory stats: {str(e)}'}), 500

@dashboard_bp.route('/api/dashboard/stores-overview', methods=['GET'])
@require_auth
def get_stores_overview():
    """
    Get stores overview with performance metrics
    Returns store list with employee counts, inventory, and sales data
    """
    try:
        # Get all active stores with comprehensive data
        stores = Store.query.filter_by(is_active=True).all()
        
        stores_data = []
        for store in stores:
            # Get recent sales (last 30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            recent_sales = db.session.query(func.sum(Sale.total_price)).filter(
                Sale.store_id == store.id,
                Sale.sale_date >= thirty_days_ago
            ).scalar() or 0
            
            # Get today's sales
            today = datetime.utcnow().date()
            today_sales = db.session.query(func.sum(Sale.total_price)).filter(
                Sale.store_id == store.id,
                func.date(Sale.sale_date) == today
            ).scalar() or 0
            
            stores_data.append({
                'id': store.id,
                'name': store.name,
                'code': store.code,
                'city': store.city,
                'state': store.state,
                'full_address': store.full_address,
                'phone': store.phone,
                'manager_name': store.manager_name,
                'image': store.image,
                'customer_rating': store.customer_rating,
                'employees_count': store.employees_count,
                'total_inventory_items': store.total_inventory_items,
                'unique_products_count': store.unique_products_count,
                'low_stock_items_count': store.low_stock_items_count,
                'today_sales': round(float(today_sales), 2),
                'monthly_revenue': round(float(recent_sales), 2),
                'opening_date': store.opening_date.isoformat() if store.opening_date else None
            })
        
        # Sort by monthly revenue (descending)
        stores_data.sort(key=lambda x: x['monthly_revenue'], reverse=True)
        
        return jsonify({
            'stores': stores_data,
            'total_stores': len(stores_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stores overview: {str(e)}'}), 500

@dashboard_bp.route('/api/dashboard/top-categories', methods=['GET'])
@require_auth
def get_top_categories():
    """
    Get top performing categories with metrics
    Returns categories sorted by performance with icons and statistics
    """
    try:
        # Get categories with comprehensive metrics
        categories_data = db.session.query(
            Category.id,
            Category.name,
            Category.description,
            Category.icon,
            Category.color,
            func.count(Product.id.distinct()).label('product_count'),
            func.coalesce(func.sum(Inventory.quantity), 0).label('total_stock'),
            func.count(Sale.id).label('total_sales'),
            func.coalesce(func.sum(Sale.total_price), 0).label('total_revenue')
        ).outerjoin(Product, Category.id == Product.category_id).outerjoin(
            Inventory, Product.id == Inventory.product_id
        ).outerjoin(Sale, Product.id == Sale.product_id).filter(
            Category.is_active == True
        ).group_by(Category.id).order_by(desc('total_revenue')).all()
        
        top_categories = []
        for (cat_id, name, desc, icon, color, product_count, 
             total_stock, total_sales, total_revenue) in categories_data:
            
            # Get low stock count for this category
            low_stock_count = db.session.query(func.count(Inventory.id)).join(
                Product, Inventory.product_id == Product.id
            ).filter(
                Product.category_id == cat_id,
                Inventory.quantity <= Inventory.min_stock
            ).scalar() or 0
            
            top_categories.append({
                'id': cat_id,
                'name': name,
                'description': desc,
                'icon': icon,
                'color': color,
                'product_count': product_count or 0,
                'total_stock': int(total_stock or 0),
                'total_sales': total_sales or 0,
                'total_revenue': round(float(total_revenue or 0), 2),
                'low_stock_count': low_stock_count,
                'performance_score': round(float(total_revenue or 0) / max(product_count or 1, 1), 2)
            })
        
        return jsonify({
            'categories': top_categories,
            'total_categories': len(top_categories)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch top categories: {str(e)}'}), 500
