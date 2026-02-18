// App State
let appointments = [];
let currentDate = new Date();
let currentView = 'calendar';
let currentFilter = { type: 'all', value: '' };
let sortOrder = 'asc';

// DOM Elements
const addBtn = document.getElementById('addBtn');
const appointmentModal = document.getElementById('appointmentModal');
const detailModal = document.getElementById('detailModal');
const closeModal = document.getElementById('closeModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const appointmentForm = document.getElementById('appointmentForm');
const calendarView = document.getElementById('calendarView');
const listView = document.getElementById('listView');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthEl = document.getElementById('currentMonth');
const calendarGrid = document.getElementById('calendarGrid');
const appointmentsList = document.getElementById('appointmentsList');
const filterType = document.getElementById('filterType');
const filterValue = document.getElementById('filterValue');
const filterValueGroup = document.getElementById('filterValueGroup');
const clearFilterBtn = document.getElementById('clearFilter');
const searchInput = document.getElementById('searchInput');
const getLocationBtn = document.getElementById('getLocationBtn');
const sortBtn = document.getElementById('sortBtn');

// Initialize App
function init() {
    // Show app container after welcome screen (2.5 seconds)
    setTimeout(() => {
        const appContainer = document.getElementById('appContainer');
        if (appContainer) {
            appContainer.style.display = 'block';
        }
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }, 2500);
    
    loadAppointments();
    setupEventListeners();
    renderCalendar();
    updateStats();
    setupNotificationBanner();
    registerServiceWorker();
    
    // Schedule all reminders for background
    scheduleAllReminders();
    
    // Check for reminders every minute (when app is open)
    setInterval(checkReminders, 60000);
    
    // Also ask service worker to check (helps when tab is in background)
    setInterval(() => {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CHECK_REMINDERS_NOW' });
        }
    }, 60000);
    
    // Initial check
    checkReminders();
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_REMINDERS_NOW' });
    }
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully');
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', closeModalFunc);
    setupTestNotificationButton();
    closeDetailModal.addEventListener('click', closeDetailModalFunc);
    appointmentForm.addEventListener('submit', saveAppointment);
    calendarViewBtn.addEventListener('click', () => switchView('calendar'));
    listViewBtn.addEventListener('click', () => switchView('list'));
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));
    filterType.addEventListener('change', handleFilterTypeChange);
    filterValue.addEventListener('change', handleFilterValueChange);
    clearFilterBtn.addEventListener('click', clearFilter);
    searchInput.addEventListener('input', handleSearch);
    getLocationBtn.addEventListener('click', getCurrentLocation);
    sortBtn.addEventListener('click', toggleSort);
    
    // Update reminder time display when date/time/reminder changes
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentTime = document.getElementById('appointmentTime');
    const reminderTime = document.getElementById('reminderTime');
    if (appointmentDate) appointmentDate.addEventListener('change', updateReminderTimeDisplay);
    if (appointmentTime) appointmentTime.addEventListener('change', updateReminderTimeDisplay);
    if (reminderTime) reminderTime.addEventListener('change', updateReminderTimeDisplay);
    
    // Close modals when clicking outside
    appointmentModal.addEventListener('click', (e) => {
        if (e.target === appointmentModal) closeModalFunc();
    });
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeDetailModalFunc();
    });
}

// Load/Save Appointments
function loadAppointments() {
    const stored = localStorage.getItem('petVaccineAppointments');
    if (stored) {
        appointments = JSON.parse(stored).map(apt => ({
            ...apt,
            date: new Date(apt.date)
        }));
    }
}

function saveAppointments() {
    localStorage.setItem('petVaccineAppointments', JSON.stringify(appointments));
    updateStats();
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        renderList();
    }
}

// Calendar Functions
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthEl.textContent = new Date(year, month).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    calendarGrid.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthLastDay - i;
        calendarGrid.appendChild(day);
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        const date = new Date(year, month, i);
        day.className = 'calendar-day';
        
        if (date.toDateString() === today.toDateString()) {
            day.classList.add('today');
        }
        
        const dayAppointments = getAppointmentsForDate(date);
        if (dayAppointments.length > 0) {
            day.classList.add('has-appointment');
        }
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = i;
        day.appendChild(dayNumber);
        
        if (dayAppointments.length > 0) {
            const count = document.createElement('div');
            count.className = 'calendar-day-appointments';
            count.textContent = `${dayAppointments.length} appointment${dayAppointments.length > 1 ? 's' : ''}`;
            day.appendChild(count);
        }
        
        day.addEventListener('click', () => {
            if (dayAppointments.length > 0) {
                showAppointmentsForDate(date);
            } else {
                openModal(date);
            }
        });
        
        calendarGrid.appendChild(day);
    }
    
    // Next month days
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    const nextMonthStart = 1;
    for (let i = 0; i < remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = nextMonthStart + i;
        calendarGrid.appendChild(day);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function getAppointmentsForDate(date) {
    return appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.toDateString() === date.toDateString();
    });
}

