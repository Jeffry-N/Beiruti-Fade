# Beiruti Fade - Barbershop Booking App

A complete barbershop booking application built with **React Native (Expo)** frontend and **Java Backend** with MySQL database.

## ✨ Features

### Customer Features
- 🔐 **User Authentication**: Login/Signup with customer and barber roles
- 📅 **Book Appointments**: Select service, barber, date, and time
- 👨 **Browse Services**: View all available barbershop services (Haircut, Shaving, Treatment, Beard Care, Hair Style)
- 💇 **Choose Barbers**: Select from available barbers with bios
- 📋 **Manage Appointments**: View, reschedule, or cancel bookings
- 💰 **Wallet Balance**: Track balance and top up credits

### Barber Features
- Login as a barber to manage appointments
- View scheduled appointments

### Design
- Modern dark theme with lime green (#CCFF00) accents
- Intuitive mobile-first interface
- Smooth navigation and animations

## 🏗️ Architecture

### Frontend (Mobile)
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Hooks + AsyncStorage
- **Styling**: React Native StyleSheet

### Backend
- **Framework**: Java HTTP Server
- **Database**: MySQL
- **API**: RESTful endpoints

### Database
- **Customer** table: User accounts
- **Barber** table: Barber profiles
- **Service** table: Available services
- **Appointment** table: Bookings
- **Product** table: Inventory (for future use)
- **Product_Order** table: Orders (for future use)

## 📱 Project Structure

```
Beiruti-Fade/
├── mobile/                    # React Native Frontend
│   ├── app/
│   │   ├── index.tsx         # Login screen
│   │   ├── signup.tsx        # Registration screen
│   │   ├── home.tsx          # Dashboard with services
│   │   ├── booking.tsx       # Booking screen
│   │   ├── confirmation.tsx  # Confirm booking
│   │   ├── appointments.tsx  # View appointments
│   │   └── _layout.tsx       # Navigation setup
│   ├── api.ts                # API utilities
│   ├── package.json          # Dependencies
│   └── tsconfig.json         # TypeScript config
│
└── backend/                   # Java Backend
    ├── MainServer.java        # HTTP Server setup
    ├── database/
    │   ├── db.java           # Database connection
    │   └── beirutifade.sql   # Schema + sample data
    └── handlers/
        ├── LoginHandler.java
        ├── SignupHandler.java
        ├── ServiceHandler.java
        ├── BarberHandler.java
        └── AppointmentHandler.java
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+) for mobile development
- **Java** (JDK 11+) for backend
- **MySQL** (5.7+) database server
- **Expo CLI** (`npm install -g expo-cli`)

### Setup Instructions

#### 1. Database Setup
```bash
# Open MySQL
mysql -u root -p

# Run the SQL script
source backend/database/beirutifade.sql;
```

This creates:
- Database: `beirutifade`
- Tables: customer, barber, service, product, appointment, product_order
- Sample data: 3 barbers and 5 services

#### 2. Backend Setup
```bash
cd backend

# Compile Java files
javac -cp ".:lib/*" -d . handlers/*.java database/*.java MainServer.java

# Run the server
java -cp ".:lib/*" backend.MainServer
```

Server will start on `http://localhost:8080`

**Note**: Make sure you have the MySQL JDBC driver in `lib/` folder:
- Download `mysql-connector-java-8.0.x.jar`
- Place it in `backend/lib/`

#### 3. Mobile Setup
```bash
cd mobile

# Install dependencies
npm install

# Update IP address in api.ts
# Change IP from 192.168.0.105 to your computer's local IP

# Start Expo
npm start

# Run on Android or iOS
# Press 'a' for Android or 'i' for iOS
```

## 📲 API Endpoints

### Authentication
- **POST** `/login` - Login (customer or barber)
- **POST** `/signup` - Register new account

### Services
- **GET** `/services` - List all services

### Barbers
- **GET** `/barbers` - List all barbers

### Appointments
- **POST** `/appointment` - Create new appointment
- **GET** `/appointment?customerId=X` - Get customer's appointments

## 🎨 Color Scheme
- **Background**: `#000000` (Black)
- **Primary Accent**: `#CCFF00` (Lime Green)
- **Secondary Background**: `#1A1A1A`
- **Text**: `#FFFFFF` (White)
- **Muted**: `#888888` (Gray)

## 📝 Key Flows

### Login Flow
1. User enters credentials
2. Select role (Customer/Barber)
3. API validates and returns user info
4. User data stored in AsyncStorage
5. Navigate to Home dashboard

### Booking Flow
1. User selects service from home
2. Choose barber
3. Select date (30-day range)
4. Pick time slot (09:00 - 20:00)
5. Review and confirm booking
6. Appointment saved to database

### State Management
- User authentication state in AsyncStorage
- Navigation controlled by RootLayout based on auth state
- App shows login/signup screens if not authenticated
- Shows home/booking screens if authenticated

## 🔧 Important Configuration

### Update Backend IP Address
In `mobile/api.ts`, change the IP to your computer's local IP:
```typescript
const IP = "192.168.0.105"; // Change this to your IP
```

To find your IP:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: `ifconfig` (look for inet address)

### Database Connection
In `backend/database/db.java`, update credentials if needed:
```java
private static final String USER = "root"; 
private static final String PASSWORD = "root";
```

## 📦 Dependencies

### Mobile
- expo-router (Navigation)
- @react-native-async-storage/async-storage (Persistent storage)
- react-native (UI)

### Backend
- Java Built-in HTTP Server (com.sun.net.httpserver)
- MySQL Connector/J (JDBC)

## 🐛 Troubleshooting

**Issue**: Connection refused when booking
- **Solution**: Ensure Java backend is running and IP is correct in api.ts

**Issue**: Database connection error
- **Solution**: Verify MySQL is running and credentials match db.java

**Issue**: Services not loading
- **Solution**: Run SQL script to populate sample data

**Issue**: Expo won't connect to backend
- **Solution**: Check firewall settings and ensure both devices are on same network

## 🚧 Future Enhancements
- Push notifications for appointments
- Payment integration
- Barber availability calendar
- Product/merchandise store
- User reviews and ratings
- Barber portfolio with images
- Email confirmations
- SMS reminders
- Admin dashboard

## 📄 License
Private Project - Beiruti Fade

## 👨‍💻 Developer Notes

**Architecture Decisions**:
- Used AsyncStorage for simple local auth state (suitable for this scale)
- Java HTTP Server chosen for simplicity (can scale to Spring Boot if needed)
- Direct JDBC queries for better control (can add ORM later)
- Expo Router for type-safe navigation in React Native

**Security Considerations**:
- For production: Add password hashing (bcrypt)
- Implement JWT tokens instead of storing user data locally
- Add HTTPS
- Validate all inputs on backend
- Implement rate limiting

---

**Happy Coding! Enjoy building your barbershop booking app! 💈✨**
