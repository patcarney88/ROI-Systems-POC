# 🔧 Backend Implementation Guide

**Status:** Ready for Implementation  
**Phase:** Backend Development  
**Estimated Time:** 2-3 weeks

---

## 📋 Implementation Checklist

### **Week 1: Core Backend** ✅ (Mostly Complete)
- [x] Project structure
- [x] Express server setup
- [x] Security configuration
- [x] Database models
- [x] API routes
- [x] Middleware
- [x] Auth controller
- [x] Client controller
- [x] Document controller
- [x] Campaign controller
- [ ] Test all endpoints
- [ ] Connect to frontend

### **Week 2: Services & Integration**
- [ ] Email service (SendGrid)
- [ ] SMS service (Twilio)
- [ ] File storage (AWS S3)
- [ ] WebSocket server
- [ ] Real-time messaging
- [ ] Scheduled jobs
- [ ] Error tracking

### **Week 3: Testing & Polish**
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment prep

---

## 🚀 Quick Start (Choose One)

### **Option 1: SQLite (Fastest - 2 minutes)**
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:./dev.db
JWT_SECRET=dev-secret-key
JWT_REFRESH_SECRET=dev-refresh-key
CORS_ORIGINS=http://localhost:5051
EOF

# 3. Start server
npm run dev
```

### **Option 2: PostgreSQL (Recommended - 15 minutes)**
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Run database setup script
./setup-database.sh

# 3. Start server
npm run dev
```

### **Option 3: Docker (Isolated - 10 minutes)**
```bash
cd backend

# 1. Start services
docker-compose up -d

# 2. Install dependencies
npm install

# 3. Run migrations
npm run migrate

# 4. Start server
npm run dev
```

---

## ✅ Verify Backend is Working

### **1. Health Check**
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-15T12:00:00.000Z"
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

### **3. Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `accessToken` from the response!

### **4. Get Profile**
```bash
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔌 Connect Frontend to Backend

### **Step 1: Update Frontend Environment**

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### **Step 2: Update API Client**

Create `frontend/src/utils/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  },

  // Auth
  register: (data: any) => api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data: any) => api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getProfile: () => api.request('/auth/profile'),

  // Add more endpoints as needed
};
```

### **Step 3: Update AuthContext**

Update `frontend/src/contexts/AuthContext.tsx` to use real API:

```typescript
// Replace mock implementations with:
const login = async (credentials: AuthCredentials) => {
  const response = await api.login(credentials);
  localStorage.setItem('accessToken', response.data.tokens.accessToken);
  localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
  setUser(response.data.user);
  return response;
};
```

### **Step 4: Test Integration**

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open http://localhost:5051/login
4. Try registering a new user
5. Try logging in
6. Check if you can access protected routes

---

## 📝 What's Already Implemented

### **Controllers (90% Complete):**
- ✅ `auth.controller.ts` - Register, login, refresh, profile
- ✅ `client.controller.ts` - CRUD operations
- ✅ `document.controller.ts` - Upload, download, manage
- ✅ `campaign.controller.ts` - Campaign management

### **Services (80% Complete):**
- ✅ `email.service.ts` - Email sending
- ✅ `storage.service.ts` - File storage
- ✅ `cache.service.ts` - Redis caching
- ✅ `cacheWarming.service.ts` - Cache optimization
- ✅ `dbMetrics.service.ts` - Database monitoring

### **Middleware (100% Complete):**
- ✅ `auth.middleware.ts` - JWT authentication
- ✅ `validation.middleware.ts` - Input validation
- ✅ `error.middleware.ts` - Error handling
- ✅ `rateLimiter.ts` - Rate limiting
- ✅ `logging.middleware.ts` - Request logging

### **Models (100% Complete):**
- ✅ `User.ts` - User model
- ✅ `Client.ts` - Client model
- ✅ `Document.ts` - Document model
- ✅ `Campaign.ts` - Campaign model
- ✅ `Property.ts` - Property model
- ✅ `Transaction.ts` - Transaction model
- ✅ `Alert.ts` - Alert model
- ✅ `Message.ts` - Message model
- ✅ `Organization.ts` - Organization model

---

## 🔨 What Needs Implementation

### **High Priority:**

1. **External Service Integration (3-4 days)**
   - [ ] SendGrid email templates
   - [ ] Twilio SMS integration
   - [ ] AWS S3 file upload/download
   - [ ] Test all integrations

2. **WebSocket Server (2-3 days)**
   - [ ] Socket.io setup
   - [ ] Real-time messaging
   - [ ] Typing indicators
   - [ ] Read receipts
   - [ ] Online status

3. **ML Alert Engine (3-4 days)**
   - [ ] TensorFlow.js setup
   - [ ] Alert generation logic
   - [ ] Scoring algorithm
   - [ ] Scheduled processing

### **Medium Priority:**

4. **Scheduled Jobs (1-2 days)**
   - [ ] Email campaigns
   - [ ] Alert generation
   - [ ] Data cleanup
   - [ ] Report generation

5. **API Documentation (1-2 days)**
   - [ ] Swagger/OpenAPI setup
   - [ ] Endpoint documentation
   - [ ] Example requests
   - [ ] Error codes

6. **Testing Suite (3-4 days)**
   - [ ] Unit tests (Jest)
   - [ ] Integration tests
   - [ ] E2E tests
   - [ ] Test coverage > 80%

### **Low Priority:**

7. **Performance Optimization (2-3 days)**
   - [ ] Database indexing
   - [ ] Query optimization
   - [ ] Caching strategy
   - [ ] Load testing

8. **Monitoring & Logging (1-2 days)**
   - [ ] Sentry integration
   - [ ] DataDog setup
   - [ ] Log aggregation
   - [ ] Alerting

---

## 🧪 Testing Endpoints

### **Using curl:**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","firstName":"John","lastName":"Doe"}'

# Login
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}' \
  | jq -r '.data.tokens.accessToken')

# Get Profile
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN"

# Create Client
curl -X POST http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane@example.com","phone":"555-1234"}'

# List Clients
curl http://localhost:3000/api/v1/clients \
  -H "Authorization: Bearer $TOKEN"
```