function showAppointmentsForDate(date) {
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length === 1) {
        showAppointmentDetail(dayAppointments[0].id);
    } else {
        // Show list of appointments for that day
        switchView('list');
        // Filter to show only that day
        const originalFilter = { ...currentFilter };
        currentFilter = { type: 'date', value: date.toISOString() };
        renderList();
        // Could add a way to clear this filter
    }
}

// List View Functions
function renderList() {
    let filtered = [...appointments];
    
    // Apply filters
    if (currentFilter.type === 'pet') {
        filtered = filtered.filter(apt => apt.petType === currentFilter.value);
    } else if (currentFilter.type === 'vaccine') {
        filtered = filtered.filter(apt => apt.vaccineType === currentFilter.value);
    }
    
    // Apply search
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(apt => 
            apt.petName.toLowerCase().includes(searchTerm) ||
            (apt.ownerName && apt.ownerName.toLowerCase().includes(searchTerm)) ||
            apt.location.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort
    filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA < dateB) return sortOrder === 'asc' ? -1 : 1;
        if (dateA > dateB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    
    appointmentsList.innerHTML = '';
    
    if (filtered.length === 0) {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-text">No appointments found</div>
            </div>
        `;
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filtered.forEach(apt => {
        const card = document.createElement('div');
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        
        card.className = 'appointment-card';
        if (aptDate.getTime() === today.getTime()) {
            card.classList.add('today');
        } else if (aptDate < today) {
            card.classList.add('urgent');
        }
        
        const dateStr = aptDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = new Date(apt.date).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        card.innerHTML = `
            <div class="appointment-card-header">
                <div>
                    <div class="appointment-pet">${getPetEmoji(apt.petType)} ${apt.petName}</div>
                    <div class="appointment-date">${dateStr}</div>
                </div>
                <div class="appointment-time">${timeStr}</div>
            </div>
            <div class="appointment-details-row">
                <div class="appointment-detail-item">
                    <span>💉</span>
                    <span>${apt.vaccineType}</span>
                </div>
                <div class="appointment-detail-item">
                    <span>📍</span>
                    <span>${apt.location}</span>
                </div>
                ${apt.ownerName ? `
                <div class="appointment-detail-item">
                    <span>👤</span>
                    <span>${apt.ownerName}</span>
                </div>
                ` : ''}
            </div>
            ${apt.ownerPhone ? `
            <div class="appointment-card-actions">
                <a href="tel:${apt.ownerPhone}" class="btn-call-small" onclick="event.stopPropagation();">
                    📞 Call ${apt.ownerName || 'Owner'}
                </a>
            </div>
            ` : ''}
        `;
        
        card.addEventListener('click', () => showAppointmentDetail(apt.id));
        appointmentsList.appendChild(card);
    });
}

function toggleSort() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortBtn.textContent = `Sort: Date ${sortOrder === 'asc' ? '↑' : '↓'}`;
    renderList();
}

function switchView(view) {
    currentView = view;
    if (view === 'calendar') {
        calendarView.style.display = 'block';
        listView.style.display = 'none';
        calendarViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderCalendar();
    } else {
        calendarView.style.display = 'none';
        listView.style.display = 'block';
        calendarViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
        renderList();
    }
}

// Modal Functions
function openModal(date = null) {
    document.getElementById('modalTitle').textContent = 'Add New Appointment';
    appointmentForm.reset();
    document.getElementById('appointmentId').value = '';
    
    if (date) {
        const dateStr = date.toISOString().split('T')[0];
        document.getElementById('appointmentDate').value = dateStr;
    } else {
        document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
    }
    
    appointmentModal.classList.add('active');
}

function closeModalFunc() {
    appointmentModal.classList.remove('active');
    appointmentForm.reset();
}

function saveAppointment(e) {
    e.preventDefault();
    
    const id = document.getElementById('appointmentId').value;
    const appointment = {
        id: id || Date.now().toString(),
        petName: document.getElementById('petName').value,
        petType: document.getElementById('petType').value,
        vaccineType: document.getElementById('vaccineType').value,
        date: new Date(document.getElementById('appointmentDate').value + 'T' + document.getElementById('appointmentTime').value),
        ownerName: document.getElementById('ownerName').value,
        ownerPhone: document.getElementById('ownerPhone').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value,
        reminderTime: parseInt(document.getElementById('reminderTime').value),
        createdAt: id ? appointments.find(a => a.id === id)?.createdAt || new Date() : new Date()
    };
    
    if (id) {
        const index = appointments.findIndex(a => a.id === id);
        appointments[index] = appointment;
    } else {
        appointments.push(appointment);
    }
    
    saveAppointments();
    closeModalFunc();
    
    // Schedule reminders if set (both pre-reminder and at-appointment-time)
    if (appointment.reminderTime && appointment.reminderTime !== 0) {
        scheduleReminder(appointment);
    }
    
    // Schedule all reminders for background processing
    scheduleAllReminders();
}

function showAppointmentDetail(id) {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;
    
    const details = document.getElementById('appointmentDetails');
    const date = new Date(appointment.date);
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    details.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Pet</div>
            <div class="detail-value">${getPetEmoji(appointment.petType)} ${appointment.petName}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Pet Type</div>
            <div class="detail-value">${appointment.petType}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Vaccine Type</div>
            <div class="detail-value">${appointment.vaccineType}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Date & Time</div>
            <div class="detail-value">${dateStr} at ${timeStr}</div>
        </div>
        ${appointment.ownerName ? `
        <div class="detail-item">
            <div class="detail-label">Owner</div>
            <div class="detail-value">${appointment.ownerName}</div>
        </div>
        ` : ''}
        ${appointment.ownerPhone ? `
        <div class="detail-item">
            <div class="detail-label">Phone</div>
            <div class="detail-value">${appointment.ownerPhone}</div>
        </div>
        ` : ''}
        <div class="detail-item">
            <div class="detail-label">Location</div>
            <div class="detail-value">📍 ${appointment.location}</div>
        </div>
        ${appointment.notes ? `
        <div class="detail-item">
            <div class="detail-label">Notes</div>
            <div class="detail-value">${appointment.notes}</div>
        </div>
        ` : ''}
    `;
    
    // Setup action buttons
    const detailActions = document.querySelector('.detail-actions');
    detailActions.innerHTML = ''; // Clear existing buttons
    
    // Add Call button if phone number exists
    if (appointment.ownerPhone) {
        const callBtn = document.createElement('button');
        callBtn.className = 'btn-call';
        callBtn.innerHTML = '📞 Call Owner';
        callBtn.onclick = () => {
            window.location.href = `tel:${appointment.ownerPhone}`;
        };
        detailActions.appendChild(callBtn);
    }
    
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => {
        editAppointment(id);
    };
    detailActions.appendChild(editBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this appointment?')) {
            deleteAppointment(id);
        }
    };
    detailActions.appendChild(deleteBtn);
    
    detailModal.classList.add('active');
}

function closeDetailModalFunc() {
    detailModal.classList.remove('active');
}

function editAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;
    
    closeDetailModalFunc();
    
    document.getElementById('modalTitle').textContent = 'Edit Appointment';
    document.getElementById('appointmentId').value = appointment.id;
    document.getElementById('petName').value = appointment.petName;
    document.getElementById('petType').value = appointment.petType;
    document.getElementById('vaccineType').value = appointment.vaccineType;
    
    const date = new Date(appointment.date);
    document.getElementById('appointmentDate').value = date.toISOString().split('T')[0];
    document.getElementById('appointmentTime').value = date.toTimeString().slice(0, 5);
    
    document.getElementById('ownerName').value = appointment.ownerName || '';
    document.getElementById('ownerPhone').value = appointment.ownerPhone || '';
    document.getElementById('location').value = appointment.location;
    document.getElementById('notes').value = appointment.notes || '';
    document.getElementById('reminderTime').value = appointment.reminderTime || 'none';
    
    appointmentModal.classList.add('active');
}

