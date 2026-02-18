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
    loadAppointments();
    setupEventListeners();
    renderCalendar();
    updateStats();
    checkReminders();
    requestNotificationPermission();
    registerServiceWorker();
    
    // Check for reminders every minute
    setInterval(checkReminders, 60000);
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
    
    // Schedule reminder if set
    if (appointment.reminderTime && appointment.reminderTime !== 0) {
        scheduleReminder(appointment);
    }
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
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function scheduleReminder(appointment) {
    // Reminders are checked periodically in checkReminders()
    // This function could be extended to use service workers for background notifications
}

function checkReminders() {
    const now = new Date();
    
    appointments.forEach(apt => {
        if (!apt.reminderTime || apt.reminderTime === 0) return;
        
        const aptDate = new Date(apt.date);
        const reminderTime = aptDate.getTime() - (apt.reminderTime * 60 * 1000);
        
        // Check if reminder time has passed but appointment hasn't
        if (now.getTime() >= reminderTime && aptDate.getTime() > now.getTime()) {
            // Check if we've already shown this reminder
            const reminderKey = `reminder_${apt.id}`;
            if (!localStorage.getItem(reminderKey)) {
                showReminder(apt);
                localStorage.setItem(reminderKey, 'shown');
            }
        }
    });
}

function showReminder(appointment) {
    const date = new Date(appointment.date);
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Vaccine Reminder', {
            body: `${appointment.petName} (${appointment.petType}) - ${appointment.vaccineType} at ${timeStr}\nLocation: ${appointment.location}`,
            icon: 'icon-192.png',
            tag: appointment.id
        });
    }
    
    // In-app notification
    const badge = document.createElement('div');
    badge.className = 'notification-badge';
    badge.innerHTML = `
        <strong>🔔 Reminder</strong><br>
        ${appointment.petName} - ${appointment.vaccineType}<br>
        ${timeStr} at ${appointment.location}
    `;
    document.body.appendChild(badge);
    
    setTimeout(() => {
        badge.remove();
    }, 5000);
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

