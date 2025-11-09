// Services data with codes and names
const services = {
    'P': { name: 'Pedicure', duration: 60 },
    'M': { name: 'Manicure', duration: 30 },
    'G': { name: 'Gel Manicure', duration: 60 },
    'PG': { name: 'Pedicure Gel', duration: 60 },
    'F': { name: 'Fill', duration: 30 },
    'D': { name: 'Dip', duration: 60 },
    'DM': { name: 'Deluxe Manicure', duration: 30 },
    'LM': { name: 'Luxury Manicure', duration: 60 },
    'JM': { name: 'Jelly Manicure', duration: 60 },
    'FS': { name: 'Full Set', duration: 30 }
};

// Workers data - mapping names to their available services
const workers = {
    'Amanda': ['P', 'M', 'G', 'PG'],
    'Ana': ['P', 'M'],
    'Annie': ['P'],
    'Heidi': ['P', 'M', 'G', 'PG'],
    'Helen': ['P', 'M'],
    'Jasmine': ['P', 'M', 'G', 'D', 'PG'],
    'Kathy': ['P'],
    'Lan': ['P', 'PG', 'M'],
    'Lucy': ['P', 'M', 'G', 'PG'],
    'Mimi': ['P', 'M', 'G', 'PG'],
    'Sally': ['P', 'M', 'G', 'PG'],
    'May': ['P', 'M', 'G', 'D', 'F', 'FS', 'PG'],
    'Joy': ['M', 'G', 'D', 'F', 'FS'],
    'Kathlyn': ['M', 'G', 'D', 'F', 'FS'],
    'Lily': ['M', 'G', 'D', 'F', 'FS', 'P', 'PG'],
    'Angela': ['M', 'G', 'D', 'F', 'FS'],
    'Natalie': ['M', 'G', 'D', 'F', 'FS'],
    'Lynn': ['M', 'G', 'P', 'PG']
};

// Application state
let highlightedWorkers = new Set();
let scheduleData = {}; // Store time in and service assignments
let selectedService = '';
let currentDate = new Date();

// Initialize the application
function init() {
    setupServiceDropdown();
    updateDateDisplay();
    loadScheduleFromStorage();
    renderSchedule();
    renderServiceLegend();
    setupEventListeners();
}

// Setup service dropdown
function setupServiceDropdown() {
    const serviceSelect = document.getElementById('serviceSelect');
    
    // Add all services to dropdown
    Object.entries(services).forEach(([code, service]) => {
        const option = document.createElement('option');
        const weight = service.duration === 30 ? '1/2' : '1';
        option.value = code;
        option.textContent = `${code} - ${service.name} (${weight})`;
        serviceSelect.appendChild(option);
    });
    
    // Set default selection if any
    if (selectedService) {
        serviceSelect.value = selectedService;
    }
}

// Update date display
function updateDateDisplay() {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = days[currentDate.getDay()];
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    document.getElementById('dateDisplay').textContent = `${dayName} ${month}/${day}`;
}