function deleteAppointment(id) {
    appointments = appointments.filter(a => a.id !== id);
    saveAppointments();
    closeDetailModalFunc();
}

// Filter Functions
function handleFilterTypeChange() {
    const type = filterType.value;
    currentFilter.type = type;
    
    if (type === 'all') {
        filterValueGroup.style.display = 'none';
        clearFilterBtn.style.display = 'none';
        currentFilter.value = '';
    } else {
        filterValueGroup.style.display = 'flex';
        clearFilterBtn.style.display = 'block';
        populateFilterValues(type);
    }
    
    if (currentView === 'list') renderList();
    else renderCalendar();
}

function populateFilterValues(type) {
    filterValue.innerHTML = '<option value="">Choose...</option>';
    
    if (type === 'pet') {
        const petTypes = [...new Set(appointments.map(a => a.petType))];
        petTypes.forEach(pet => {
            const option = document.createElement('option');
            option.value = pet;
            option.textContent = `${getPetEmoji(pet)} ${pet}`;
            filterValue.appendChild(option);
        });
    } else if (type === 'vaccine') {
        const vaccines = [...new Set(appointments.map(a => a.vaccineType))];
        vaccines.forEach(vaccine => {
            const option = document.createElement('option');
            option.value = vaccine;
            option.textContent = vaccine;
            filterValue.appendChild(option);
        });
    }
}

