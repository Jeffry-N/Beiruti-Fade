# 📋 Deployment & Testing Checklist

## Pre-Deployment Verification

### Backend Setup
- [ ] MySQL Server installed and running
- [ ] Database created: `beirutifade`
- [ ] Tables created with sample data
- [ ] JDBC driver (`mysql-connector-java-8.0.x.jar`) in `backend/lib/`
- [ ] Java 11+ installed
- [ ] Port 8080 available and not in use
- [ ] Backend compiles without errors
- [ ] Backend starts successfully

### Mobile Setup
- [ ] Node.js 18+ installed
- [ ] Expo CLI installed globally
- [ ] Mobile dependencies installed (`npm install`)
- [ ] IP address in `api.ts` updated to your local IP
- [ ] No TypeScript errors
- [ ] All required permissions in app.json

### Network
- [ ] Backend and mobile device on same network
- [ ] Firewall allows port 8080
- [ ] No VPN conflicting with local network

## Testing Checklist

### Authentication Tests
- [ ] **Signup Flow**
  - [ ] Can create customer account
  - [ ] Can create barber account
  - [ ] Email validation works
  - [ ] Duplicate username rejected
  - [ ] Redirects to login after signup
  
- [ ] **Login Flow**
  - [ ] Can login as customer
  - [ ] Can login as barber
  - [ ] Invalid credentials show error
  - [ ] User data persists in AsyncStorage
  - [ ] Redirects to home on success

### Home Screen Tests
- [ ] **Display**
  - [ ] Welcome message shows user name
  - [ ] Services list loads correctly (5 items)
  - [ ] Barbers list loads correctly (3+ items)
  - [ ] Balance displays
  - [ ] Top UP button present
  
- [ ] **Navigation**
  - [ ] Clicking service navigates to booking
  - [ ] My Appointments button works
  - [ ] Logout clears session

### Booking Flow Tests
- [ ] **Service Selection**
  - [ ] All 5 services display
  - [ ] Can select/deselect service
  - [ ] Prices display correctly
  - [ ] Selected service highlights
  
- [ ] **Barber Selection**
  - [ ] All barbers display
  - [ ] Can select/deselect barber
  - [ ] Bios display correctly
  
- [ ] **Date Selection**
  - [ ] Calendar shows 30 days
  - [ ] Can scroll through dates
  - [ ] Selected date highlights
  - [ ] Past dates not available
  
- [ ] **Time Selection**
  - [ ] 21 time slots display
  - [ ] Can select/deselect time
  - [ ] Selected time highlights
  - [ ] All slots are selectable
  
- [ ] **Confirmation**
  - [ ] All details display correctly
  - [ ] Can edit (go back)
  - [ ] Confirm button creates appointment
  - [ ] Success alert appears
  - [ ] Redirects to home/appointments

### Appointments Screen Tests
- [ ] **Display**
  - [ ] Lists all user appointments
  - [ ] Shows barber name
  - [ ] Shows service name
  - [ ] Shows date and time
  - [ ] Shows appointment status
  - [ ] Status colors correct
  
- [ ] **Empty State**
  - [ ] Shows message when no appointments
  - [ ] Book Now button present and works
  
- [ ] **Actions**
  - [ ] Reschedule button present
  - [ ] Cancel button present
  - [ ] Buttons are functional

### API Tests

#### /login Endpoint
- [ ] `curl -X POST -d "username=steve&password=password123&type=customer" http://localhost:8080/login`
- [ ] Expected: 200 OK with user data
- [ ] Try invalid: 401 Unauthorized

#### /signup Endpoint
- [ ] `curl -X POST -d "fullName=Test&username=test123&email=test@example.com&password=pass&type=customer" http://localhost:8080/signup`
- [ ] Expected: 201 Created
- [ ] Try duplicate username: Error

#### /services Endpoint
- [ ] `curl http://localhost:8080/services`
- [ ] Expected: 200 OK with 5 services
- [ ] Verify prices: $25, $20, $35, $18, $30

#### /barbers Endpoint
- [ ] `curl http://localhost:8080/barbers`
- [ ] Expected: 200 OK with 3+ barbers
- [ ] Verify names and bios

