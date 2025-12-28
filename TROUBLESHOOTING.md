# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### Issue: "Address already in use" on port 8080
**Problem**: Another process is using port 8080

**Solutions**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8080 | xargs kill -9

# Alternative - Use different port
# Edit MainServer.java line: new InetSocketAddress(8081), 0);
```

#### Issue: "MySQL Driver not found"
**Problem**: JDBC driver not in lib folder

**Solutions**:
1. Download `mysql-connector-java-8.0.33.jar` from MySQL website
2. Create `backend/lib/` folder if it doesn't exist
3. Place JAR file in `backend/lib/`
4. Recompile Java files

#### Issue: "Access denied for user 'root'@'localhost'"
**Problem**: Wrong MySQL credentials

**Solutions**:
```bash
# Check your MySQL password
mysql -u root -p

# Update credentials in backend/database/db.java
private static final String PASSWORD = "your_actual_password";

# Then recompile
```

#### Issue: "Unknown database 'beirutifade'"
**Problem**: Database not created

**Solutions**:
```bash
# Run the SQL script
mysql -u root -p < backend/database/beirutifade.sql

# Or manually create
mysql -u root -p
mysql> CREATE DATABASE beirutifade;
mysql> USE beirutifade;
mysql> [copy contents from beirutifade.sql]
```

#### Issue: Backend compiles but won't run
**Problem**: Class path issues

**Solutions**:
```bash
# Make sure you're in backend directory
cd backend