function handleFilterValueChange() {
    currentFilter.value = filterValue.value;
    if (currentView === 'list') renderList();
    else renderCalendar();
}

function clearFilter() {
    filterType.value = 'all';
    currentFilter = { type: 'all', value: '' };
    filterValueGroup.style.display = 'none';
    clearFilterBtn.style.display = 'none';
    if (currentView === 'list') renderList();
    else renderCalendar();
}

function handleSearch() {
    if (currentView === 'list') {
        renderList();
    }
}

// Location Functions
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    getLocationBtn.textContent = '📍 Getting location...';
    getLocationBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Use reverse geocoding (simplified - in production, use a geocoding API)
            document.getElementById('location').value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            getLocationBtn.textContent = '📍 Use Current Location';
            getLocationBtn.disabled = false;
        },
        (error) => {
            alert('Unable to get your location. Please enter it manually.');
            getLocationBtn.textContent = '📍 Use Current Location';
            getLocationBtn.disabled = false;
        }
    );
}

// Stats Functions
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    const todayCount = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
    }).length;
    
    const weekCount = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && aptDate < weekEnd;
    }).length;
    
    const monthCount = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && aptDate < monthEnd;
    }).length;
    
    document.getElementById('todayCount').textContent = todayCount;
    document.getElementById('weekCount').textContent = weekCount;
    document.getElementById('monthCount').textContent = monthCount;
}

// Reminder Functions
// IMPORTANT: On iPhone/Safari, the notification prompt ONLY appears when triggered by a user TAP.
// So we show a banner with "Enable" button - when user taps it, the prompt appears.

function setupNotificationBanner() {
    const banner = document.getElementById('notificationBanner');
    const btn = document.getElementById('enableNotificationsBtn');
    if (!banner || !btn) return;

    function updateBannerVisibility() {
        if (!('Notification' in window)) {
            banner.style.display = 'none';
            return;
        }
        if (Notification.permission === 'default') {
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }

    updateBannerVisibility();

    btn.addEventListener('click', function() {
        requestNotificationPermission();
        updateBannerVisibility();
        showTestNotificationRowIfGranted();
    });

    showTestNotificationRowIfGranted();
}

function showTestNotificationRowIfGranted() {
    const row = document.getElementById('testNotificationRow');
    if (!row) return;
    if ('Notification' in window && Notification.permission === 'granted') {
        row.style.display = 'flex';
    } else {
        row.style.display = 'none';
    }
}

function setupTestNotificationButton() {
    const btn = document.getElementById('testNotificationBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        testReminderNotification();
    });
}

function testReminderNotification() {
    playReminderSound();
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🔔 Vaccine Reminder (Test)', {
            body: 'Test reminder – Max (Dog)\nRabies at 2:00 PM\n📍 123 Main St',
            icon: './icon-192.png',
            tag: 'test-reminder',
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200]
        });
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
    const badge = document.createElement('div');
    badge.className = 'notification-badge';
    badge.innerHTML = '<strong>🔔 Test reminder</strong><br>You should hear a sound and see a notification.';
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 5000);
}

