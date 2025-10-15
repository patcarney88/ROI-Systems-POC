# 🚀 Backend Quick Start Guide

**Goal:** Get the backend running in 15 minutes

---

## ⚡ Super Quick Start (5 minutes)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Create .env file
cp .env.example .env

# 3. Start development server
npm run dev
```

**That's it!** Backend will run at http://localhost:3000

---

## 🔧 Full Setup (15 minutes)

### **Step 1: Install Dependencies (2 min)**
```bash
cd backend
npm install
```

### **Step 2: Set Up PostgreSQL (5 min)**

**Option A: Using Homebrew (macOS)**
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb roi_systems

# Verify
psql -d roi_systems -c "SELECT version();"
```

**Option B: Using Docker**
```bash
# Run PostgreSQL in Docker
docker run --name roi-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=roi_systems \
  -p 5432:5432 \
  -d postgres:14

# Verify
docker ps | grep roi-postgres
```

**Option C: Skip Database (Use SQLite for testing)**
```bash
# Edit .env and change DATABASE_URL to:
DATABASE_URL=sqlite:./dev.db
```

### **Step 3: Set Up Redis (3 min)**

**Option A: Using Homebrew (macOS)**
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Verify
redis-cli ping
# Should return: PONG
```

**Option B: Using Docker**
```bash
# Run Redis in Docker
docker run --name roi-redis \
  -p 6379:6379 \
  -d redis:7

# Verify
docker exec -it roi-redis redis-cli ping
# Should return: PONG
```

**Option C: Skip Redis (Optional for testing)**
```bash
# Comment out Redis in .env
# REDIS_URL=redis://localhost:6379
```

### **Step 4: Configure Environment (2 min)**

Create `backend/.env`:
```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database (choose one)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/roi_systems
# OR for SQLite:
# DATABASE_URL=sqlite:./dev.db

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:5051,http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### **Step 5: Run Migrations (1 min)**
```bash
# Run database migrations
npm run migrate

# Seed database (optional)
npm run seed
```

### **Step 6: Start Server (1 min)**
```bash
# Start development server
npm run dev
```

Server will start at: http://localhost:3000

---

## ✅ Verify Installation

### **1. Health Check**
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-15T12:00:00.000Z",
    "uptime": 1.234,
    "environment": "development"
  }
}
```

### **2. Register User**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "agent"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### **3. Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 🔍 Troubleshooting

### **Port 3000 already in use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### **Database connection error**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Or check Docker
docker ps | grep postgres

# Verify connection
psql -h localhost -U postgres -d roi_systems
```

### **Redis connection error**
```bash
# Check if Redis is running
brew services list | grep redis

# Or check Docker
docker ps | grep redis

# Test connection
redis-cli ping
```

### **Module not found errors**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start with auto-reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run migrate          # Run migrations
npm run migrate:undo     # Undo last migration
npm run seed             # Seed database
npm run seed:undo        # Undo seeding

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

---

## 🎯 Next Steps

Once the backend is running:

1. ✅ Test all auth endpoints
2. ✅ Connect frontend to backend
3. ✅ Test full authentication flow
4. ✅ Implement remaining controllers
5. ✅ Add comprehensive tests

---

## 📚 API Documentation

### **Base URL**
```
http://localhost:3000/api/v1
```

### **Authentication Endpoints**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get profile
- `PUT /auth/profile` - Update profile

### **Client Endpoints**
- `GET /clients` - List clients
- `POST /clients` - Create client
- `GET /clients/:id` - Get client
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

### **Document Endpoints**
- `GET /documents` - List documents
- `POST /documents` - Upload document
- `GET /documents/:id` - Get document
- `PUT /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document

### **Campaign Endpoints**
- `GET /campaigns` - List campaigns
- `POST /campaigns` - Create campaign
- `GET /campaigns/:id` - Get campaign
- `PUT /campaigns/:id` - Update campaign
- `DELETE /campaigns/:id` - Delete campaign

---

## 🔐 Security Notes

### **For Development:**
- ✅ Use simple passwords in .env
- ✅ CORS allows localhost
- ✅ Debug logging enabled
- ✅ No HTTPS required

### **For Production:**
- ⚠️ Use strong JWT secrets
- ⚠️ Restrict CORS origins
- ⚠️ Enable HTTPS only
- ⚠️ Use production database
- ⚠️ Set LOG_LEVEL=info
- ⚠️ Enable rate limiting
- ⚠️ Use environment variables

---

## 💡 Tips

### **Fast Development:**
1. Use SQLite for quick testing (no PostgreSQL needed)
2. Skip Redis if not testing caching
3. Use Postman/Insomnia for API testing
4. Check logs for errors: `tail -f logs/combined.log`

### **Database Management:**
```bash
# Reset database
npm run migrate:undo:all
npm run migrate
npm run seed

# View database
psql -d roi_systems
\dt  # List tables
\d users  # Describe users table
```

### **Debugging:**
```bash
# Enable verbose logging
LOG_LEVEL=debug npm run dev

# Check specific logs
tail -f logs/error.log
tail -f logs/combined.log
```

---

## 🎉 Success Checklist

- [ ] Dependencies installed
- [ ] PostgreSQL running (or SQLite configured)
- [ ] Redis running (optional)
- [ ] .env file configured
- [ ] Migrations run successfully
- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] Can register a user
- [ ] Can login
- [ ] Can get profile

**If all checked, you're ready to develop!** 🚀

---

**Quick Start Time:** 5-15 minutes  
**Full Setup Time:** 15 minutes  
**Difficulty:** Easy  
**Status:** ✅ Ready to use
