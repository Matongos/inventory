"""
Finance API Routes
Comprehensive financial analytics, reporting, and business intelligence
"""

from flask import Blueprint, request, jsonify
from models import Product, Category, Store, Sale, Inventory, User, db
from auth_decorators import require_auth, require_permission
from sqlalchemy import func, desc, asc, and_, or_, extract
from datetime import datetime, timedelta
import json

# Create Blueprint for finance routes
finance_bp = Blueprint('finance', __name__)

# =============================================================================
# FINANCIAL ANALYTICS ENDPOINTS
# =============================================================================

@finance_bp.route('/api/finance/analytics', methods=['GET'])
@require_auth
def get_financial_analytics():
    """Get comprehensive financial analytics for a date range"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Calculate previous period for comparison
        period_length = (end_date - start_date).days
        previous_start = start_date - timedelta(days=period_length + 1)
        previous_end = start_date - timedelta(days=1)
        
        # Current period analytics
        current_sales = db.session.query(
            func.sum(Sale.total_price).label('total_revenue'),
            func.sum(Sale.unit_cost * Sale.quantity).label('total_cost'),
            func.count(Sale.id).label('total_orders'),
            func.sum(Sale.quantity).label('total_items_sold'),
            func.avg(Sale.total_price).label('average_order_value')
        ).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).first()
        
        # Previous period analytics for comparison
        previous_sales = db.session.query(
            func.sum(Sale.total_price).label('total_revenue')
        ).filter(
            Sale.sale_date.between(previous_start, previous_end),
            Sale.status != 'cancelled'
        ).first()
        
        # Calculate metrics
        total_revenue = float(current_sales.total_revenue or 0)
        total_cost = float(current_sales.total_cost or 0)
        gross_profit = total_revenue - total_cost
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        analytics = {
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'gross_profit': gross_profit,
            'profit_margin': profit_margin,
            'total_orders': current_sales.total_orders or 0,
            'total_items_sold': current_sales.total_items_sold or 0,
            'average_order_value': float(current_sales.average_order_value or 0),
            'previous_revenue': float(previous_sales.total_revenue or 0) if previous_sales else 0
        }
        
        return jsonify({'analytics': analytics}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch financial analytics: {str(e)}'}), 500

@finance_bp.route('/api/finance/margins', methods=['GET'])
@require_auth
def get_profit_margins():
    """Get detailed profit margin analysis"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get margin analysis
        margin_data = db.session.query(
            func.sum(Sale.total_price).label('revenue'),
            func.sum(Sale.unit_cost * Sale.quantity).label('cost'),
            func.sum(Sale.total_price - (Sale.unit_cost * Sale.quantity)).label('profit')
        ).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).first()
        
        revenue = float(margin_data.revenue or 0)
        cost = float(margin_data.cost or 0)
        profit = float(margin_data.profit or 0)
        margin = (profit / revenue * 100) if revenue > 0 else 0
        
        margins = {
            'revenue': revenue,
            'cost': cost,
            'profit': profit,
            'margin': margin
        }
        
        return jsonify({'margins': margins}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profit margins: {str(e)}'}), 500

@finance_bp.route('/api/finance/category-breakdown', methods=['GET'])
@require_auth
def get_category_breakdown():
    """Get revenue breakdown by category"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get category breakdown
        category_data = db.session.query(
            Category.id,
            Category.name,
            Category.icon,
            Category.color,
            func.sum(Sale.total_price).label('revenue'),
            func.sum(Sale.total_price - (Sale.unit_cost * Sale.quantity)).label('profit'),
            func.count(Sale.id).label('orders'),
            func.sum(Sale.quantity).label('units_sold')
        ).join(Product, Category.id == Product.category_id).join(
            Sale, Product.id == Sale.product_id
        ).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).group_by(Category.id).order_by(desc('revenue')).all()
        
        categories = []
        for cat_id, name, icon, color, revenue, profit, orders, units_sold in category_data:
            revenue = float(revenue or 0)
            profit = float(profit or 0)
            profit_margin = (profit / revenue * 100) if revenue > 0 else 0
            
            categories.append({
                'id': cat_id,
                'name': name,
                'icon': icon,
                'color': color,
                'revenue': revenue,
                'profit': profit,
                'profit_margin': profit_margin,
                'orders': orders,
                'units_sold': units_sold
            })
        
        return jsonify({'categories': categories}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch category breakdown: {str(e)}'}), 500

@finance_bp.route('/api/finance/sales-trends', methods=['GET'])
@require_auth
def get_sales_trends():
    """Get daily sales trends for the specified period"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get daily sales trends
        trends_data = db.session.query(
            func.date(Sale.sale_date).label('date'),
            func.sum(Sale.total_price).label('revenue'),
            func.count(Sale.id).label('orders'),
            func.sum(Sale.quantity).label('items_sold')
        ).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).group_by(func.date(Sale.sale_date)).order_by('date').all()
        
        trends = []
        for date, revenue, orders, items_sold in trends_data:
            trends.append({
                'date': date.isoformat(),
                'revenue': float(revenue or 0),
                'orders': orders,
                'items_sold': items_sold
            })
        
        return jsonify({'trends': trends}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch sales trends: {str(e)}'}), 500

@finance_bp.route('/api/finance/top-products', methods=['GET'])
@require_auth
def get_top_products():
    """Get top performing products by revenue"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = request.args.get('limit', 10, type=int)
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get top products
        products_data = db.session.query(
            Product.id,
            Product.name,
            Product.code,
            func.sum(Sale.total_price).label('revenue'),
            func.sum(Sale.total_price - (Sale.unit_cost * Sale.quantity)).label('profit'),
            func.sum(Sale.quantity).label('units_sold'),
            func.count(Sale.id).label('orders')
        ).join(Sale, Product.id == Sale.product_id).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).group_by(Product.id).order_by(desc('revenue')).limit(limit).all()
        
        products = []
        for product_id, name, code, revenue, profit, units_sold, orders in products_data:
            revenue = float(revenue or 0)
            profit = float(profit or 0)
            profit_margin = (profit / revenue * 100) if revenue > 0 else 0
            
            products.append({
                'id': product_id,
                'name': name,
                'code': code,
                'revenue': revenue,
                'profit': profit,
                'profit_margin': profit_margin,
                'units_sold': units_sold,
                'orders': orders
            })
        
        return jsonify({'products': products}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch top products: {str(e)}'}), 500

@finance_bp.route('/api/finance/store-performance', methods=['GET'])
@require_auth
def get_store_performance():
    """Get store performance metrics"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Get store performance
        stores_data = db.session.query(
            Store.id,
            Store.name,
            Store.city,
            Store.state,
            func.sum(Sale.total_price).label('revenue'),
            func.sum(Sale.total_price - (Sale.unit_cost * Sale.quantity)).label('profit'),
            func.count(Sale.id).label('orders'),
            func.sum(Sale.quantity).label('units_sold')
        ).join(Sale, Store.id == Sale.store_id).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).group_by(Store.id).order_by(desc('revenue')).all()
        
        stores = []
        for store_id, name, city, state, revenue, profit, orders, units_sold in stores_data:
            revenue = float(revenue or 0)
            profit = float(profit or 0)
            profit_margin = (profit / revenue * 100) if revenue > 0 else 0
            
            stores.append({
                'id': store_id,
                'name': name,
                'city': city,
                'state': state,
                'revenue': revenue,
                'profit': profit,
                'profit_margin': profit_margin,
                'orders': orders,
                'units_sold': units_sold
            })
        
        return jsonify({'stores': stores}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch store performance: {str(e)}'}), 500

# =============================================================================
# FINANCIAL REPORTING ENDPOINTS
# =============================================================================

@finance_bp.route('/api/finance/report', methods=['GET'])
@require_auth
def generate_financial_report():
    """Generate comprehensive financial report"""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        report_type = request.args.get('type', 'summary')  # summary, detailed, comparison
        
        # Default to current month if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(day=1).date()
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            
        if not end_date:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        # Generate report based on type
        report_data = {
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'generated_at': datetime.utcnow().isoformat(),
            'generated_by': 'System',  # Could be user.name if available
            'report_type': report_type
        }
        
        # Get summary data
        summary = db.session.query(
            func.sum(Sale.total_price).label('total_revenue'),
            func.sum(Sale.unit_cost * Sale.quantity).label('total_cost'),
            func.count(Sale.id).label('total_orders'),
            func.sum(Sale.quantity).label('total_items_sold')
        ).filter(
            Sale.sale_date.between(start_date, end_date),
            Sale.status != 'cancelled'
        ).first()
        
        total_revenue = float(summary.total_revenue or 0)
        total_cost = float(summary.total_cost or 0)
        gross_profit = total_revenue - total_cost
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        report_data['summary'] = {
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'gross_profit': gross_profit,
            'profit_margin': profit_margin,
            'total_orders': summary.total_orders or 0,
            'total_items_sold': summary.total_items_sold or 0,
            'average_order_value': (total_revenue / summary.total_orders) if summary.total_orders else 0
        }
        
        if report_type in ['detailed', 'comparison']:
            # Add category breakdown
            category_data = db.session.query(
                Category.name,
                func.sum(Sale.total_price).label('revenue'),
                func.count(Sale.id).label('orders')
            ).join(Product, Category.id == Product.category_id).join(
                Sale, Product.id == Sale.product_id
            ).filter(
                Sale.sale_date.between(start_date, end_date),
                Sale.status != 'cancelled'
            ).group_by(Category.id).order_by(desc('revenue')).all()
            
            report_data['category_breakdown'] = [
                {
                    'category': name,
                    'revenue': float(revenue or 0),
                    'orders': orders
                }
                for name, revenue, orders in category_data
            ]
            
            # Add store performance
            store_data = db.session.query(
                Store.name,
                func.sum(Sale.total_price).label('revenue'),
                func.count(Sale.id).label('orders')
            ).join(Sale, Store.id == Sale.store_id).filter(
                Sale.sale_date.between(start_date, end_date),
                Sale.status != 'cancelled'
            ).group_by(Store.id).order_by(desc('revenue')).all()
            
            report_data['store_performance'] = [
                {
                    'store': name,
                    'revenue': float(revenue or 0),
                    'orders': orders
                }
                for name, revenue, orders in store_data
            ]
        
        return jsonify({'report': report_data}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate financial report: {str(e)}'}), 500

@finance_bp.route('/api/finance/summary', methods=['GET'])
@require_auth
def get_financial_summary():
    """Get quick financial summary for dashboard"""
    try:
        today = datetime.utcnow().date()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        
        # Today's sales
        today_sales = db.session.query(
            func.sum(Sale.total_price).label('revenue'),
            func.count(Sale.id).label('orders')
        ).filter(
            func.date(Sale.sale_date) == today,
            Sale.status != 'cancelled'
        ).first()
        
        # This month's sales
        month_sales = db.session.query(
            func.sum(Sale.total_price).label('revenue'),
            func.sum(Sale.unit_cost * Sale.quantity).label('cost'),
            func.count(Sale.id).label('orders')
        ).filter(
            Sale.sale_date >= month_start,
            Sale.status != 'cancelled'
        ).first()
        
        # This year's sales
        year_sales = db.session.query(
            func.sum(Sale.total_price).label('revenue')
        ).filter(
            Sale.sale_date >= year_start,
            Sale.status != 'cancelled'
        ).first()
        
        month_revenue = float(month_sales.revenue or 0)
        month_cost = float(month_sales.cost or 0)
        month_profit = month_revenue - month_cost
        
        summary = {
            'today': {
                'revenue': float(today_sales.revenue or 0),
                'orders': today_sales.orders or 0
            },
            'month': {
                'revenue': month_revenue,
                'cost': month_cost,
                'profit': month_profit,
                'profit_margin': (month_profit / month_revenue * 100) if month_revenue > 0 else 0,
                'orders': month_sales.orders or 0
            },
            'year': {
                'revenue': float(year_sales.revenue or 0)
            }
        }
        
        return jsonify({'summary': summary}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch financial summary: {str(e)}'}), 500