// Update reminder time display in form
function updateReminderTimeDisplay() {
    const dateInput = document.getElementById('appointmentDate');
    const timeInput = document.getElementById('appointmentTime');
    const reminderSelect = document.getElementById('reminderTime');
    const displayDiv = document.getElementById('reminderTimeDisplay');
    const displayText = document.getElementById('reminderTimeText');
    
    if (!dateInput || !timeInput || !reminderSelect || !displayDiv || !displayText) return;
    
    const reminderValue = reminderSelect.value;
    if (reminderValue === 'none' || reminderValue === '0') {
        displayDiv.style.display = 'none';
        return;
    }
    
    const date = dateInput.value;
    const time = timeInput.value;
    
    if (!date || !time) {
        displayDiv.style.display = 'none';
        return;
    }
    
    try {
        const appointmentDateTime = new Date(date + 'T' + time);
        const reminderMinutes = parseInt(reminderValue);
        const reminderDateTime = new Date(appointmentDateTime.getTime() - (reminderMinutes * 60 * 1000));
        
        const reminderTimeStr = reminderDateTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        const appointmentTimeStr = appointmentDateTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        displayText.textContent = `${reminderTimeStr} (appointment at ${appointmentTimeStr})`;
        displayDiv.style.display = 'block';
    } catch (e) {
        displayDiv.style.display = 'none';
    }
}

function playReminderSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Sound not supported', e);
    }
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                    registerPeriodicSync();
                    const banner = document.getElementById('notificationBanner');
                    if (banner) banner.style.display = 'none';
                    showTestNotificationRowIfGranted();
                }
            });
        } else if (Notification.permission === 'granted') {
            registerPeriodicSync();
        }
    }
}

// Register periodic background sync so reminders fire when app is CLOSED (Chrome/PWA)
async function registerPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.periodicSync) {
            await reg.periodicSync.register('vaccine-reminders', {
                minInterval: 60 * 60 * 1000 // 1 hour (Chrome may enforce minimum)
            });
            console.log('Background reminders registered (app can notify when closed)');
        }
    } catch (e) {
        console.log('Periodic sync not available:', e.message);
    }
}

// Schedule reminder with proper timing
function scheduleReminder(appointment) {
    if (!appointment.reminderTime || appointment.reminderTime === 0) return;
    
    const aptDate = new Date(appointment.date);
    const now = new Date().getTime();
    
    // Schedule reminder BEFORE appointment (e.g., 15 min before)
    const preReminderTime = aptDate.getTime() - (appointment.reminderTime * 60 * 1000);
    if (preReminderTime > now) {
        storeReminderForBackground(appointment, preReminderTime, 'pre');
        const delay = preReminderTime - now;
        setTimeout(() => {
            showReminder(appointment, 'pre');
        }, delay);
    }
    
    // ALSO schedule reminder AT appointment time (e.g., exactly at 2pm)
    const appointmentTime = aptDate.getTime();
    if (appointmentTime > now) {
        storeReminderForBackground(appointment, appointmentTime, 'at');
        const delay = appointmentTime - now;
        setTimeout(() => {
            showReminder(appointment, 'at');
        }, delay);
    }
    
    // Tell service worker to check reminders now (helps when tab is in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_REMINDERS_NOW' });
    }
}

// Store reminder in IndexedDB for background access
function storeReminderForBackground(appointment, reminderTime, type = 'pre') {
    const reminderId = `${appointment.id}_${type}`;
    if (!('indexedDB' in window)) {
        // Fallback to localStorage
        const reminderData = {
            id: reminderId,
            appointment: appointment,
            reminderTime: reminderTime,
            type: type
        };
        localStorage.setItem(`bg_reminder_${reminderId}`, JSON.stringify(reminderData));
        return;
    }
    
    const request = indexedDB.open('VaccineCalendarDB', 1);
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reminders')) {
            db.createObjectStore('reminders', { keyPath: 'id' });
        }
    };
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['reminders'], 'readwrite');
        const store = transaction.objectStore('reminders');
        
        const reminderData = {
            id: reminderId,
            appointment: appointment,
            reminderTime: reminderTime,
            type: type
        };
        
        store.put(reminderData);
    };
}

