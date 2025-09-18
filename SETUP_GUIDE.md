# 🚀 Inventory Management System - Setup Guide

## 📦 **System Requirements**

### **Prerequisites:**
- **Python 3.8+** (recommended: Python 3.11)
- **Node.js 16+** (recommended: Node.js 18+)
- **Git** (for cloning the repository)
- **Web Browser** (Chrome, Firefox, Safari, Edge)

### **System Requirements:**
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

---

## 🔧 **Installation Steps**

### **Step 1: Download/Clone the Project**
```bash
# If you have the project files, navigate to the folder
cd inventory_management

# Or if cloning from repository:
git clone <repository-url>
cd inventory_management
```

### **Step 2: Backend Setup (Python)**

#### **2.1 Navigate to Backend Directory**
```bash
cd backend
```

#### **2.2 Create Virtual Environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### **2.3 Install Python Dependencies**
```bash
pip install -r requirements.txt
```

#### **2.4 Initialize Database**
```bash
python check_database.py
```

#### **2.5 Seed Sample Data (Optional)**
```bash
python seed_data.py
```

#### **2.6 Start Backend Server**
```bash
python app.py
```
**✅ Backend should be running on: http://localhost:5000**

---

### **Step 3: Frontend Setup (React)**

#### **3.1 Open New Terminal/Command Prompt**
```bash
# Navigate to frontend directory
cd frontend
```

#### **3.2 Install Node Dependencies**
```bash
npm install
```

#### **3.3 Start Frontend Development Server**
```bash
npm run dev
```
**✅ Frontend should be running on: http://localhost:5173**

---

## 🎯 **Quick Start Guide**

### **1. Access the Application**
- Open your web browser
- Navigate to: **http://localhost:5173**
- You should see the login page

### **2. Login Credentials**
```
Username: admin
Password: admin123
```

### **3. Explore the System**
- **Dashboard**: Overview of system metrics
- **Products**: Manage inventory items
- **Categories**: Organize product categories
- **Stores**: Manage multiple store locations
- **Finance**: View sales analytics and reports
- **Settings**: Configure system preferences

---

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### **Backend Issues:**

**❌ Port 5000 already in use**
```bash
# Kill process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**❌ Python dependencies not installing**
```bash
# Update pip first
pip install --upgrade pip

# Install dependencies one by one if needed
pip install flask flask-sqlalchemy flask-cors python-dotenv
```

**❌ Database connection error**
```bash
# Check if database file exists
ls backend/instance/database.db

# If missing, run database initialization
python check_database.py
```

#### **Frontend Issues:**

**❌ Port 5173 already in use**
```bash
# Kill process using port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

**❌ Node modules not installing**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**❌ Vite build errors**
```bash
# Update Node.js to latest version
# Or try with different package manager
npm install -g yarn
yarn install
yarn dev
```

---

## 📊 **System Architecture**

### **File Structure:**
```
inventory_management/
├── backend/                 # Python Flask API
│   ├── app.py             # Main Flask application
│   ├── models.py          # Database models
│   ├── routes/            # API endpoints
│   ├── instance/          # Database files
│   └── requirements.txt   # Python dependencies
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── styles/        # CSS files
│   │   └── App.jsx        # Main app
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
└── README.md              # This file
```

### **API Endpoints:**
- **Authentication**: `/api/auth/login`, `/api/auth/logout`
- **Products**: `/api/products`, `/api/products/<id>`
- **Categories**: `/api/categories`
- **Stores**: `/api/stores`
- **Finance**: `/api/finance/analytics`
- **Settings**: `/api/settings`

---

## 🎨 **Customization Options**

### **Themes:**
1. **Purple Theme**: Default purple design
2. **Black & White**: Professional monochrome
3. **Violet Gradient**: Modern gradient design

### **Sample Data:**
- **Products**: 50+ sample items
- **Categories**: 8+ product categories
- **Stores**: 3+ store locations
- **Sales**: Sample transaction data

---

## 🔒 **Security Notes**

### **Default Credentials:**
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ Change these in production!**

### **Development vs Production:**
- This setup is for **development/demo purposes**
- For production deployment, additional security measures needed
- Consider using environment variables for sensitive data

---

## 📈 **Performance Tips**

### **For Better Performance:**
1. **Close unused browser tabs**
2. **Restart servers if experiencing slowdowns**
3. **Clear browser cache if UI issues occur**
4. **Use Chrome DevTools for debugging**

### **System Monitoring:**
- **Backend**: Check terminal for error messages
- **Frontend**: Check browser console for JavaScript errors
- **Database**: Monitor file size in `backend/instance/`

---

## 🆘 **Getting Help**

### **If Something Goes Wrong:**

1. **Check both terminals** (backend and frontend)
2. **Look for error messages** in console output
3. **Verify all steps** were completed correctly
4. **Try restarting** both servers
5. **Check system requirements** are met

### **Common Error Messages:**

**"Module not found"** → Run `pip install -r requirements.txt` or `npm install`

**"Port already in use"** → Kill the process using that port

**"Database locked"** → Restart the backend server

**"CORS error"** → Make sure backend is running on port 5000

---

## ✅ **Verification Checklist**

Before presenting or using the system:

- [ ] Backend server running on http://localhost:5000
- [ ] Frontend server running on http://localhost:5173
- [ ] Can access login page in browser
- [ ] Can login with admin/admin123
- [ ] Dashboard loads with sample data
- [ ] Can navigate between all pages
- [ ] Product details modal works
- [ ] Theme switching works
- [ ] No console errors in browser

**🎉 If all items are checked, the system is ready for use!**

---

## 📞 **Support Information**

**System Version**: 1.0  
**Last Updated**: September 2025  
**Compatible Browsers**: Chrome, Firefox, Safari, Edge  
**Python Version**: 3.8+  
**Node.js Version**: 16+  

**For technical support or questions about this setup guide, refer to the project documentation or contact the development team.**
