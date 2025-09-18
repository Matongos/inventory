import React, { useState, useEffect } from 'react';

/**
 * Dashboard Component
 * Displays comprehensive analytics and metrics using real data from the API
 * Features: Overview stats, recent activity, sales charts, inventory stats, store performance
 */
const Dashboard = ({ user, hasPermission }) => {
  // State for different dashboard sections
  const [overview, setOverview] = useState({});
  const [salesMetrics, setSalesMetrics] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [salesChart, setSalesChart] = useState({});
  const [inventoryStats, setInventoryStats] = useState({});
  const [storesOverview, setStoresOverview] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load all dashboard data on component mount
    loadDashboardData();
  }, []);

  /**
   * Load all dashboard data from multiple API endpoints
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all dashboard data in parallel
      const [
        overviewRes,
        activityRes,
        salesChartRes,
        inventoryRes,
        storesRes,
        categoriesRes
      ] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard/overview', { credentials: 'include' }),
        fetch('http://localhost:5000/api/dashboard/recent-activity', { credentials: 'include' }),
        fetch('http://localhost:5000/api/dashboard/sales-chart', { credentials: 'include' }),
        fetch('http://localhost:5000/api/dashboard/inventory-stats', { credentials: 'include' }),
        fetch('http://localhost:5000/api/dashboard/stores-overview', { credentials: 'include' }),
        fetch('http://localhost:5000/api/dashboard/top-categories', { credentials: 'include' })
      ]);

      // Check if all requests were successful
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        console.log('📊 Overview API Response:', overviewData); // DEBUG LOG
        setOverview(overviewData.overview);
        setSalesMetrics(overviewData.sales_metrics);
      } else {
        console.error('❌ Overview API Error:', overviewRes.status, await overviewRes.text());
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        console.log('📋 Activity API Response:', activityData); // DEBUG LOG
        setRecentActivity(activityData.recent_activity);
      } else {
        console.error('❌ Activity API Error:', activityRes.status);
      }

      if (salesChartRes.ok) {
        const salesData = await salesChartRes.json();
        console.log('📈 Sales Chart API Response:', salesData); // DEBUG LOG
        setSalesChart(salesData);
      } else {
        console.error('❌ Sales Chart API Error:', salesChartRes.status);
      }

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        console.log('📦 Inventory API Response:', inventoryData); // DEBUG LOG
        setInventoryStats(inventoryData);
      } else {
        console.error('❌ Inventory API Error:', inventoryRes.status);
      }

      if (storesRes.ok) {
        const storesData = await storesRes.json();
        console.log('🏪 Stores API Response:', storesData); // DEBUG LOG
        setStoresOverview(storesData.stores);
      } else {
        console.error('❌ Stores API Error:', storesRes.status);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        console.log('🏷️ Categories API Response:', categoriesData); // DEBUG LOG
        setTopCategories(categoriesData.categories);
      } else {
        console.error('❌ Categories API Error:', categoriesRes.status);
      }

    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format currency values
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Show loading state
  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Loading your analytics...</p>
        </div>
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="error">
          {error}
          <button onClick={loadDashboardData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}! Here's what's happening with your inventory.</p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                {overview.total_products || 0}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Total Products
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>📦</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success-color)' }}>
                {salesMetrics.today_orders || 0}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Today's Orders
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>🛍️</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning-color)' }}>
                {overview.low_stock_items || 0}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Low Stock Items
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                {formatCurrency(salesMetrics.today_sales)}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Today's Sales
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>💰</div>
          </div>
        </div>
      </div>

      {/* Sales Growth Indicator */}
      {salesMetrics.sales_growth_percentage !== undefined && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Sales Performance</h3>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Compared to yesterday
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              color: salesMetrics.sales_growth_percentage >= 0 ? 'var(--success-color)' : 'var(--error-color)'
            }}>
              <span style={{ fontSize: '1.5rem' }}>
                {salesMetrics.sales_growth_percentage >= 0 ? '📈' : '📉'}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                {salesMetrics.sales_growth_percentage >= 0 ? '+' : ''}{salesMetrics.sales_growth_percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2">
        {/* Sales Status Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Status</h3>
            <p className="card-description">Order status breakdown (Last 30 days)</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {salesChart.sales_by_status && salesChart.sales_by_status.map((item) => (
              <div key={item.status} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: item.color
                  }}></div>
                  <span style={{ fontWeight: '500' }}>{item.status}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontWeight: '600',
                    color: item.color,
                    display: 'block'
                  }}>
                    {item.count} orders
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {formatCurrency(item.total_value)}
                  </span>
                </div>
              </div>
            ))}
            {(!salesChart.sales_by_status || salesChart.sales_by_status.length === 0) && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No sales data available
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-description">Latest updates in your inventory</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {recentActivity.length > 0 ? recentActivity.slice(0, 8).map((activity, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{activity.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>
                    {activity.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                    {activity.description}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: '0.25rem 0 0 0' }}>
                    {formatRelativeTime(activity.timestamp)} • {activity.store}
                  </p>
                </div>
              </div>
            )) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory & Stock Overview */}
      <div className="grid grid-cols-2" style={{ marginTop: '2rem', gap: '2rem' }}>
        {/* Inventory Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Inventory Overview</h3>
            <p className="card-description">Stock levels and alerts</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--secondary-color)', borderRadius: '0.5rem' }}>
              <span>Total Stock Items</span>
              <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                {inventoryStats.summary?.total_stock || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--secondary-color)', borderRadius: '0.5rem' }}>
              <span>Low Stock Alerts</span>
              <span style={{ fontWeight: '600', color: 'var(--warning-color)' }}>
                {inventoryStats.summary?.low_stock_count || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--secondary-color)', borderRadius: '0.5rem' }}>
              <span>Active Categories</span>
              <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>
                {overview.total_categories || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--secondary-color)', borderRadius: '0.5rem' }}>
              <span>Active Stores</span>
              <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                {overview.total_stores || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Top Stores Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Store Performance</h3>
            <p className="card-description">Monthly revenue by location</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {storesOverview.slice(0, 4).map((store) => (
              <div key={store.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏪</span>
                  <div>
                    <p style={{ fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>{store.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {store.city}, {store.state}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '600', margin: 0, color: 'var(--success-color)' }}>
                    {formatCurrency(store.monthly_revenue)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {store.employees_count} employees
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Top Categories</h3>
          <p className="card-description">Best performing product categories</p>
        </div>
        <div className="grid grid-cols-3" style={{ marginTop: '1rem' }}>
          {topCategories.slice(0, 6).map((category) => (
            <div key={category.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: '0.5rem',
              border: `2px solid ${category.color}20`
            }}>
              <span style={{ fontSize: '2rem' }}>{category.icon}</span>
              <div>
                <p style={{ fontWeight: '600', margin: 0 }}>{category.name}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                  {category.product_count} products
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--success-color)', margin: 0 }}>
                  {formatCurrency(category.total_revenue)} revenue
                </p>
              </div>
            </div>
          ))}
        </div>
        {topCategories.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
            No category data available
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