// Check reminders (runs when app is open)
function checkReminders() {
    const now = new Date().getTime();
    
    appointments.forEach(apt => {
        if (!apt.reminderTime || apt.reminderTime === 0) return;
        
        const aptDate = new Date(apt.date);
        const aptTime = aptDate.getTime();
        
        // Check PRE-reminder (e.g., 15 min before)
        const preReminderTime = aptTime - (apt.reminderTime * 60 * 1000);
        if (now >= preReminderTime && aptTime > now) {
            const reminderKey = `reminder_${apt.id}_pre`;
            if (!localStorage.getItem(reminderKey)) {
                showReminder(apt, 'pre');
                localStorage.setItem(reminderKey, 'shown');
            }
        }
        
        // Check AT appointment time reminder (e.g., exactly at 2pm)
        if (now >= aptTime && aptTime > (now - 60000)) { // Within 1 minute of appointment time
            const reminderKey = `reminder_${apt.id}_at`;
            if (!localStorage.getItem(reminderKey)) {
                showReminder(apt, 'at');
                localStorage.setItem(reminderKey, 'shown');
            }
        }
    });
    
    // Also check IndexedDB for scheduled reminders
    checkScheduledReminders();
}

// Check reminders from IndexedDB
function checkScheduledReminders() {
    if (!('indexedDB' in window)) return;
    
    const request = indexedDB.open('VaccineCalendarDB', 1);
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('reminders')) return;
        
        const transaction = db.transaction(['reminders'], 'readonly');
        const store = transaction.objectStore('reminders');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
            const reminders = getAllRequest.result;
            const now = new Date().getTime();
            
            reminders.forEach(reminder => {
                if (now >= reminder.reminderTime) {
                    const reminderKey = `reminder_${reminder.appointment.id}_${reminder.type || 'pre'}`;
                    if (!localStorage.getItem(reminderKey)) {
                        showReminder(reminder.appointment, reminder.type || 'pre');
                        localStorage.setItem(reminderKey, 'shown');
                        
                        // Remove from IndexedDB
                        const deleteTransaction = db.transaction(['reminders'], 'readwrite');
                        deleteTransaction.objectStore('reminders').delete(reminder.id);
                    }
                }
            });
        };
    };
}

function showReminder(appointment, type = 'pre') {
    const date = new Date(appointment.date);
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Play sound so user hears the reminder
    playReminderSound();

    // Different messages for pre-reminder vs at-appointment-time
    const isAtTime = type === 'at';
    const title = isAtTime ? '🔔 Appointment Time!' : '🔔 Vaccine Reminder';
    const bodyText = isAtTime 
        ? `${appointment.petName} (${appointment.petType})\n${appointment.vaccineType} appointment is NOW at ${timeStr}\n📍 ${appointment.location}`
        : `${appointment.petName} (${appointment.petType})\n${appointment.vaccineType} at ${timeStr}\n📍 ${appointment.location}`;

    // Browser notification (works even when app is closed if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: bodyText,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag: `reminder-${appointment.id}-${type}`,
            requireInteraction: true,
            silent: false,
            vibrate: [200, 100, 200],
            data: {
                appointmentId: appointment.id
            }
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
    
    // In-app notification (only if app is open)
    if (document.body) {
        const badge = document.createElement('div');
        badge.className = 'notification-badge';
        badge.innerHTML = `
            <strong>${isAtTime ? '🔔 Appointment Time!' : '🔔 Reminder'}</strong><br>
            ${appointment.petName} - ${appointment.vaccineType}<br>
            ${timeStr} at ${appointment.location}
        `;
        document.body.appendChild(badge);
        
        setTimeout(() => {
            badge.remove();
        }, 5000);
    }
}

// Listen for service worker messages
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'GET_APPOINTMENTS_FOR_BACKGROUND') {
            // Send appointments to service worker
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'APPOINTMENTS_DATA',
                    appointments: appointments
                });
            }
        }
    });
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_REMINDER') {
            const appointment = appointments.find(a => a.id === event.data.appointmentId);
            if (appointment) {
                showReminder(appointment);
            }
        }
    });
}

// Periodic check for reminders (runs in background when possible)
setInterval(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_REMINDERS'
        });
    }
    checkReminders();
}, 60000); // Check every minute

// Schedule all reminders for background
function scheduleAllReminders() {
    appointments.forEach(apt => {
        if (apt.reminderTime && apt.reminderTime !== 0) {
            scheduleReminder(apt);
        }
    });
    
    // Send to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_REMINDERS',
            appointments: appointments.filter(apt => apt.reminderTime && apt.reminderTime !== 0)
        });
    }
}

// Helper Functions
function getPetEmoji(petType) {
    const emojis = {
        'Dog': '🐕',
        'Cat': '🐈',
        'Rabbit': '🐰',
        'Bird': '🐦',
        'Other': '🐾'
    };
    return emojis[petType] || '🐾';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

