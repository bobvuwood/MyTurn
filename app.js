// Services data with codes and names
const services = {
    'P': { name: 'Pedicure', duration: 60 },
    'M': { name: 'Manicure', duration: 30 },
    'G': { name: 'Gel Manicure', duration: 60 },
    'GX': { name: 'GelX', duration: 60 },
    'PG': { name: 'Pedicure Gel', duration: 60 },
    'F': { name: 'Fill', duration: 30 },
    'D': { name: 'Dip', duration: 60 },
    'DM': { name: 'Deluxe Manicure', duration: 30 },
    'LM': { name: 'Luxury Manicure', duration: 60 },
    'JM': { name: 'Jelly Manicure', duration: 60 },
    'FS': { name: 'Full Set', duration: 30 },
    'X': { name: 'Skip Turn', duration: 60 }

};

// Workers data will be loaded from localStorage or use defaults
// See loadWorkers() function below

// Application state
let highlightedWorkers = new Set();
let scheduleData = {}; // Store time in and service assignments
let selectedService = '';
let currentDate = new Date();
let currentTooltipElement = null; // Track which element's tooltip is currently shown

// Load workers from localStorage or use default
function loadWorkers() {
    const stored = localStorage.getItem('myTurnWorkers');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing workers from localStorage:', e);
        }
    }
    // Return default workers if nothing in storage
    return {
        'Amanda': ['X', 'P', 'M', 'G', 'PG'],
        'Ana': ['X', 'P', 'M'],
        'Annie': ['X', 'P'],
        'Heidi': ['X', 'P', 'M', 'G', 'PG'],
        'Helen': ['X', 'P', 'M'],
        'Jasmine': ['X', 'P', 'M', 'G', 'D', 'PG'],
        'Kathy': ['X', 'P'],
        'Lan': ['X', 'P', 'PG', 'M'],
        'Lucy': ['X', 'P', 'M', 'G', 'PG'],
        'Mimi': ['X', 'P', 'M', 'G', 'PG'],
        'Sally': ['X', 'P', 'M', 'G', 'PG'],
        'May': ['X', 'P', 'M', 'G', 'D', 'F', 'FS', 'PG'],
        'Joy': ['X', 'M', 'G', 'D', 'F', 'FS'],
        'Kathlyn': ['X', 'M', 'G', 'D', 'F', 'FS'],
        'Lily': ['X', 'M', 'G', 'D', 'F', 'FS', 'P', 'PG'],
        'Angela': ['X', 'M', 'G', 'D', 'F', 'FS'],
        'Natalie': ['X', 'M', 'G', 'D', 'F', 'FS'],
        'Lynn': ['X', 'M', 'G', 'P', 'PG']
    };
}

// Save workers to localStorage
function saveWorkers() {
    localStorage.setItem('myTurnWorkers', JSON.stringify(workers));
}

// Initialize workers from storage
let workers = loadWorkers();

