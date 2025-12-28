# 🚀 Quick Start Checklist

## Step 1: Database Setup ✅
- [ ] Install MySQL if not already installed
- [ ] Run: `mysql -u root -p < backend/database/beirutifade.sql`
- [ ] Verify tables created: `USE beirutifade; SHOW TABLES;`
- [ ] Check sample data: `SELECT * FROM service;`

## Step 2: Backend Setup ✅
- [ ] Download MySQL JDBC driver
  - Get `mysql-connector-java-8.0.x.jar` 
  - Place in `backend/lib/` folder
- [ ] Navigate to backend folder
- [ ] Compile:
  ```bash
  javac -cp ".:lib/*" -d . handlers/*.java database/*.java MainServer.java
  ```
- [ ] Run:
  ```bash
  java -cp ".:lib/*" backend.MainServer
  ```
- [ ] Verify: Should print "Backend running on port 8080..."

## Step 3: Mobile Setup ✅
- [ ] Navigate to mobile folder
- [ ] Install dependencies: `npm install`
- [ ] **IMPORTANT**: Update IP in `api.ts`
  - Find your computer's IP address
  - Update line: `const IP = "YOUR_IP";`
- [ ] Start Expo: `npm start`
- [ ] Test in Android emulator or iOS simulator

## Step 4: Test the App ✅

### Login Test
- Username: `steve`
- Password: `password123`
- Role: Customer
- Expected: Should navigate to home screen

### Booking Test
1. Login with test account
2. Click a service (e.g., HAIRCUT)
3. Select barber (Steve Johnson, Mike Davis, or Alex Martinez)
4. Select date (tomorrow or later)
5. Select time (any available slot)
6. Confirm booking
7. Expected: Success alert and appointment saved

### View Appointments
- Click "My Appointments" button
- Should see your booked appointments with status

## 🎯 What's Included

### Screens Built
- ✅ Login Screen
- ✅ Signup Screen  
- ✅ Home Dashboard (Services + Top Barbers)
- ✅ Booking Screen (Date/Time/Service/Barber Selection)
- ✅ Confirmation Screen
- ✅ Appointments List Screen

### Backend Endpoints
- ✅ POST /login - User authentication
- ✅ POST /signup - User registration
- ✅ GET /services - List services
- ✅ GET /barbers - List barbers
- ✅ POST /appointment - Create appointment
- ✅ GET /appointment - Get user appointments

### Database
- ✅ 5 Services (Haircut, Shaving, Treatment, Beard Care, Hair Style)
- ✅ 3 Sample Barbers
- ✅ 1 Sample Customer Account
- ✅ Complete schema with relationships

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Check Java server is running, verify IP in api.ts |
| "Database connection error" | Ensure MySQL is running, check credentials in db.java |
| "Services not loading" | Run SQL script to populate sample data |
| "Port 8080 already in use" | Kill process: `lsof -ti:8080 \| xargs kill -9` |
| "Expo won't find backend" | Ensure mobile device and backend on same network |

## 📝 Test Accounts

### Customer
- **Username**: john
- **Password**: password123

### Barber (Can login but limited UI)
- **Username**: steve
- **Password**: password123

## 🎨 Color Reference
- **Primary**: #CCFF00 (Lime)
- **Dark BG**: #000000 (Black)
- **Card BG**: #1A1A2E (Dark Blue-Black)
- **Text**: #FFFFFF (White)
- **Muted**: #888888 (Gray)

## ✨ Features Highlights
- Dark theme with lime accents
- Smooth animations and transitions
- Responsive design for all screen sizes
- Calendar date picker (30 days)
- Time slot selection
- Appointment history
- Barber browsing
- Service details with pricing

## 🚢 Deployment Ready
- Type-safe frontend code
- Well-structured backend
- Proper error handling
- CORS enabled
- Ready for production scaling

---

**You're all set! Happy coding! 💈**

For more details, see `IMPLEMENTATION_GUIDE.md`
