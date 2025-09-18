"""
Database seeding script for sample data
Creates categories, stores, products, inventory, and sales data for testing
"""

from app import app
from database import db
from models import User, Category, Store, Product, Inventory, Sale
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def seed_database():
    """
    Populate database with comprehensive sample data
    """
    with app.app_context():
        print("🌱 Starting database seeding...")
        
        # Clear existing data (except users)
        print("🧹 Clearing existing data...")
        Sale.query.delete()
        Inventory.query.delete()
        Product.query.delete()
        Category.query.delete()
        Store.query.delete()
        
        # Create Categories
        print("📂 Creating categories...")
        categories = [
            Category(
                name="Clothing",
                description="Apparel and fashion items",
                icon="👕",
                color="#FF6B6B",
                sort_order=1
            ),
            Category(
                name="Footwear",
                description="Shoes, boots, and sandals",
                icon="👟",
                color="#4ECDC4",
                sort_order=2
            ),
            Category(
                name="Accessories",
                description="Bags, jewelry, and fashion accessories",
                icon="👜",
                color="#45B7D1",
                sort_order=3
            ),
            Category(
                name="Electronics",
                description="Tech gadgets and electronic devices",
                icon="📱",
                color="#96CEB4",
                sort_order=4
            ),
            Category(
                name="Home & Garden",
                description="Home decor and gardening supplies",
                icon="🏡",
                color="#FFEAA7",
                sort_order=5
            ),
            Category(
                name="Sports",
                description="Sports equipment and athletic wear",
                icon="⚽",
                color="#DDA0DD",
                sort_order=6
            )
        ]
        
        for category in categories:
            db.session.add(category)
        db.session.commit()
        print(f"✅ Created {len(categories)} categories")
        
        # Create Stores
        print("🏪 Creating stores...")
        stores = [
            Store(
                name="Downtown Flagship",
                code="DT001",
                address="123 Main Street",
                city="New York",
                state="NY",
                postal_code="10001",
                country="USA",
                phone="+1-555-0101",
                email="downtown@inventory.com",
                manager_name="John Smith",
                customer_rating=4.8,
                square_footage=5000,
                opening_date=datetime(2020, 1, 15).date()
            ),
            Store(
                name="Mall Location",
                code="ML002",
                address="456 Shopping Center Blvd",
                city="Los Angeles",
                state="CA",
                postal_code="90210",
                country="USA",
                phone="+1-555-0102",
                email="mall@inventory.com",
                manager_name="Sarah Johnson",
                customer_rating=4.5,
                square_footage=3500,
                opening_date=datetime(2021, 3, 20).date()
            ),
            Store(
                name="Suburban Outlet",
                code="SO003",
                address="789 Suburban Ave",
                city="Chicago",
                state="IL",
                postal_code="60601",
                country="USA",
                phone="+1-555-0103",
                email="suburban@inventory.com",
                manager_name="Mike Davis",
                customer_rating=4.2,
                square_footage=2800,
                opening_date=datetime(2021, 8, 10).date()
            ),
            Store(
                name="Online Warehouse",
                code="OW004",
                address="1000 Warehouse District",
                city="Dallas",
                state="TX",
                postal_code="75201",
                country="USA",
                phone="+1-555-0104",
                email="warehouse@inventory.com",
                manager_name="Lisa Wilson",
                customer_rating=4.9,
                square_footage=15000,
                opening_date=datetime(2019, 11, 1).date()
            )
        ]
        
        for store in stores:
            db.session.add(store)
        db.session.commit()
        print(f"✅ Created {len(stores)} stores")
        
        # Create Products
        print("📦 Creating products...")
        clothing_cat = Category.query.filter_by(name="Clothing").first()
        footwear_cat = Category.query.filter_by(name="Footwear").first()
        accessories_cat = Category.query.filter_by(name="Accessories").first()
        electronics_cat = Category.query.filter_by(name="Electronics").first()
        home_cat = Category.query.filter_by(name="Home & Garden").first()
        sports_cat = Category.query.filter_by(name="Sports").first()
        
        products = [
            # Clothing
            Product(
                name="Classic Cotton T-Shirt",
                code="CLT001",
                barcode="123456789012",
                description="Comfortable 100% cotton t-shirt in various colors",
                short_description="Classic cotton tee",
                brand="ComfortWear",
                model="CT-2024",
                category_id=clothing_cat.id,
                cost_price=8.50,
                selling_price=19.99,
                msrp=24.99,
                weight=150,
                min_stock_level=20,
                max_stock_level=500
            ),
            Product(
                name="Denim Jeans",
                code="CLT002",
                barcode="123456789013",
                description="Premium denim jeans with modern fit",
                short_description="Premium denim jeans",
                brand="DenimCo",
                model="DJ-Classic",
                category_id=clothing_cat.id,
                cost_price=25.00,
                selling_price=59.99,
                msrp=79.99,
                weight=600,
                min_stock_level=15,
                max_stock_level=200
            ),
            
            # Footwear
            Product(
                name="Running Sneakers",
                code="FW001",
                barcode="123456789014",
                description="Lightweight running shoes with advanced cushioning",
                short_description="Performance running shoes",
                brand="SpeedFoot",
                model="SF-Runner-Pro",
                category_id=footwear_cat.id,
                cost_price=45.00,
                selling_price=89.99,
                msrp=119.99,
                weight=800,
                min_stock_level=10,
                max_stock_level=150
            ),
            Product(
                name="Leather Boots",
                code="FW002",
                barcode="123456789015",
                description="Genuine leather boots for all weather conditions",
                short_description="All-weather leather boots",
                brand="BootCraft",
                model="BC-Weather",
                category_id=footwear_cat.id,
                cost_price=60.00,
                selling_price=129.99,
                msrp=159.99,
                weight=1200,
                min_stock_level=8,
                max_stock_level=100
            ),
            
            # Accessories
            Product(
                name="Leather Wallet",
                code="ACC001",
                barcode="123456789016",
                description="Handcrafted leather wallet with RFID protection",
                short_description="RFID leather wallet",
                brand="LeatherCraft",
                model="LC-Wallet-Pro",
                category_id=accessories_cat.id,
                cost_price=12.00,
                selling_price=34.99,
                msrp=49.99,
                weight=100,
                min_stock_level=25,
                max_stock_level=300
            ),
            Product(
                name="Sunglasses",
                code="ACC002",
                barcode="123456789017",
                description="UV protection sunglasses with polarized lenses",
                short_description="Polarized sunglasses",
                brand="SunShield",
                model="SS-Polar",
                category_id=accessories_cat.id,
                cost_price=18.00,
                selling_price=45.99,
                msrp=69.99,
                weight=50,
                min_stock_level=30,
                max_stock_level=250
            ),
            
            # Electronics
            Product(
                name="Wireless Headphones",
                code="ELC001",
                barcode="123456789018",
                description="Bluetooth wireless headphones with noise cancellation",
                short_description="Noise-cancelling headphones",
                brand="AudioTech",
                model="AT-Wireless-Pro",
                category_id=electronics_cat.id,
                cost_price=75.00,
                selling_price=149.99,
                msrp=199.99,
                weight=300,
                min_stock_level=12,
                max_stock_level=100
            ),
            Product(
                name="Smartphone Case",
                code="ELC002",
                barcode="123456789019",
                description="Protective smartphone case with drop protection",
                short_description="Drop-proof phone case",
                brand="PhoneGuard",
                model="PG-Shield",
                category_id=electronics_cat.id,
                cost_price=8.00,
                selling_price=24.99,
                msrp=34.99,
                weight=80,
                min_stock_level=40,
                max_stock_level=400
            ),
            
            # Home & Garden
            Product(
                name="Ceramic Planter",
                code="HG001",
                barcode="123456789020",
                description="Decorative ceramic planter for indoor plants",
                short_description="Indoor ceramic planter",
                brand="GreenHome",
                model="GH-Ceramic",
                category_id=home_cat.id,
                cost_price=15.00,
                selling_price=35.99,
                msrp=49.99,
                weight=800,
                min_stock_level=20,
                max_stock_level=150
            ),
            
            # Sports
            Product(
                name="Yoga Mat",
                code="SPT001",
                barcode="123456789021",
                description="Non-slip yoga mat for exercise and meditation",
                short_description="Non-slip yoga mat",
                brand="FitLife",
                model="FL-Yoga-Pro",
                category_id=sports_cat.id,
                cost_price=12.00,
                selling_price=29.99,
                msrp=39.99,
                weight=1000,
                min_stock_level=15,
                max_stock_level=200
            )
        ]
        
        for product in products:
            db.session.add(product)
        db.session.commit()
        print(f"✅ Created {len(products)} products")
        
        # Create Inventory for each product in each store
        print("📊 Creating inventory records...")
        inventory_count = 0
        for product in Product.query.all():
            for store in Store.query.all():
                # Random stock quantities
                if store.code == "OW004":  # Warehouse has more stock
                    quantity = random.randint(100, 500)
                else:
                    quantity = random.randint(5, 50)
                
                inventory = Inventory(
                    product_id=product.id,
                    store_id=store.id,
                    quantity=quantity,
                    min_stock=product.min_stock_level
                )
                db.session.add(inventory)
                inventory_count += 1
        
        db.session.commit()
        print(f"✅ Created {inventory_count} inventory records")
        
        # Create Sales Data
        print("💰 Creating sales records...")
        sales_count = 0
        
        # Create sales for the last 30 days
        for days_back in range(30):
            sale_date = datetime.utcnow() - timedelta(days=days_back)
            
            # Random number of sales per day (3-15)
            daily_sales = random.randint(3, 15)
            
            for _ in range(daily_sales):
                product = random.choice(Product.query.all())
                store = random.choice(Store.query.all())
                quantity = random.randint(1, 5)
                
                # Calculate pricing
                unit_price = product.selling_price
                discount = random.choice([0, 0, 0, 5, 10, 15])  # Most sales have no discount
                discount_amount = (unit_price * quantity * discount / 100)
                tax_rate = 0.08  # 8% tax
                subtotal = (unit_price * quantity) - discount_amount
                tax_amount = subtotal * tax_rate
                total_price = subtotal + tax_amount
                
                # Generate order number
                order_number = f"ORD-{sale_date.strftime('%Y%m%d')}-{sales_count + 1:04d}"
                
                sale = Sale(
                    order_number=order_number,
                    product_id=product.id,
                    store_id=store.id,
                    quantity=quantity,
                    unit_cost=product.cost_price,
                    unit_price=unit_price,
                    discount_amount=discount_amount,
                    tax_amount=tax_amount,
                    total_price=total_price,
                    status=random.choice(['confirmed', 'confirmed', 'packed', 'shipped', 'delivered', 'refunded']),
                    payment_method=random.choice(['cash', 'card', 'card', 'online', 'online']),
                    payment_status='paid',
                    sale_date=sale_date,
                    created_at=sale_date,
                    updated_at=sale_date
                )
                
                db.session.add(sale)
                sales_count += 1
        
        db.session.commit()
        print(f"✅ Created {sales_count} sales records")
        
        # Create a test user
        print("👤 Creating test user...")
        test_user = User.query.filter_by(username='testuser').first()
        if not test_user:
            test_user = User(
                username='testuser',
                password=generate_password_hash('password123'),
                role='user',
                name='Test User',
                email='testuser@inventory.com',
                phone='+1-555-0199',
                store_id=stores[0].id  # Assign to first store
            )
            db.session.add(test_user)
            db.session.commit()
            print("✅ Created test user (testuser/password123)")
        else:
            print("✅ Test user already exists")
        
        print("\n🎉 Database seeding completed successfully!")
        print(f"📊 Summary:")
        print(f"   • Categories: {Category.query.count()}")
        print(f"   • Stores: {Store.query.count()}")
        print(f"   • Products: {Product.query.count()}")
        print(f"   • Inventory Records: {Inventory.query.count()}")
        print(f"   • Sales Records: {Sale.query.count()}")
        print(f"   • Users: {User.query.count()}")
        print("\n🔐 Login Credentials:")
        print("   • Superuser: admin/admin123")
        print("   • Test User: testuser/password123")

if __name__ == "__main__":
    seed_database()