// Render schedule table
function renderSchedule() {
    const tbody = document.getElementById('scheduleBody');
    tbody.innerHTML = '';

    // Create 30 blank rows
    for (let rowNumber = 1; rowNumber <= 30; rowNumber++) {
        const row = document.createElement('tr');
        
        // Get stored data for this row
        const rowKey = `row${rowNumber}`;
        const storedData = scheduleData[rowKey] || {};
        
        // Row number
        const numCell = document.createElement('td');
        numCell.className = 'col-number';
        numCell.textContent = rowNumber;
        row.appendChild(numCell);
        
        // Name cell (editable)
        const nameCell = document.createElement('td');
        nameCell.className = 'col-name';
        const nameValue = storedData.name || '';
        if (nameValue && highlightedWorkers.has(nameValue)) {
            nameCell.classList.add('highlighted');
        }
        nameCell.textContent = nameValue;
        
        // Add tooltip with service codes the worker can perform
        if (nameValue && workers[nameValue]) {
            const serviceCodes = workers[nameValue].join(', ');
            nameCell.title = serviceCodes;
        }
        
        nameCell.contentEditable = true;
        nameCell.addEventListener('blur', (e) => {
            const name = e.target.textContent.trim();
            saveRowName(rowNumber, name);
            // Update highlight if name matches highlighted workers
            if (name && highlightedWorkers.has(name)) {
                e.target.classList.add('highlighted');
            } else {
                e.target.classList.remove('highlighted');
            }
            // Update tooltip
            if (name && workers[name]) {
                const serviceCodes = workers[name].join(', ');
                e.target.title = serviceCodes;
            } else {
                e.target.title = '';
            }
        });
        nameCell.addEventListener('click', () => {
            const name = nameCell.textContent.trim();
            if (name) {
                toggleHighlight(name);
            }
        });
        nameCell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.target.blur();
            }
        });
        row.appendChild(nameCell);
        
        // Time In cell
        const timeCell = document.createElement('td');
        timeCell.className = 'col-time';
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.value = storedData.timeIn || '';
        timeInput.addEventListener('change', () => {
            saveTimeIn(rowNumber, timeInput.value);
        });
        timeCell.appendChild(timeInput);
        row.appendChild(timeCell);
        
        // Service columns (1-15)
        for (let i = 1; i <= 15; i++) {
            const serviceCell = document.createElement('td');
            serviceCell.className = 'col-service';
            serviceCell.style.position = 'relative';
            serviceCell.style.padding = '0';
            serviceCell.style.overflow = 'hidden';
            
            // Get service codes for this column from stored data
            const serviceCodeTop = storedData[`service${i}_top`] || '';
            const serviceCodeBottom = storedData[`service${i}_bottom`] || '';
            const fullService = storedData[`service${i}_full`] || '';
            
            // Create diagonal line (only visible when there's a half-weight service)
            const diagonalLine = document.createElement('div');
            diagonalLine.className = 'service-diagonal-line';
            // Only show diagonal if there's a half-weight service (top or bottom)
            if (serviceCodeTop || serviceCodeBottom) {
                diagonalLine.style.display = 'block';
            } else {
                diagonalLine.style.display = 'none';
            }
            serviceCell.appendChild(diagonalLine);
            
            // Create top triangle (upper left) - for 1/2 weight services
            const topHalf = document.createElement('div');
            topHalf.className = 'service-cell-top';
            if (fullService) {
                // Full service exists - hide top triangle
                topHalf.style.display = 'none';
            } else {
                topHalf.textContent = serviceCodeTop;
                if (serviceCodeTop) {
                    topHalf.style.fontWeight = 'bold';
                    topHalf.style.color = '#667eea';
                }
            }
            topHalf.contentEditable = true;
            topHalf.addEventListener('blur', (e) => {
                const code = e.target.textContent.trim().toUpperCase();
                e.target.textContent = code; // Update display immediately with capitalized version
                handleServiceInput(rowNumber, i, code, 'top');
                renderSchedule(); // Re-render to update display
            });
            topHalf.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
            
            // Create bottom triangle (lower right) - for 1/2 weight services
            const bottomHalf = document.createElement('div');
            bottomHalf.className = 'service-cell-bottom';
            if (fullService) {
                // Full service exists - hide bottom triangle
                bottomHalf.style.display = 'none';
            } else {
                bottomHalf.textContent = serviceCodeBottom;
                if (serviceCodeBottom) {
                    bottomHalf.style.fontWeight = 'bold';
                    bottomHalf.style.color = '#667eea';
                }
            }
            bottomHalf.contentEditable = true;
            bottomHalf.addEventListener('blur', (e) => {
                const code = e.target.textContent.trim().toUpperCase();
                e.target.textContent = code; // Update display immediately with capitalized version
                handleServiceInput(rowNumber, i, code, 'bottom');
                renderSchedule(); // Re-render to update display
            });
            bottomHalf.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
            
            // Create centered full service display (for weight 1 services - 60 minutes)
            const fullServiceDisplay = document.createElement('div');
            fullServiceDisplay.className = 'service-cell-full';
            if (fullService) {
                fullServiceDisplay.textContent = fullService;
                fullServiceDisplay.style.fontWeight = 'bold';
                fullServiceDisplay.style.color = '#667eea';
                fullServiceDisplay.contentEditable = true;
                fullServiceDisplay.addEventListener('blur', (e) => {
                    const code = e.target.textContent.trim().toUpperCase();
                    e.target.textContent = code; // Update display immediately with capitalized version
                    handleServiceInput(rowNumber, i, code, 'full');
                    renderSchedule(); // Re-render to update display
                });
                fullServiceDisplay.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                    }
                });
            } else {
                fullServiceDisplay.style.display = 'none';
            }
            
            serviceCell.appendChild(topHalf);
            serviceCell.appendChild(bottomHalf);
            serviceCell.appendChild(fullServiceDisplay);
            row.appendChild(serviceCell);
        }
        
        tbody.appendChild(row);
    }
}

