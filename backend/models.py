from datetime import datetime
from database import db

class User(db.Model):
    """
    User model for authentication and role-based access control
    Supports two roles: superuser (full access + management) and user (standard access)
    """
    __tablename__ = 'users'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password = db.Column(db.String(120), nullable=False)  # Hashed password
    
    # Role-based access control
    # Roles: superuser (full access + user management), user (standard access)
    role = db.Column(db.String(50), nullable=False, default='user', index=True)
    
    # Personal information
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    
    # Store assignment (optional - some users may work across stores)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=True)
    
    # Account status and metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    store = db.relationship('Store', back_populates='employees')
    
    def to_dict(self):
        """Convert user object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'store_id': self.store_id,
            'store_name': self.store.name if self.store else None,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def has_permission(self, permission):
        """
        Check if user has specific permission based on their role
        Permission levels: view, edit, create, delete, admin
        
        Simplified role system:
        - superuser: Full access to everything (acts as manager + admin)
        - user: Standard access (view, edit, create)
        """
        role_permissions = {
            'superuser': ['view', 'edit', 'create', 'delete', 'admin'],
            'user': ['view', 'edit', 'create']
        }
        
        user_permissions = role_permissions.get(self.role, ['view'])
        return permission in user_permissions
    
    def can_manage_users(self):
        """Check if user can manage other users (only superuser)"""
        return self.role == 'superuser'
    
    def can_access_finance(self):
        """Check if user can access financial data"""
        # Both superuser and regular users can access finance
        # Superuser has full access, users have view/edit access
        return True
    
    def is_superuser(self):
        """Check if user is a superuser"""
        return self.role == 'superuser'

class Category(db.Model):
    """
    Product Category model for organizing inventory items
    Supports hierarchical categories and visual icons
    """
    __tablename__ = 'categories'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    
    # Visual representation
    icon = db.Column(db.String(50), default='📦')  # Emoji or icon class
    color = db.Column(db.String(7), default='#7C3AED')  # Hex color for UI
    
    # Category hierarchy (optional - for subcategories)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=True)
    
    # Status and metadata
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    sort_order = db.Column(db.Integer, default=0)  # For custom ordering
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy=True, cascade='all, delete-orphan')
    
    # Self-referential relationship for parent/child categories
    children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), lazy=True)
    
    @property
    def item_count(self):
        """Get total number of products in this category"""
        return Product.query.filter_by(category_id=self.id, is_active=True).count()
    
    @property
    def total_stock(self):
        """Get total stock across all products in this category"""
        total = 0
        for product in self.products:
            if product.is_active:
                total += product.total_stock
        return total
    
    @property
    def low_stock_items(self):
        """Get count of low stock items in this category"""
        count = 0
        for product in self.products:
            if product.is_active and product.is_low_stock:
                count += 1
        return count
    
    def to_dict(self):
        """Convert category object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'parent_id': self.parent_id,
            'parent_name': self.parent.name if self.parent else None,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'item_count': self.item_count,
            'total_stock': self.total_stock,
            'low_stock_items': self.low_stock_items,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Store(db.Model):
    """
    Store/Location model for managing multiple store locations
    Tracks inventory, employees, and performance metrics per location
    """
    __tablename__ = 'stores'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    code = db.Column(db.String(10), nullable=False, unique=True, index=True)  # Store code (e.g., "ST001")
    
    # Location details
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(50), nullable=False, default='USA')
    
    # Contact information
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    manager_name = db.Column(db.String(100), nullable=True)
    
    # Visual and operational
    image = db.Column(db.String(200), nullable=True)  # Store photo
    timezone = db.Column(db.String(50), default='UTC')
    operating_hours = db.Column(db.Text, nullable=True)  # JSON string of hours
    
    # Status and metrics
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    opening_date = db.Column(db.Date, nullable=True)
    square_footage = db.Column(db.Integer, nullable=True)
    customer_rating = db.Column(db.Float, default=5.0)  # 1-5 star rating
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory = db.relationship('Inventory', backref='store', lazy=True, cascade='all, delete-orphan')
    sales = db.relationship('Sale', backref='store', lazy=True, cascade='all, delete-orphan')
    employees = db.relationship('User', back_populates='store', lazy=True)
    
    @property
    def full_address(self):
        """Get formatted full address"""
        return f"{self.address}, {self.city}, {self.state} {self.postal_code}, {self.country}"
    
    @property
    def employees_count(self):
        """Get number of employees assigned to this store"""
        return User.query.filter_by(store_id=self.id, is_active=True).count()
    
    @property
    def total_inventory_items(self):
        """Get total number of items in inventory"""
        return sum(inv.quantity for inv in self.inventory if inv.quantity > 0)
    
    @property
    def unique_products_count(self):
        """Get number of unique products in this store"""
        return len([inv for inv in self.inventory if inv.quantity > 0])
    
    @property
    def low_stock_items_count(self):
        """Get count of items with low stock"""
        return len([inv for inv in self.inventory if inv.is_low_stock])
    
    @property
    def total_sales_today(self):
        """Get total sales amount for today"""
        from sqlalchemy import func
        today = datetime.utcnow().date()
        result = db.session.query(func.sum(Sale.total_price)).filter(
            Sale.store_id == self.id,
            func.date(Sale.sale_date) == today
        ).scalar()
        return float(result) if result else 0.0
    
    @property
    def monthly_revenue(self):
        """Get revenue for current month"""
        from sqlalchemy import func, extract
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        
        result = db.session.query(func.sum(Sale.total_price)).filter(
            Sale.store_id == self.id,
            extract('month', Sale.sale_date) == current_month,
            extract('year', Sale.sale_date) == current_year
        ).scalar()
        return float(result) if result else 0.0
    
    def to_dict(self):
        """Convert store object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
            'country': self.country,
            'full_address': self.full_address,
            'phone': self.phone,
            'email': self.email,
            'manager_name': self.manager_name,
            'image': self.image,
            'timezone': self.timezone,
            'operating_hours': self.operating_hours,
            'is_active': self.is_active,
            'opening_date': self.opening_date.isoformat() if self.opening_date else None,
            'square_footage': self.square_footage,
            'customer_rating': self.customer_rating,
            'employees_count': self.employees_count,
            'total_inventory_items': self.total_inventory_items,
            'unique_products_count': self.unique_products_count,
            'low_stock_items_count': self.low_stock_items_count,
            'total_sales_today': self.total_sales_today,
            'monthly_revenue': self.monthly_revenue,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Product(db.Model):
    """
    Product model for inventory items
    Comprehensive product information with pricing, stock tracking, and categorization
    """
    __tablename__ = 'products'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)  # SKU/Product code
    barcode = db.Column(db.String(100), unique=True, nullable=True, index=True)  # UPC/EAN
    
    # Product details
    description = db.Column(db.Text, nullable=True)
    short_description = db.Column(db.String(500), nullable=True)  # Brief summary
    brand = db.Column(db.String(100), nullable=True, index=True)
    model = db.Column(db.String(100), nullable=True)
    
    # Categorization
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False, index=True)
    tags = db.Column(db.Text, nullable=True)  # JSON array of tags
    
    # Pricing and costs
    cost_price = db.Column(db.Float, nullable=False, default=0.0)  # What we pay
    selling_price = db.Column(db.Float, nullable=False, default=0.0)  # What customers pay
    msrp = db.Column(db.Float, nullable=True)  # Manufacturer suggested retail price
    
    # Physical attributes
    weight = db.Column(db.Float, nullable=True)  # in grams
    dimensions_length = db.Column(db.Float, nullable=True)  # in cm
    dimensions_width = db.Column(db.Float, nullable=True)   # in cm
    dimensions_height = db.Column(db.Float, nullable=True)  # in cm
    
    # Visual and media
    primary_image = db.Column(db.String(200), nullable=True)
    images = db.Column(db.Text, nullable=True)  # JSON array of image URLs
    
    # Status and availability
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    status = db.Column(db.String(20), default='active', index=True)  # active, discontinued, seasonal
    
    # Stock management
    track_inventory = db.Column(db.Boolean, default=True, nullable=False)
    allow_backorder = db.Column(db.Boolean, default=False, nullable=False)
    min_stock_level = db.Column(db.Integer, default=10, nullable=False)  # Global minimum
    max_stock_level = db.Column(db.Integer, default=1000, nullable=True)  # Global maximum
    
    # SEO and metadata
    meta_title = db.Column(db.String(200), nullable=True)
    meta_description = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inventory = db.relationship('Inventory', backref='product', lazy=True, cascade='all, delete-orphan')
    sales = db.relationship('Sale', backref='product', lazy=True, cascade='all, delete-orphan')
    
    @property
    def total_stock(self):
        """Get total stock across all stores"""
        return sum(inv.quantity for inv in self.inventory if inv.quantity > 0)
    
    @property
    def available_stock(self):
        """Get available stock (excluding reserved/pending)"""
        # For now, same as total_stock - can be enhanced later
        return self.total_stock
    
    @property
    def is_low_stock(self):
        """Check if product is running low on stock globally"""
        return self.total_stock <= self.min_stock_level
    
    @property
    def is_out_of_stock(self):
        """Check if product is completely out of stock"""
        return self.total_stock <= 0
    
    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.cost_price > 0:
            return ((self.selling_price - self.cost_price) / self.cost_price) * 100
        return 0.0
    
    @property
    def profit_amount(self):
        """Calculate profit amount per unit"""
        return self.selling_price - self.cost_price
    
    @property
    def total_sales_value(self):
        """Get total value of all sales for this product"""
        return sum(sale.total_price for sale in self.sales)
    
    @property
    def total_units_sold(self):
        """Get total number of units sold"""
        return sum(sale.quantity for sale in self.sales)
    
    @property
    def average_sale_price(self):
        """Get average selling price based on actual sales"""
        if self.total_units_sold > 0:
            return self.total_sales_value / self.total_units_sold
        return self.selling_price
    
    def get_stock_by_store(self, store_id):
        """Get stock quantity for a specific store"""
        inventory = Inventory.query.filter_by(
            product_id=self.id, 
            store_id=store_id
        ).first()
        return inventory.quantity if inventory else 0
    
    def to_dict(self, include_category=True, include_inventory=False):
        """Convert product object to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'barcode': self.barcode,
            'description': self.description,
            'short_description': self.short_description,
            'brand': self.brand,
            'model': self.model,
            'category_id': self.category_id,
            'tags': self.tags,
            'cost_price': self.cost_price,
            'selling_price': self.selling_price,
            'msrp': self.msrp,
            'weight': self.weight,
            'dimensions': {
                'length': self.dimensions_length,
                'width': self.dimensions_width,
                'height': self.dimensions_height
            } if any([self.dimensions_length, self.dimensions_width, self.dimensions_height]) else None,
            'primary_image': self.primary_image,
            'images': self.images,
            'is_active': self.is_active,
            'status': self.status,
            'track_inventory': self.track_inventory,
            'allow_backorder': self.allow_backorder,
            'min_stock_level': self.min_stock_level,
            'max_stock_level': self.max_stock_level,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'total_stock': self.total_stock,
            'available_stock': self.available_stock,
            'is_low_stock': self.is_low_stock,
            'is_out_of_stock': self.is_out_of_stock,
            'profit_margin': round(self.profit_margin, 2),
            'profit_amount': round(self.profit_amount, 2),
            'total_sales_value': self.total_sales_value,
            'total_units_sold': self.total_units_sold,
            'average_sale_price': round(self.average_sale_price, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Include category information if requested
        if include_category and self.category:
            data['category'] = {
                'id': self.category.id,
                'name': self.category.name,
                'icon': self.category.icon,
                'color': self.category.color
            }
        
        # Include inventory details if requested
        if include_inventory:
            data['inventory'] = [inv.to_dict() for inv in self.inventory]
        
        return data

class Inventory(db.Model):
    __tablename__ = 'inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    min_stock = db.Column(db.Integer, nullable=False, default=10)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Composite unique constraint
    __table_args__ = (db.UniqueConstraint('product_id', 'store_id', name='unique_product_store'),)
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.min_stock
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'store_id': self.store_id,
            'quantity': self.quantity,
            'min_stock': self.min_stock,
            'is_low_stock': self.is_low_stock,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

class Sale(db.Model):
    """
    Sales/Transaction model for tracking all sales and financial data
    Comprehensive transaction tracking with status, payments, and analytics
    """
    __tablename__ = 'sales'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)  # Order/Receipt number
    
    # Product and location
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False, index=True)
    
    # Transaction details
    quantity = db.Column(db.Integer, nullable=False)
    unit_cost = db.Column(db.Float, nullable=False, default=0.0)  # What we paid for the item
    unit_price = db.Column(db.Float, nullable=False)  # Price sold to customer
    discount_amount = db.Column(db.Float, default=0.0)  # Total discount applied
    tax_amount = db.Column(db.Float, default=0.0)  # Tax charged
    total_price = db.Column(db.Float, nullable=False)  # Final amount paid
    
    # Customer information (optional - for future customer tracking)
    customer_name = db.Column(db.String(100), nullable=True)
    customer_email = db.Column(db.String(120), nullable=True)
    customer_phone = db.Column(db.String(20), nullable=True)
    
    # Transaction status and tracking
    status = db.Column(db.String(20), default='confirmed', index=True)  # confirmed, packed, shipped, delivered, refunded, cancelled
    payment_method = db.Column(db.String(50), nullable=True)  # cash, card, online, etc.
    payment_status = db.Column(db.String(20), default='paid')  # pending, paid, refunded, failed
    
    # Fulfillment tracking
    packed_at = db.Column(db.DateTime, nullable=True)
    shipped_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    tracking_number = db.Column(db.String(100), nullable=True)
    
    # Staff and notes
    sold_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Staff who made the sale
    notes = db.Column(db.Text, nullable=True)  # Internal notes
    customer_notes = db.Column(db.Text, nullable=True)  # Customer instructions
    
    # Timestamps
    sale_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sold_by = db.relationship('User', backref='sales_made', foreign_keys=[sold_by_user_id])
    
    @property
    def subtotal(self):
        """Calculate subtotal before tax and discount"""
        return self.quantity * self.unit_price
    
    @property
    def profit_amount(self):
        """Calculate total profit amount for this sale"""
        cost_total = self.quantity * self.unit_cost
        return self.total_price - cost_total
    
    @property
    def profit_margin_percentage(self):
        """Calculate profit margin as percentage"""
        cost_total = self.quantity * self.unit_cost
        if cost_total > 0:
            return (self.profit_amount / cost_total) * 100
        return 0.0
    
    @property
    def discount_percentage(self):
        """Calculate discount as percentage of subtotal"""
        if self.subtotal > 0:
            return (self.discount_amount / self.subtotal) * 100
        return 0.0
    
    @property
    def is_refunded(self):
        """Check if this sale has been refunded"""
        return self.status == 'refunded'
    
    @property
    def is_completed(self):
        """Check if sale is completed (delivered or picked up)"""
        return self.status in ['delivered', 'completed']
    
    @property
    def days_since_sale(self):
        """Get number of days since the sale was made"""
        return (datetime.utcnow() - self.sale_date).days
    
    def to_dict(self, include_product=True, include_store=True):
        """Convert sale object to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'product_id': self.product_id,
            'store_id': self.store_id,
            'quantity': self.quantity,
            'unit_cost': self.unit_cost,
            'unit_price': self.unit_price,
            'discount_amount': self.discount_amount,
            'tax_amount': self.tax_amount,
            'total_price': self.total_price,
            'subtotal': self.subtotal,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'packed_at': self.packed_at.isoformat() if self.packed_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'tracking_number': self.tracking_number,
            'sold_by_user_id': self.sold_by_user_id,
            'sold_by_name': self.sold_by.name if self.sold_by else None,
            'notes': self.notes,
            'customer_notes': self.customer_notes,
            'profit_amount': round(self.profit_amount, 2),
            'profit_margin_percentage': round(self.profit_margin_percentage, 2),
            'discount_percentage': round(self.discount_percentage, 2),
            'is_refunded': self.is_refunded,
            'is_completed': self.is_completed,
            'days_since_sale': self.days_since_sale,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Include product information if requested
        if include_product and self.product:
            data['product'] = {
                'id': self.product.id,
                'name': self.product.name,
                'code': self.product.code,
                'brand': self.product.brand,
                'category_name': self.product.category.name if self.product.category else None
            }
        
        # Include store information if requested
        if include_store and self.store:
            data['store'] = {
                'id': self.store.id,
                'name': self.store.name,
                'code': self.store.code,
                'city': self.store.city
            }
        
        return data