#### /appointment Endpoint (POST)
- [ ] `curl -X POST -d "customerId=1&barberId=1&serviceId=1&appointmentDate=2025-01-30&appointmentTime=10:00" http://localhost:8080/appointment`
- [ ] Expected: 200 OK with appointmentId

#### /appointment Endpoint (GET)
- [ ] `curl "http://localhost:8080/appointment?customerId=1"`
- [ ] Expected: 200 OK with appointment list

### Database Tests
- [ ] `SELECT COUNT(*) FROM customer;` - Should show 1+
- [ ] `SELECT COUNT(*) FROM service;` - Should show 5
- [ ] `SELECT COUNT(*) FROM barber;` - Should show 3
- [ ] `SELECT * FROM appointment WHERE CustomerId=1;` - Check bookings
- [ ] Foreign key constraints working
- [ ] Data integrity maintained

### UI/UX Tests
- [ ] **Responsiveness**
  - [ ] Works on different screen sizes
  - [ ] Text is readable
  - [ ] Buttons are tappable
  - [ ] No text overflow
  
- [ ] **Loading States**
  - [ ] Loading spinners appear
  - [ ] Buttons disabled during requests
  - [ ] No double-submit possible
  
- [ ] **Error Handling**
  - [ ] Network errors show alerts
  - [ ] Validation errors caught
  - [ ] User can retry
  
- [ ] **Styling**
  - [ ] Colors match design (#CCFF00, #000, etc)
  - [ ] Spacing is consistent
  - [ ] Buttons have hover/press states
  - [ ] No broken layouts

## Performance Tests

### Load Tests
- [ ] Backend handles 100+ requests/second
- [ ] Database handles concurrent connections
- [ ] No memory leaks in app

### Speed Tests
- [ ] /login responds in <1 second
- [ ] /services loads in <500ms
- [ ] Booking flow is smooth
- [ ] App doesn't lag on older devices

## Security Tests

### Input Validation
- [ ] SQL injection attempts fail
- [ ] XSS attempts blocked
- [ ] Invalid data rejected
- [ ] Password not logged
- [ ] Email format validated
- [ ] Username length validated

### Authentication
- [ ] Logged-out users can't access protected routes
- [ ] Session persists on app restart
- [ ] Logout clears all session data
- [ ] No tokens exposed in logs

### CORS
- [ ] Mobile can access backend
- [ ] Other origins rejected
- [ ] Credentials handled safely

## Browser/Device Tests

### Mobile Platforms
- [ ] ✅ Android 10+ (tested with emulator/device)
- [ ] ✅ iOS 13+ (tested with simulator)
- [ ] ✅ Tablet screens (iPad, large Android)
- [ ] ✅ Phone screens (iPhone SE, small Android)

### Browsers (Web if applicable)
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### Orientations
- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Orientation changes handled

## Edge Cases

- [ ] User closes app mid-booking → Data lost (expected)
- [ ] Network lost during booking → Error shown
- [ ] Device offline → Can't proceed
- [ ] Same user logged in twice → Last login wins
- [ ] Very long names/emails → Handled gracefully
- [ ] Special characters in username → Encoded properly
- [ ] Multiple rapid clicks → Single request sent
- [ ] Booking same slot twice → Second fails with error

## Documentation Tests

- [ ] QUICKSTART.md is accurate
- [ ] IMPLEMENTATION_GUIDE.md covers all features
- [ ] COMPLETION_SUMMARY.md matches implementation
- [ ] ARCHITECTURE.md diagrams are correct
- [ ] Code comments are helpful
- [ ] API docs are complete

## Sign-Off Checklist

- [ ] All tests passed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Code follows conventions
- [ ] Error messages are helpful
- [ ] User experience is smooth
- [ ] Ready for production

## Known Limitations (Document for Users)

- [ ] No real payment processing yet
- [ ] No email/SMS notifications
- [ ] No barber can't see customer info (yet)
- [ ] No image uploads
- [ ] No reviews/ratings
- [ ] No recurring appointments
- [ ] No waiting list

## Future Work

- [ ] Add payment gateway integration
- [ ] Implement push notifications
- [ ] Create barber dashboard
- [ ] Add customer reviews
- [ ] Image gallery for barber portfolio
- [ ] Real-time availability
- [ ] Analytics dashboard
- [ ] Mobile app signing for production release

---

**Ready to deploy! 🚀**

Run through this checklist before going live to ensure everything works perfectly.
