#!/usr/bin/env python3
"""
Database Inspector Script
Shows what data is currently in the SQLite database
"""

import sqlite3
import os
from datetime import datetime

def check_database():
    """Check the contents of the database"""
    db_path = 'instance/database.db'
    
    if not os.path.exists(db_path):
        print("❌ Database file not found at:", db_path)
        return
    
    print("🔍 Checking database contents...")
    print("=" * 50)
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"📊 Found {len(tables)} tables:")
        for table in tables:
            print(f"   - {table[0]}")
        print()
        
        # Check each table's contents
        for table in tables:
            table_name = table[0]
            print(f"📋 Table: {table_name}")
            print("-" * 30)
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"   Rows: {count}")
            
            if count > 0:
                # Get column names
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                column_names = [col[1] for col in columns]
                
                # Show first few rows
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                rows = cursor.fetchall()
                
                print(f"   Columns: {', '.join(column_names)}")
                print("   Sample data:")
                for i, row in enumerate(rows, 1):
                    print(f"     Row {i}: {dict(zip(column_names, row))}")
                
                if count > 3:
                    print(f"     ... and {count - 3} more rows")
            
            print()
        
        # Summary
        print("📊 SUMMARY:")
        print("=" * 30)
        
        # Users
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"👥 Users: {user_count}")
        
        # Products
        cursor.execute("SELECT COUNT(*) FROM products WHERE is_active = 1")
        product_count = cursor.fetchone()[0]
        print(f"📦 Active Products: {product_count}")
        
        # Categories
        cursor.execute("SELECT COUNT(*) FROM categories WHERE is_active = 1")
        category_count = cursor.fetchone()[0]
        print(f"🏷️  Active Categories: {category_count}")
        
        # Stores
        cursor.execute("SELECT COUNT(*) FROM stores WHERE is_active = 1")
        store_count = cursor.fetchone()[0]
        print(f"🏪 Active Stores: {store_count}")
        
        # Inventory
        cursor.execute("SELECT COUNT(*) FROM inventory")
        inventory_count = cursor.fetchone()[0]
        cursor.execute("SELECT SUM(quantity) FROM inventory")
        total_stock = cursor.fetchone()[0] or 0
        print(f"📊 Inventory Records: {inventory_count}")
        print(f"📊 Total Stock Items: {total_stock}")
        
        # Sales
        cursor.execute("SELECT COUNT(*) FROM sales")
        sales_count = cursor.fetchone()[0]
        cursor.execute("SELECT SUM(total_price) FROM sales")
        total_sales_value = cursor.fetchone()[0] or 0
        print(f"💰 Sales Records: {sales_count}")
        print(f"💰 Total Sales Value: ${total_sales_value:.2f}")
        
        # Today's data
        today = datetime.now().date()
        cursor.execute("SELECT COUNT(*) FROM sales WHERE DATE(sale_date) = ?", (today,))
        today_sales_count = cursor.fetchone()[0]
        cursor.execute("SELECT SUM(total_price) FROM sales WHERE DATE(sale_date) = ?", (today,))
        today_sales_value = cursor.fetchone()[0] or 0
        print(f"📅 Today's Sales: {today_sales_count} orders, ${today_sales_value:.2f}")
        
        conn.close()
        print("\n✅ Database inspection complete!")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_database()


