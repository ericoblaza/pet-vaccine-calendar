# Pet Vaccine Calendar 🐾

A mobile-friendly web application for managing pet vaccination schedules with reminders, location tracking, and easy categorization.

## Features

### 📅 Calendar View
- Visual calendar showing all appointments
- Easy navigation between months
- Color-coded days with appointment indicators
- Click on any day to add or view appointments

### 📋 List View
- Chronological list of all appointments
- Sort by date (ascending/descending)
- Quick view of key information

### 🔍 Search & Filter
- Search by pet name, owner name, or location
- Filter by pet type (Dog, Cat, Rabbit, Bird, etc.)
- Filter by vaccine type
- Clear filters easily

### ➕ Appointment Management
- Add new appointments with all details:
  - Pet name and type
  - Vaccine type
  - Date and time
  - Owner information (name and phone)
  - Location (with GPS support)
  - Notes
  - Reminder settings
- Edit existing appointments
- Delete appointments

### 📍 Location Tracking
- Manual location entry
- GPS location button to get current coordinates
- Location displayed on all appointments

### 🔔 Reminders
- Set reminders (15 min, 30 min, 1 hour, or 1 day before)
- Browser notifications (with permission)
- In-app reminder badges
- Automatic reminder checking

### 📊 Statistics
- Today's appointments count
- This week's appointments
- This month's appointments

### 📱 Mobile-Friendly
- Responsive design optimized for Android phones
- Large, easy-to-tap buttons
- Simple, intuitive interface
- Works offline (Progressive Web App)

## Setup

### First Time Setup

1. **Generate Icons** (Optional but recommended):
   - Open `create-icons.html` in your browser
   - Click "Download Icons" button
   - This will download `icon-192.png` and `icon-512.png`
   - Place these files in the same folder as `index.html`

2. **Access the App**:
   - If using XAMPP, access via: `http://localhost/vaccine_calendar/`
   - Or open `index.html` directly in your browser
   - For Android, you'll need to access it via your local network IP or use a web server

### Installation on Android

1. Open the app in Chrome browser on your Android phone
   - If on same network: `http://YOUR_COMPUTER_IP/vaccine_calendar/`
   - Or use a service like ngrok to expose it publicly
2. Tap the menu (three dots) in the top right
3. Select "Add to Home screen" or "Install app"
4. The app will appear on your home screen like a native app
5. Grant location and notification permissions when prompted for full functionality

## Usage

### Adding an Appointment
1. Tap the "+ Add" button
2. Fill in the required information:
   - Pet name and type
   - Vaccine type
   - Date and time
   - Location (or use GPS button)
3. Optionally add owner information and notes
4. Set a reminder if needed
5. Tap "Save"

### Viewing Appointments
- **Calendar View**: See all appointments on a calendar. Days with appointments are highlighted.
- **List View**: See a sorted list of all upcoming appointments.

### Filtering
1. Select filter type (Pet Type or Vaccine Type)
2. Choose the specific type from the dropdown
3. View filtered results
4. Tap "Clear Filter" to show all appointments

### Searching
- Type in the search box to find appointments by:
  - Pet name
  - Owner name
  - Location

### Editing/Deleting
1. Tap on any appointment card
2. View full details
3. Tap "Edit" to modify or "Delete" to remove

## Data Storage

All data is stored locally on your device using browser storage. Your appointments are private and never leave your device.

## Browser Requirements

- Modern browser with JavaScript enabled
- Chrome, Firefox, or Edge recommended
- For GPS location: Location permissions required
- For notifications: Notification permissions required

## Tips for Easy Use

1. **Quick Add**: Tap any day on the calendar to quickly add an appointment for that day
2. **GPS Location**: Use the location button to automatically fill in your current location
3. **Reminders**: Set reminders to never miss an appointment
4. **Search**: Use search to quickly find specific pets or locations
5. **Filter**: Filter by pet type when you have many different animals

## Support

This is a local web application. All your data stays on your device. If you clear your browser data, your appointments will be lost, so consider backing up important information.

---

Made with ❤️ to make pet vaccination scheduling easier!