// Render service legend
function renderServiceLegend() {
    const legend = document.getElementById('serviceLegend');
    legend.innerHTML = '';

    Object.entries(services).forEach(([code, service]) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-code">${code}</span>
            <span class="legend-name">${service.name}</span>
        `;
        legend.appendChild(legendItem);
    });
}

// Toggle worker highlight
function toggleHighlight(workerName) {
    if (highlightedWorkers.has(workerName)) {
        highlightedWorkers.delete(workerName);
    } else {
        highlightedWorkers.add(workerName);
    }
    saveHighlightsToStorage();
    renderSchedule();
}

// Save row name
function saveRowName(rowNumber, name) {
    const rowKey = `row${rowNumber}`;
    if (!scheduleData[rowKey]) {
        scheduleData[rowKey] = {};
    }
    scheduleData[rowKey].name = name;
    saveScheduleToStorage();
}

// Save time in
function saveTimeIn(rowNumber, timeIn) {
    const rowKey = `row${rowNumber}`;
    if (!scheduleData[rowKey]) {
        scheduleData[rowKey] = {};
    }
    scheduleData[rowKey].timeIn = timeIn;
    saveScheduleToStorage();
}

// Handle service input - determines if it's full or half weight
function handleServiceInput(rowNumber, columnNumber, serviceCode, half) {
    const rowKey = `row${rowNumber}`;
    if (!scheduleData[rowKey]) {
        scheduleData[rowKey] = {};
    }
    
    if (!serviceCode) {
        // Empty - clear only the specified half
        if (half === 'top') {
            scheduleData[rowKey][`service${columnNumber}_top`] = '';
        } else if (half === 'bottom') {
            scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
        } else if (half === 'full') {
            scheduleData[rowKey][`service${columnNumber}_full`] = '';
        }
        saveScheduleToStorage();
        return;
    }
    
    // Check if service exists and get its duration
    if (services[serviceCode]) {
        const duration = services[serviceCode].duration;
        
        if (duration === 60) {
            // Full weight service (1) - store as full, centered
            // Clear both halves and full service
            scheduleData[rowKey][`service${columnNumber}_top`] = '';
            scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
            scheduleData[rowKey][`service${columnNumber}_full`] = serviceCode;
        } else if (duration === 30) {
            // Half weight service (1/2) - store in the specified half
            // Clear full service if it exists, but keep the other half
            scheduleData[rowKey][`service${columnNumber}_full`] = '';
            
            if (half === 'top') {
                scheduleData[rowKey][`service${columnNumber}_top`] = serviceCode;
                // Don't clear bottom - allow both halves to have services
            } else if (half === 'bottom') {
                scheduleData[rowKey][`service${columnNumber}_bottom`] = serviceCode;
                // Don't clear top - allow both halves to have services
            } else if (half === 'full') {
                // If editing a full service and changing to half, put in top
                scheduleData[rowKey][`service${columnNumber}_top`] = serviceCode;
                scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
            }
        }
    }
    
    saveScheduleToStorage();
}

// Save service assignment (legacy function, redirects to handleServiceInput)
function saveServiceAssignment(rowNumber, columnNumber, serviceCode, half = 'top') {
    handleServiceInput(rowNumber, columnNumber, serviceCode, half);
}

// Save highlights to localStorage
function saveHighlightsToStorage() {
    localStorage.setItem('myTurnHighlights', JSON.stringify(Array.from(highlightedWorkers)));
}

// Get date key for storage
function getDateKey() {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Save schedule to localStorage
function saveScheduleToStorage() {
    const dateKey = getDateKey();
    const allScheduleData = JSON.parse(localStorage.getItem('myTurnAllSchedules') || '{}');
    allScheduleData[dateKey] = scheduleData;
    localStorage.setItem('myTurnAllSchedules', JSON.stringify(allScheduleData));
    localStorage.setItem('myTurnCurrentDate', dateKey);
    saveHighlightsToStorage();
}

// Load schedule from localStorage for current date
function loadScheduleForDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    const allScheduleData = JSON.parse(localStorage.getItem('myTurnAllSchedules') || '{}');
    return allScheduleData[dateKey] || {};
}

// Check if schedule data exists for a date
function hasScheduleDataForDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    const allScheduleData = JSON.parse(localStorage.getItem('myTurnAllSchedules') || '{}');
    const data = allScheduleData[dateKey];
    return data && Object.keys(data).length > 0;
}

// Save selected service to localStorage
function saveSelectedServiceToStorage() {
    localStorage.setItem('myTurnSelectedService', selectedService);
}

// Load schedule from localStorage
function loadScheduleFromStorage() {
    // Load schedule data for current date
    scheduleData = loadScheduleForDate(currentDate);
    
    const savedHighlights = localStorage.getItem('myTurnHighlights');
    const savedService = localStorage.getItem('myTurnSelectedService');
    
    if (savedService) {
        selectedService = savedService;
        document.getElementById('serviceSelect').value = selectedService;
        highlightWorkersForService(selectedService);
    } else if (savedHighlights) {
        // Only load saved highlights if no service is selected
        highlightedWorkers = new Set(JSON.parse(savedHighlights));
    }
    
    // Update navigation buttons state
    updateNavigationButtons();
}

// Navigate to previous day
function navigateToPreviousDay() {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    if (hasScheduleDataForDate(prevDate)) {
        currentDate = prevDate;
        updateDateDisplay();
        scheduleData = loadScheduleForDate(currentDate);
        renderSchedule();
        updateNavigationButtons();
    }
}

// Navigate to next day
function navigateToNextDay() {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    if (hasScheduleDataForDate(nextDate)) {
        currentDate = nextDate;
        updateDateDisplay();
        scheduleData = loadScheduleForDate(currentDate);
        renderSchedule();
        updateNavigationButtons();
    }
}

// Update navigation buttons state
function updateNavigationButtons() {
    // Update previous day button
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    const prevDayBtn = document.getElementById('prevDayBtn');
    if (hasScheduleDataForDate(prevDate)) {
        prevDayBtn.disabled = false;
        prevDayBtn.style.opacity = '1';
        prevDayBtn.style.cursor = 'pointer';
    } else {
        prevDayBtn.disabled = true;
        prevDayBtn.style.opacity = '0.5';
        prevDayBtn.style.cursor = 'not-allowed';
    }
    
    // Update next day button
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const nextDayBtn = document.getElementById('nextDayBtn');
    if (hasScheduleDataForDate(nextDate)) {
        nextDayBtn.disabled = false;
        nextDayBtn.style.opacity = '1';
        nextDayBtn.style.cursor = 'pointer';
    } else {
        nextDayBtn.disabled = true;
        nextDayBtn.style.opacity = '0.5';
        nextDayBtn.style.cursor = 'not-allowed';
    }
}

// Update previous day button state (legacy function name, redirects to updateNavigationButtons)
function updatePrevDayButton() {
    updateNavigationButtons();
}

// Find the next worker who can perform the selected service
function findNextWorkerForService(serviceCode) {
    if (!serviceCode) {
        return null;
    }
    
    // Get workers from the grid (top to bottom) with their total weighted service counts
    const workersInGrid = [];
    const totalWeightedCounts = {}; // Track total weighted count of ALL services performed
    
    // First pass: collect workers from grid and calculate their total weighted service count
    for (let rowNumber = 1; rowNumber <= 30; rowNumber++) {
        const rowKey = `row${rowNumber}`;
        const storedData = scheduleData[rowKey] || {};
        const workerName = storedData.name ? storedData.name.trim() : '';
        
        if (workerName) {
            // Calculate total weighted count of ALL services this worker has performed
            let weightedCount = 0;
            for (let i = 1; i <= 15; i++) {
                // Check full service (weight 1)
                const assignedServiceFull = storedData[`service${i}_full`] || '';
                if (assignedServiceFull && services[assignedServiceFull]) {
                    weightedCount += 1; // Full weight
                } else {
                    // Check both top and bottom halves (weight 1/2 each)
                    const assignedServiceTop = storedData[`service${i}_top`] || '';
                    const assignedServiceBottom = storedData[`service${i}_bottom`] || '';
                    
                    // Count top half service
                    if (assignedServiceTop && services[assignedServiceTop]) {
                        weightedCount += 0.5; // Half weight
                    }
                    
                    // Count bottom half service
                    if (assignedServiceBottom && services[assignedServiceBottom]) {
                        weightedCount += 0.5; // Half weight
                    }
                }
            }
            
            // Only add worker once (first occurrence in grid)
            if (!totalWeightedCounts.hasOwnProperty(workerName)) {
                workersInGrid.push(workerName);
                totalWeightedCounts[workerName] = weightedCount;
            } else {
                // If worker appears multiple times, add to their total count
                totalWeightedCounts[workerName] += weightedCount;
            }
        }
    }
    
    // Find eligible workers (those who can perform the selected service)
    const eligibleWorkers = [];
    for (const workerName of workersInGrid) {
        // Check if worker can perform this service
        if (workers[workerName] && workers[workerName].includes(serviceCode)) {
            eligibleWorkers.push({
                name: workerName,
                totalCount: totalWeightedCounts[workerName] || 0,
                position: workersInGrid.indexOf(workerName) // Keep original position for tie-breaking
            });
        }
    }
    
    if (eligibleWorkers.length === 0) {
        return null;
    }
    
    // Find worker with lowest total weighted count (if tie, use first one in grid order)
    eligibleWorkers.sort((a, b) => {
        if (a.totalCount !== b.totalCount) {
            return a.totalCount - b.totalCount; // Lower count first
        }
        return a.position - b.position; // Earlier in grid first
    });
    
    return eligibleWorkers[0].name;
}

// Find the next worker (skip the currently highlighted one)
function findNextWorkerForServiceSkipCurrent(serviceCode) {
    if (!serviceCode) {
        return null;
    }
    
    // Get workers from the grid (top to bottom) with their total weighted service counts
    const workersInGrid = [];
    const totalWeightedCounts = {}; // Track total weighted count of ALL services performed
    
    // First pass: collect workers from grid and calculate their total weighted service count
    for (let rowNumber = 1; rowNumber <= 30; rowNumber++) {
        const rowKey = `row${rowNumber}`;
        const storedData = scheduleData[rowKey] || {};
        const workerName = storedData.name ? storedData.name.trim() : '';
        
        if (workerName) {
            // Calculate total weighted count of ALL services this worker has performed
            let weightedCount = 0;
            for (let i = 1; i <= 15; i++) {
                // Check full service (weight 1)
                const assignedServiceFull = storedData[`service${i}_full`] || '';
                if (assignedServiceFull && services[assignedServiceFull]) {
                    weightedCount += 1; // Full weight
                } else {
                    // Check both top and bottom halves (weight 1/2 each)
                    const assignedServiceTop = storedData[`service${i}_top`] || '';
                    const assignedServiceBottom = storedData[`service${i}_bottom`] || '';
                    
                    // Count top half service
                    if (assignedServiceTop && services[assignedServiceTop]) {
                        weightedCount += 0.5; // Half weight
                    }
                    
                    // Count bottom half service
                    if (assignedServiceBottom && services[assignedServiceBottom]) {
                        weightedCount += 0.5; // Half weight
                    }
                }
            }
            
            // Only add worker once (first occurrence in grid)
            if (!totalWeightedCounts.hasOwnProperty(workerName)) {
                workersInGrid.push(workerName);
                totalWeightedCounts[workerName] = weightedCount;
            } else {
                // If worker appears multiple times, add to their total count
                totalWeightedCounts[workerName] += weightedCount;
            }
        }
    }
    
    // Find eligible workers (those who can perform the selected service)
    const eligibleWorkers = [];
    for (const workerName of workersInGrid) {
        // Check if worker can perform this service
        if (workers[workerName] && workers[workerName].includes(serviceCode)) {
            eligibleWorkers.push({
                name: workerName,
                totalCount: totalWeightedCounts[workerName] || 0,
                position: workersInGrid.indexOf(workerName) // Keep original position for tie-breaking
            });
        }
    }
    
    if (eligibleWorkers.length === 0) {
        return null;
    }
    
    // Find worker with lowest total weighted count (if tie, use first one in grid order)
    eligibleWorkers.sort((a, b) => {
        if (a.totalCount !== b.totalCount) {
            return a.totalCount - b.totalCount; // Lower count first
        }
        return a.position - b.position; // Earlier in grid first
    });
    
    // Get currently highlighted worker
    const currentHighlighted = Array.from(highlightedWorkers)[0];
    
    // Find the index of currently highlighted worker
    const currentIndex = eligibleWorkers.findIndex(w => w.name === currentHighlighted);
    
    // If current worker is found and there's a next worker, return the next one
    if (currentIndex >= 0 && currentIndex < eligibleWorkers.length - 1) {
        return eligibleWorkers[currentIndex + 1].name;
    }
    
    // If no current worker or it's the last one, return the first worker (wrap around)
    return eligibleWorkers[0].name;
}

// Highlight the next worker who can perform the selected service
function highlightWorkersForService(serviceCode) {
    // Clear existing highlights
    highlightedWorkers.clear();
    
    if (serviceCode) {
        const nextWorker = findNextWorkerForService(serviceCode);
        if (nextWorker) {
            highlightedWorkers.add(nextWorker);
        }
    }
    
    saveHighlightsToStorage();
    renderSchedule();
}

// Setup event listeners
function setupEventListeners() {
    // Service selection
    document.getElementById('serviceSelect').addEventListener('change', (e) => {
        selectedService = e.target.value;
        saveSelectedServiceToStorage();
        highlightWorkersForService(selectedService);
    });
    
    // Next worker button
    document.getElementById('nextWorkerBtn').addEventListener('click', () => {
        if (selectedService) {
            const nextWorker = findNextWorkerForServiceSkipCurrent(selectedService);
            if (nextWorker) {
                highlightedWorkers.clear();
                highlightedWorkers.add(nextWorker);
                saveHighlightsToStorage();
                renderSchedule();
            }
        }
    });
    
    // Previous day button
    document.getElementById('prevDayBtn').addEventListener('click', () => {
        navigateToPreviousDay();
    });
    
    // Next day button
    document.getElementById('nextDayBtn').addEventListener('click', () => {
        navigateToNextDay();
    });
    
    // Highlight all workers
    document.getElementById('highlightAllBtn').addEventListener('click', () => {
        Object.keys(workers).forEach(name => highlightedWorkers.add(name));
        saveHighlightsToStorage();
        renderSchedule();
    });
    
    // Clear highlights
    document.getElementById('clearHighlightsBtn').addEventListener('click', () => {
        highlightedWorkers.clear();
        saveHighlightsToStorage();
        renderSchedule();
    });
    
    // Print schedule
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });
}

// Initialize on page load
init();