// Initialize the application
function init() {
    setupServiceDropdown();
    updateDateDisplay();
    loadScheduleFromStorage();
    renderSchedule();
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
    const year = currentDate.getFullYear();
    document.getElementById('dateDisplay').textContent = `${dayName} ${month}/${day}/${year}`;
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
        
        // Set contentEditable based on whether name is entered
        if (nameValue) {
            // Name is entered - make it read-only
            nameCell.contentEditable = false;
            nameCell.style.cursor = 'pointer';
        } else {
            // No name - allow editing
            nameCell.contentEditable = true;
        }
        
        // Track double-click to prevent tooltip from showing
        let doubleClickOccurred = false;
        let clickTimeout = null;
        
        // Double-click to edit (works for any name, correct or incorrect)
        nameCell.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            e.preventDefault();
            doubleClickOccurred = true;
            
            // Clear any pending click timeout
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            
            // Hide tooltip if showing
            const tooltip = document.getElementById('workerTooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
                currentTooltipElement = null;
            }
            
            nameCell.contentEditable = true;
            nameCell.style.cursor = 'text';
            nameCell.focus();
            // Select all text for easy editing
            const range = document.createRange();
            range.selectNodeContents(nameCell);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
        
        // Create autocomplete dropdown
        const autocompleteDropdown = document.createElement('div');
        autocompleteDropdown.className = 'autocomplete-dropdown';
        autocompleteDropdown.style.display = 'none';
        nameCell.appendChild(autocompleteDropdown);
        
        let selectedIndex = -1;
        let filteredWorkers = [];
        
        // Helper function to get only the text content of the cell (excluding dropdown)
        function getCellTextContent() {
            // Get all direct child nodes that are text nodes only (exclude all element nodes)
            // This ensures we don't include any text from the dropdown or other child elements
            let text = '';
            for (let node of nameCell.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
                // Explicitly skip all element nodes (including dropdown)
            }
            return text.trim();
        }
        
        // Function to get workers already assigned in other rows
        function getAssignedWorkers(excludeRowNumber) {
            const assigned = new Set();
            for (let r = 1; r <= 30; r++) {
                if (r === excludeRowNumber) continue; // Skip current row
                const rowKey = `row${r}`;
                const storedData = scheduleData[rowKey] || {};
                const workerName = storedData.name ? storedData.name.trim() : '';
                if (workerName) {
                    assigned.add(workerName);
                }
            }
            return assigned;
        }
        
        // Function to filter workers based on input
        function filterWorkers(input) {
            // Get text content and clean it up
            let searchText = '';
            if (typeof input === 'string') {
                searchText = input.toLowerCase().trim();
            } else if (input && input.textContent !== undefined) {
                searchText = input.textContent.toLowerCase().trim();
            } else {
                searchText = String(input || '').toLowerCase().trim();
            }
            
            // Get workers already assigned in other rows
            const assignedWorkers = getAssignedWorkers(rowNumber);
            
            // Get all available workers (excluding already assigned ones)
            let availableWorkers = Object.keys(workers).filter(name => 
                !assignedWorkers.has(name)
            );
            
            // If no search text, return all available workers
            if (!searchText) {
                return availableWorkers.sort();
            }
            
            // Filter by search text
            return availableWorkers.filter(name => 
                name.toLowerCase().startsWith(searchText)
            ).sort();
        }
        
        // Function to show autocomplete dropdown
        function showAutocomplete(input) {
            // Get the current text from the cell (excluding dropdown)
            const currentText = typeof input === 'string' ? input : getCellTextContent();
            filteredWorkers = filterWorkers(currentText);
            selectedIndex = -1;
            
            if (filteredWorkers.length === 0) {
                autocompleteDropdown.style.display = 'none';
                return;
            }
            
            // Clear and populate dropdown
            autocompleteDropdown.innerHTML = '';
            filteredWorkers.forEach((workerName, index) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = workerName;
                item.addEventListener('click', () => {
                    nameCell.textContent = workerName;
                    nameCell.blur();
                });
                item.addEventListener('mouseenter', () => {
                    selectedIndex = index;
                    updateAutocompleteSelection();
                });
                autocompleteDropdown.appendChild(item);
            });
            
            // Position dropdown
            const rect = nameCell.getBoundingClientRect();
            autocompleteDropdown.style.left = '0';
            autocompleteDropdown.style.top = `${rect.height}px`;
            autocompleteDropdown.style.width = `${rect.width}px`;
            autocompleteDropdown.style.display = 'block';
        }
        
        // Show autocomplete when cell is focused (before typing)
        nameCell.addEventListener('focus', (e) => {
            // Only show if cell is editable and empty
            if (nameCell.contentEditable === 'true' || nameCell.contentEditable === true) {
                const currentText = getCellTextContent();
                // Show all workers if cell is empty, otherwise filter based on current text
                showAutocomplete(currentText);
            }
        });
        
        // Function to update selected item in dropdown
        function updateAutocompleteSelection() {
            const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
            items.forEach((item, index) => {
                if (index === selectedIndex) {
                    item.classList.add('selected');
                    // Scroll into view
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        
        // Function to hide autocomplete dropdown
        function hideAutocomplete() {
            autocompleteDropdown.style.display = 'none';
            selectedIndex = -1;
            filteredWorkers = [];
        }
        
        nameCell.addEventListener('input', (e) => {
            // Use requestAnimationFrame to ensure textContent is updated
            requestAnimationFrame(() => {
                const currentText = getCellTextContent();
                showAutocomplete(currentText);
            });
        });
        
        nameCell.addEventListener('blur', (e) => {
            // Delay hiding to allow click on dropdown item
            setTimeout(() => {
                hideAutocomplete();
            }, 200);
            
            // Get the text content (excluding dropdown)
            let name = getCellTextContent();
            
            // Ensure the cell only contains the name text, not any dropdown elements
            if (name !== e.target.textContent.trim()) {
                e.target.textContent = name;
            }
            
            const previousName = storedData.name || '';
            
            // Auto-complete if there's a single match
            if (name && filteredWorkers.length === 1 && name.toLowerCase() === filteredWorkers[0].toLowerCase()) {
                e.target.textContent = filteredWorkers[0];
                saveRowName(rowNumber, filteredWorkers[0]);
            } else {
                // If name is empty or doesn't match, clear it properly
                if (!name) {
                    e.target.textContent = '';
                }
                saveRowName(rowNumber, name);
            }
            
            // Auto-populate Time In if name is entered and Time In is empty
            const finalName = e.target.textContent.trim();
            if (finalName && !previousName) {
                // Name was just entered (was empty before)
                const timeInput = row.querySelector('.col-time input[type="time"]');
                if (timeInput && !timeInput.value) {
                    // Get current time in HH:MM format
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const currentTime = `${hours}:${minutes}`;
                    timeInput.value = currentTime;
                    saveTimeIn(rowNumber, currentTime);
                }
            }
            
            // Make read-only if name is entered, otherwise keep editable
            if (finalName) {
                e.target.contentEditable = false;
                e.target.style.cursor = 'pointer';
            } else {
                e.target.contentEditable = true;
                e.target.style.cursor = 'text';
            }
            
            // Update highlight if name matches highlighted workers
            if (finalName && highlightedWorkers.has(finalName)) {
                e.target.classList.add('highlighted');
            } else {
                e.target.classList.remove('highlighted');
            }
            // Update tooltip
            if (finalName && workers[finalName]) {
                const serviceCodes = workers[finalName].join(', ');
                e.target.title = serviceCodes;
            } else {
                e.target.title = '';
            }
        });
        
        // Single click for tooltip (only if cell is read-only and name exists in workers)
        nameCell.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling to document
            
            const name = nameCell.textContent.trim();
            
            // Only show tooltip if cell is read-only (name is entered and not currently being edited)
            if (name && !nameCell.contentEditable) {
                // Use timeout to distinguish single click from double-click
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                }
                
                clickTimeout = setTimeout(() => {
                    // Only show tooltip if it wasn't a double-click
                    if (!doubleClickOccurred) {
                        if (name && workers[name]) {
                            const serviceCodes = workers[name].join(', ');
                            const tooltip = document.getElementById('workerTooltip');
                            
                            if (tooltip) {
                                // If clicking the same cell, toggle tooltip
                                if (currentTooltipElement === nameCell) {
                                    tooltip.style.display = 'none';
                                    currentTooltipElement = null;
                                } else {
                                    // Show tooltip for this worker
                                    tooltip.textContent = serviceCodes;
                                    tooltip.style.display = 'block';
                                    
                                    // Position tooltip near the clicked cell
                                    const rect = nameCell.getBoundingClientRect();
                                    tooltip.style.left = `${rect.right + 10}px`;
                                    tooltip.style.top = `${rect.top}px`;
                                    
                                    // Adjust if tooltip goes off screen
                                    setTimeout(() => {
                                        const tooltipRect = tooltip.getBoundingClientRect();
                                        if (tooltipRect.right > window.innerWidth) {
                                            tooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
                                        }
                                        if (tooltipRect.bottom > window.innerHeight) {
                                            tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
                                        }
                                    }, 0);
                                    
                                    currentTooltipElement = nameCell;
                                }
                            }
                        } else if (name) {
                            // Name doesn't exist in workers, just toggle highlight
                            toggleHighlight(name);
                        }
                    }
                    
                    // Reset flag after processing
                    doubleClickOccurred = false;
                    clickTimeout = null;
                }, 250); // Wait 250ms to detect double-click
            } else if (name && !nameCell.contentEditable) {
                toggleHighlight(name);
            }
        });
        nameCell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // If dropdown is visible and item is selected, use that
                if (autocompleteDropdown.style.display === 'block' && selectedIndex >= 0 && filteredWorkers[selectedIndex]) {
                    nameCell.textContent = filteredWorkers[selectedIndex];
                    nameCell.blur();
                } else {
                    nameCell.blur();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (autocompleteDropdown.style.display === 'block' && filteredWorkers.length > 0) {
                    selectedIndex = Math.min(selectedIndex + 1, filteredWorkers.length - 1);
                    updateAutocompleteSelection();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (autocompleteDropdown.style.display === 'block' && filteredWorkers.length > 0) {
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    updateAutocompleteSelection();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideAutocomplete();
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
            
            // Check if there's a half-weight service (30 minutes)
            const hasHalfWeightService = (serviceCodeTop && services[serviceCodeTop] && services[serviceCodeTop].duration === 30) ||
                                        (serviceCodeBottom && services[serviceCodeBottom] && services[serviceCodeBottom].duration === 30);
            
            // Create diagonal line (only visible when there's a half-weight service)
            const diagonalLine = document.createElement('div');
            diagonalLine.className = 'service-diagonal-line';
            // Only show diagonal if there's a half-weight service
            if (hasHalfWeightService) {
                diagonalLine.style.display = 'block';
            } else {
                diagonalLine.style.display = 'none';
            }
            serviceCell.appendChild(diagonalLine);
            
            // Create a single unified input cell (shown when empty or for full-weight services)
            const unifiedCell = document.createElement('div');
            unifiedCell.className = 'service-cell-unified';
            if (fullService) {
                unifiedCell.textContent = fullService;
                unifiedCell.style.fontWeight = 'bold';
                unifiedCell.style.color = '#667eea';
            } else if (!serviceCodeTop && !serviceCodeBottom) {
                // Empty cell - show as unified editable cell
                unifiedCell.textContent = '';
            } else {
                // Has half-weight service(s) - hide unified, will show split below
                unifiedCell.style.display = 'none';
            }
            unifiedCell.contentEditable = true;
            unifiedCell.addEventListener('focus', (e) => {
                // If cell is empty and a service is selected, populate with service code
                if (!e.target.textContent.trim()) {
                    if (selectedService) {
                        // Populate with selected service code
                        e.target.textContent = selectedService;
                        // Select all text so user can easily replace or delete
                        setTimeout(() => {
                            const range = document.createRange();
                            const selection = window.getSelection();
                            range.selectNodeContents(e.target);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }, 0);
                    } else {
                        // No service selected - position cursor in center
                        requestAnimationFrame(() => {
                            const zwsp = '\u200B';
                            if (!e.target.textContent) {
                                e.target.textContent = zwsp;
                            }
                            setTimeout(() => {
                                const range = document.createRange();
                                const selection = window.getSelection();
                                if (e.target.firstChild && e.target.firstChild.nodeType === Node.TEXT_NODE) {
                                    range.setStart(e.target.firstChild, 1);
                                } else {
                                    range.setStart(e.target, 1);
                                }
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }, 10);
                        });
                    }
                }
            });
            unifiedCell.addEventListener('input', (e) => {
                // Remove zero-width space when user types
                if (e.target.textContent === '\u200B') {
                    e.target.textContent = '';
                } else if (e.target.textContent.startsWith('\u200B')) {
                    e.target.textContent = e.target.textContent.replace('\u200B', '');
                }
            });
            unifiedCell.addEventListener('blur', (e) => {
                // Remove zero-width space and get the actual code
                let code = e.target.textContent.replace(/\u200B/g, '').trim().toUpperCase();
                e.target.textContent = code; // Update display immediately with capitalized version
                handleServiceInput(rowNumber, i, code, 'unified');
                renderSchedule(); // Re-render to update display
            });
            unifiedCell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
            
            // Create top triangle (upper left) - for 1/2 weight services
            const topHalf = document.createElement('div');
            topHalf.className = 'service-cell-top';
            if (fullService || (!serviceCodeTop && !serviceCodeBottom)) {
                // Full service or empty - hide top triangle
                topHalf.style.display = 'none';
            } else {
                topHalf.textContent = serviceCodeTop;
                if (serviceCodeTop) {
                    topHalf.style.fontWeight = 'bold';
                    topHalf.style.color = '#667eea';
                }
            }
            topHalf.contentEditable = true;
            // Store original value to preserve it if user doesn't make changes
            const originalTopValue = serviceCodeTop || '';
            topHalf.addEventListener('focus', (e) => {
                // Store the original value when focusing
                e.target.dataset.originalValue = e.target.textContent.trim();
                
                // If cell is empty and a half-weight service is selected, populate with service code
                if (!e.target.textContent.trim()) {
                    if (selectedService && services[selectedService] && services[selectedService].duration === 30) {
                        // Only populate if it's a half-weight service (30 minutes)
                        e.target.textContent = selectedService;
                        // Select all text so user can easily replace or delete
                        setTimeout(() => {
                            const range = document.createRange();
                            const selection = window.getSelection();
                            range.selectNodeContents(e.target);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }, 0);
                    }
                }
            });
            topHalf.addEventListener('blur', (e) => {
                let code = e.target.textContent.trim().toUpperCase();
                const originalValue = e.target.dataset.originalValue || '';
                
                // Always update - allow clearing if user deleted content
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
            if (fullService || (!serviceCodeTop && !serviceCodeBottom)) {
                // Full service or empty - hide bottom triangle
                bottomHalf.style.display = 'none';
            } else {
                bottomHalf.textContent = serviceCodeBottom;
                if (serviceCodeBottom) {
                    bottomHalf.style.fontWeight = 'bold';
                    bottomHalf.style.color = '#667eea';
                }
            }
            bottomHalf.contentEditable = true;
            // Store original value to preserve it if user doesn't make changes
            const originalBottomValue = serviceCodeBottom || '';
            bottomHalf.addEventListener('focus', (e) => {
                // Store the original value when focusing
                e.target.dataset.originalValue = e.target.textContent.trim();
                
                // If cell is empty and a half-weight service is selected, populate with service code
                if (!e.target.textContent.trim()) {
                    if (selectedService && services[selectedService] && services[selectedService].duration === 30) {
                        // Only populate if it's a half-weight service (30 minutes)
                        e.target.textContent = selectedService;
                        // Select all text so user can easily replace or delete
                        setTimeout(() => {
                            const range = document.createRange();
                            const selection = window.getSelection();
                            range.selectNodeContents(e.target);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }, 0);
                    }
                }
            });
            bottomHalf.addEventListener('blur', (e) => {
                let code = e.target.textContent.trim().toUpperCase();
                
                // Always update - allow clearing if user deleted content
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
            
            serviceCell.appendChild(unifiedCell);
            serviceCell.appendChild(topHalf);
            serviceCell.appendChild(bottomHalf);
            row.appendChild(serviceCell);
        }
        
        tbody.appendChild(row);
    }
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
        // Empty - only clear the specific half being edited, not both halves
        if (half === 'top') {
            scheduleData[rowKey][`service${columnNumber}_top`] = '';
            // Don't clear bottom or full - preserve them
        } else if (half === 'bottom') {
            scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
            // Don't clear top or full - preserve them
        } else {
            // For unified or full, clear everything
            scheduleData[rowKey][`service${columnNumber}_top`] = '';
            scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
            scheduleData[rowKey][`service${columnNumber}_full`] = '';
        }
        saveScheduleToStorage();
        return;
    }
    
    // Validate: Check if worker can perform this service
    const workerName = scheduleData[rowKey].name ? scheduleData[rowKey].name.trim() : '';
    if (workerName && workers[workerName]) {
        if (!workers[workerName].includes(serviceCode)) {
            // Worker cannot perform this service - show error and prevent saving
            alert(`${workerName} cannot perform service ${serviceCode}. Available services: ${workers[workerName].join(', ')}`);
            renderSchedule(); // Re-render to restore previous value
            return;
        }
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
            } else if (half === 'unified') {
                // User entered in unified cell - put in top half
                scheduleData[rowKey][`service${columnNumber}_top`] = serviceCode;
                scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
            } else if (half === 'full') {
                // If editing a full service and changing to half, put in top
                scheduleData[rowKey][`service${columnNumber}_top`] = serviceCode;
                scheduleData[rowKey][`service${columnNumber}_bottom`] = '';
            }
        }
    }
    
    saveScheduleToStorage();
    
    // After service code is entered, unhighlight the worker and reset the Service dropdown
    if (workerName && highlightedWorkers.has(workerName)) {
        highlightedWorkers.delete(workerName);
        saveHighlightsToStorage();
    }
    
    // Reset Service dropdown
    selectedService = '';
    const serviceSelect = document.getElementById('serviceSelect');
    if (serviceSelect) {
        serviceSelect.value = '';
    }
    localStorage.setItem('selectedService', '');
    
    // Re-render to update highlights
    renderSchedule();
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
    
    currentDate = prevDate;
    updateDateDisplay();
    scheduleData = loadScheduleForDate(currentDate);
    renderSchedule();
    updateNavigationButtons();
}

// Navigate to next day
function navigateToNextDay() {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    currentDate = nextDate;
    updateDateDisplay();
    scheduleData = loadScheduleForDate(currentDate);
    renderSchedule();
    updateNavigationButtons();
}

// Update navigation buttons state (always enabled)
function updateNavigationButtons() {
    // Both buttons are always enabled
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    
    prevDayBtn.disabled = false;
    prevDayBtn.style.opacity = '1';
    prevDayBtn.style.cursor = 'pointer';
    
    nextDayBtn.disabled = false;
    nextDayBtn.style.opacity = '1';
    nextDayBtn.style.cursor = 'pointer';
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
    
    // Export PDF button
    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        exportToPDF();
    });
    
    // Manage Workers button
    document.getElementById('manageWorkersBtn').addEventListener('click', () => {
        showWorkersDialog();
    });
    
    // Close Workers Dialog button
    document.getElementById('closeWorkersDialog').addEventListener('click', () => {
        hideWorkersDialog();
    });
    
    // Close dialog when clicking outside
    document.getElementById('workersDialog').addEventListener('click', (e) => {
        if (e.target.id === 'workersDialog') {
            hideWorkersDialog();
        }
    });
    
    // Hide tooltip when clicking elsewhere
    document.addEventListener('click', (e) => {
        // Don't hide if clicking on a name cell (handled by nameCell click handler)
        if (!e.target.closest('.col-name')) {
            const tooltip = document.getElementById('workerTooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
                currentTooltipElement = null;
            }
        }
    });
}