# Recompile with explicit classpath
javac -cp ".:lib/*" -d . handlers/*.java database/*.java MainServer.java

# Run with same classpath
java -cp ".:lib/*" backend.MainServer

# Check for typos in class names
```

---

### Mobile App Issues

#### Issue: "Cannot connect to backend" error
**Problem**: Wrong IP address or network connectivity

**Solutions**:
1. **Find your IP address**:
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.x.x)
   
   # Mac/Linux
   ifconfig
   # Look for "inet" address
   ```

2. **Update api.ts**:
   ```typescript
   const IP = "YOUR_ACTUAL_IP"; // e.g., "192.168.1.100"
   ```

3. **Verify network**:
   - Mobile device on same WiFi as backend
   - No VPN on mobile device
   - Firewall not blocking port 8080

4. **Test connection**:
   ```bash
   # From mobile terminal/adb shell
   curl http://YOUR_IP:8080/services
   # Should return JSON array
   ```

#### Issue: "Expo can't find module" error
**Problem**: Dependencies not installed

**Solutions**:
```bash
# Navigate to mobile folder
cd mobile

# Clear node_modules (sometimes helps)
rm -rf node_modules package-lock.json

# Reinstall everything
npm install

# If still issues, try:
npm install --force
```

#### Issue: "AsyncStorage not found"
**Problem**: Dependency version issue

**Solutions**:
```bash
# Reinstall AsyncStorage
npm install @react-native-async-storage/async-storage

# Or update package.json manually
# Check: "dependencies" section has the package
```

#### Issue: App crashes on startup
**Problem**: Navigation or initialization error

**Solutions**:
1. Check console for error messages
2. Verify `_layout.tsx` is correct
3. Ensure all imports exist:
   ```typescript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { useRouter, useLocalSearchParams } from 'expo-router';
   ```
4. Clear cache: `expo start --clear`

#### Issue: "Cannot find variable 'IP'" in api.ts
**Problem**: Import not working

**Solutions**:
```typescript
// Check export at bottom of api.ts
export const apiCall = async<T>(...) => { ... }

// Check import in other files
import { login, getServices } from '../api';
```

#### Issue: Login works but home doesn't load
**Problem**: Services API not responding

**Solutions**:
1. Verify backend is running
2. Check services endpoint: `curl http://IP:8080/services`
3. Check mobile logs for error details
4. Verify database has service data:
   ```bash
   mysql> SELECT * FROM service;
   ```

---

### Database Issues

#### Issue: "Foreign key constraint fails"
**Problem**: Trying to insert invalid references

**Solutions**:
```bash
# Verify data exists
mysql> SELECT * FROM customer;
mysql> SELECT * FROM barber;
mysql> SELECT * FROM service;

# Try inserting with valid IDs
mysql> INSERT INTO appointment (CustomerId, BarberId, ServiceId, AppointmentDate, AppointmentTime, Status) 
       VALUES (1, 1, 1, '2025-02-01', '10:00', 'pending');
```

#### Issue: "Table doesn't exist" error
**Problem**: Wrong database selected

**Solutions**:
```bash
# Always specify database in connection
mysql -u root -p -e "USE beirutifade; SHOW TABLES;"

# Or in SQL script
USE beirutifade;
SELECT * FROM service;
```

#### Issue: Sample data not inserted
**Problem**: SQL script didn't run completely

**Solutions**:
```bash
# Re-run the full script
mysql -u root -p < backend/database/beirutifade.sql

# Or manually insert
mysql -u root -p
mysql> USE beirutifade;
mysql> INSERT INTO service (Name, Description, Price) VALUES ('HAIRCUT', 'Classic professional haircut', 25.00);
```

---

### Network Issues

#### Issue: Firewall blocking connection
**Problem**: Windows/Mac firewall rejecting port 8080

**Solutions**:
**Windows Firewall**:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Click "Change settings"
4. Click "Allow another app"
5. Select `java.exe` and click "Add"

**Mac Firewall**:
1. System Preferences → Security & Privacy
2. Click "Firewall Options"
3. Click "Add" to allow Java

**Temporarily disable firewall** (development only):
```bash
# Windows
netsh advfirewall set allprofiles state off

# Mac
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

#### Issue: "Network request timeout"
**Problem**: Backend not responding

**Solutions**:
1. Verify backend is running
2. Check IP address is correct
3. Check port 8080 is open: `netstat -an | grep 8080`
4. Increase timeout in api.ts:
   ```typescript
   const response = await fetch(url, {
     ...options,
     timeout: 10000 // 10 seconds
   });
   ```

---

### Development Issues

#### Issue: TypeScript errors in IDE
**Problem**: tsconfig.json configuration

**Solutions**:
```bash
# Regenerate TypeScript config
cd mobile
rm tsconfig.json
npx tsc --init

# Or copy from working version
# Should have: lib, target, jsx, esModuleInterop
```

#### Issue: ESLint/Linting errors
**Problem**: Code style issues

**Solutions**:
```bash
# Fix automatically
npm run lint -- --fix

# Or ignore errors during development
# In package.json, modify lint script
"lint": "expo lint --no-fix"
```

#### Issue: Hot reload not working
**Problem**: Expo dev server issue

**Solutions**:
```bash
# Clear Expo cache
expo start --clear

# Restart development server
# Press 'q' to quit, then npm start again

# Clear watch cache
rm -rf .expo .next
```

---

### Specific Feature Issues

#### Issue: "Booking doesn't save"
**Problem**: /appointment endpoint failing

**Solutions**:
1. Check backend logs for error message
2. Verify all parameters are sent:
   ```
   customerId, barberId, serviceId, appointmentDate, appointmentTime
   ```
3. Verify date format is correct: `YYYY-MM-DD`
4. Verify time format is correct: `HH:MM`
5. Test manually:
   ```bash
   curl -X POST -d "customerId=1&barberId=1&serviceId=1&appointmentDate=2025-02-01&appointmentTime=10:00" \
   http://localhost:8080/appointment
   ```

#### Issue: "Services don't load"
**Problem**: /services endpoint failing

**Solutions**:
1. Check database has services:
   ```bash
   mysql> SELECT COUNT(*) FROM service;
   # Should be 5
   ```
2. Test endpoint directly:
   ```bash
   curl http://localhost:8080/services
   ```
3. Check for JSON parsing errors in mobile
4. Add error logging:
   ```typescript
   const result = await getServices();
   console.log('Services result:', result);
   ```

#### Issue: "Can't select past dates"
**Problem**: Date validation issue

**Solutions**:
Check booking.tsx:
```typescript
const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) { // Should start at 0 to include today
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};
```

---

## Debug Logging

### Enable backend logging
```java
// Add to MainServer.java
System.out.println("Received: " + body);
System.out.println("Response: " + response);
```

### Enable mobile logging
```typescript
// Add to api.ts
console.log('API Call:', endpoint, method);
console.log('Response:', result);
```

### View Android logs
```bash
npx adb logcat | grep "ReactNativeJS"
```

---

## Reset Everything

If completely stuck, reset everything:

```bash
# Backend
cd backend
rm -rf *.class handlers/*.class database/*.class

# Mobile
cd mobile
rm -rf node_modules package-lock.json .expo .next
npm install

# Database
mysql -u root -p
DROP DATABASE beirutifade;
# Re-run SQL script

# Restart everything from scratch
```

---

## Getting Help

1. **Check console output** - Most errors are logged
2. **Test endpoints manually** - Use curl to isolate issues
3. **Verify database** - Use MySQL client to check data
4. **Check IP address** - Most common issue
5. **Review logs** - Backend and mobile both log errors

---

**Still stuck? Here's what to check:**

```
✅ Is backend running? → Check terminal
✅ Is database running? → Check MySQL service
✅ Correct IP in api.ts? → Check ipconfig
✅ All dependencies installed? → npm install
✅ All Java files compiled? → javac...
✅ Port 8080 available? → netstat -an
✅ Same WiFi network? → Check WiFi
✅ No firewall blocking? → Check firewall settings
```

**Common fixes in order of frequency:**
1. Wrong IP address (60%)
2. Backend not running (20%)
3. Database not set up (10%)
4. Firewall/network (9%)
5. Other (1%)

---

**99% of issues are network/configuration related, not code bugs!**