### **Using Postman:**
1. Import collection from `backend/postman/`
2. Set environment variable `baseUrl` to `http://localhost:3000/api/v1`
3. Run authentication requests
4. Token will be automatically saved
5. Test other endpoints

---

## 🐛 Common Issues & Solutions

### **Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
# Or use different port:
PORT=3001 npm run dev
```

### **Database connection error:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Test connection
psql -d roi_systems -c "SELECT 1"

# Or use SQLite:
# Edit .env: DATABASE_URL=sqlite:./dev.db
```

### **Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **Migration errors:**
```bash
# Reset database
npm run migrate:undo:all
npm run migrate
```

---

## 📊 Development Workflow

### **Daily Development:**
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (new terminal)
cd frontend && npm run dev

# 3. Watch logs
tail -f backend/logs/combined.log

# 4. Test changes
curl http://localhost:3000/api/v1/...
```

### **Before Committing:**
```bash
# 1. Run linter
npm run lint

# 2. Run tests
npm test

# 3. Check types
npm run build

# 4. Format code
npm run format
```

---

## 🎯 Next Steps

1. ✅ Backend structure complete
2. 🔄 **YOU ARE HERE** - Start backend server
3. ⏳ Test all endpoints
4. ⏳ Connect frontend to backend
5. ⏳ Implement external services
6. ⏳ Add WebSocket server
7. ⏳ Create testing suite
8. ⏳ Deploy to staging

---

## 📚 Additional Resources

- **API Documentation:** http://localhost:3000/api-docs (after setup)
- **Database Schema:** See `backend/src/models/`
- **Postman Collection:** `backend/postman/ROI-Systems.postman_collection.json`
- **Environment Variables:** `backend/.env.example`

---

**Ready to start!** Follow the Quick Start guide above to get the backend running in minutes.

**Status:** ✅ Ready for Implementation  
**Difficulty:** Medium  
**Time Required:** 2-3 weeks