// Export schedule to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const scheduleContainer = document.querySelector('.schedule-container');
    const dateDisplay = document.getElementById('dateDisplay').textContent;
    
    // Show loading state
    const exportBtn = document.getElementById('exportPdfBtn');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<span class="export-icon">⏳</span> Exporting...';
    exportBtn.disabled = true;
    
    // Use html2canvas to capture the schedule table
    html2canvas(scheduleContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('landscape', 'mm', 'a4');
        
        // Get PDF dimensions
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate image dimensions to fit the page
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 40) / imgHeight);
        const imgWidthPdf = imgWidth * ratio;
        const imgHeightPdf = imgHeight * ratio;
        
        // Add title
        pdf.setFontSize(16);
        pdf.text('DAILY WORK SCHEDULE', pdfWidth / 2, 15, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(dateDisplay, pdfWidth / 2, 25, { align: 'center' });
        
        // Add the schedule image
        pdf.addImage(imgData, 'PNG', (pdfWidth - imgWidthPdf) / 2, 30, imgWidthPdf, imgHeightPdf);
        
        // Save the PDF
        const fileName = `Schedule_${dateDisplay.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        // Restore button state
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    }).catch((error) => {
        console.error('Error exporting to PDF:', error);
        alert('Error exporting to PDF. Please try again.');
        
        // Restore button state
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    });
}

// Show Workers Management Dialog
function showWorkersDialog() {
    const dialog = document.getElementById('workersDialog');
    renderWorkersTable();
    dialog.style.display = 'flex';
}

// Hide Workers Management Dialog
function hideWorkersDialog() {
    const dialog = document.getElementById('workersDialog');
    dialog.style.display = 'none';
}

// Render workers table in dialog
function renderWorkersTable() {
    const tbody = document.getElementById('workersTableBody');
    tbody.innerHTML = '';
    
    // Render existing workers, sorted by name
    Object.entries(workers)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .forEach(([name, skills]) => {
            const row = createWorkerRow(name, skills);
            tbody.appendChild(row);
        });
}

// Create a worker row
function createWorkerRow(name = '', skills = []) {
    const row = document.createElement('tr');
    
    // Name cell
    const nameCell = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'worker-name-input';
    nameInput.value = name;
    nameInput.placeholder = 'Worker name';
    nameInput.addEventListener('blur', () => {
        const oldName = nameInput.dataset.originalName || '';
        const newName = nameInput.value.trim();
        
        if (newName && newName !== oldName) {
            // If name changed, update workers object
            if (oldName && workers[oldName]) {
                // Rename worker
                const skillsArray = workers[oldName];
                delete workers[oldName];
                workers[newName] = skillsArray;
            } else if (!oldName) {
                // New worker
                const skillsStr = row.querySelector('.worker-skills-input').value.trim();
                const skillsArray = skillsStr ? skillsStr.split(',').map(s => s.trim().toUpperCase()).filter(s => s) : [];
                workers[newName] = skillsArray;
            }
            nameInput.dataset.originalName = newName;
            saveWorkers();
            renderSchedule(); // Update schedule to reflect worker changes
        } else if (!newName && oldName) {
            // Name was cleared, restore it
            nameInput.value = oldName;
        }
    });
    nameInput.addEventListener('focus', () => {
        nameInput.dataset.originalName = nameInput.value.trim();
    });
    nameInput.dataset.originalName = name;
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);
    
    // Skills cell
    const skillsCell = document.createElement('td');
    const skillsInput = document.createElement('input');
    skillsInput.type = 'text';
    skillsInput.className = 'worker-skills-input';
    skillsInput.value = Array.isArray(skills) ? skills.join(', ') : skills;
    skillsInput.placeholder = 'P, M, G, PG';
    skillsInput.addEventListener('blur', () => {
        const workerName = row.querySelector('.worker-name-input').value.trim();
        if (workerName) {
            const skillsStr = skillsInput.value.trim();
            const skillsArray = skillsStr ? skillsStr.split(',').map(s => s.trim().toUpperCase()).filter(s => s) : [];
            workers[workerName] = skillsArray;
            saveWorkers();
            renderSchedule(); // Update schedule to reflect worker changes
        }
    });
    skillsCell.appendChild(skillsInput);
    row.appendChild(skillsCell);
    
    // Action cell
    const actionCell = document.createElement('td');
    actionCell.style.textAlign = 'center';
    
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-worker';
    addBtn.innerHTML = '+';
    addBtn.title = 'Add new worker';
    addBtn.addEventListener('click', () => {
        const tbody = document.getElementById('workersTableBody');
        const newRow = createWorkerRow('', []);
        tbody.appendChild(newRow);
        // Focus on the name input of the new row
        setTimeout(() => {
            newRow.querySelector('.worker-name-input').focus();
        }, 0);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-worker';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete worker';
    deleteBtn.addEventListener('click', () => {
        const workerName = row.querySelector('.worker-name-input').value.trim();
        if (workerName && workers[workerName]) {
            if (confirm(`Are you sure you want to delete worker "${workerName}"?`)) {
                delete workers[workerName];
                saveWorkers();
                row.remove();
                renderSchedule(); // Update schedule to reflect worker deletion
            }
        } else {
            // New row that hasn't been saved yet, just remove it
            row.remove();
        }
    });
    
    actionCell.appendChild(addBtn);
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);
    
    return row;
}

// Initialize on page load
init();
