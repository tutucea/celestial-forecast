console.log('schedule-popup-renderer.js: Script loaded.');

// Use a fallback object to prevent errors if luxon fails to load
const { DateTime } = window.luxon || {};
if (!DateTime) {
    console.error('schedule-popup-renderer.js: ERROR: luxon.DateTime not available. Using native Date.');
}

let currentSchedule = null;
let currentPlanet = null;
let currentTimeZone = 'local'; // Default to local time

// Listen for data from the main process
if (window.popupAPI && typeof window.popupAPI.onReceiveSchedule === 'function') {
    console.log('schedule-popup-renderer.js: popupAPI.onReceiveSchedule is available.');
    window.popupAPI.onReceiveSchedule(({ planet, schedule }) => {
        console.log(`schedule-popup-renderer.js: Received data for ${planet}:`, JSON.stringify(schedule, null, 2));
        currentPlanet = planet;
        currentSchedule = schedule;
        renderTable();
    });
} else {
    console.error('schedule-popup-renderer.js: ERROR: popupAPI or onReceiveSchedule not defined.');
    const container = document.getElementById('schedule-container');
    if (container) {
        container.innerHTML = '<p style="color: red; font-weight: bold;">Error: Failed to initialize data listener.</p>';
    }
}

function renderTable() {
    console.log('schedule-popup-renderer.js: Rendering table for', currentPlanet, 'in time zone', currentTimeZone);
    const containerDiv = document.getElementById('schedule-container');
    if (!containerDiv) {
        console.error('schedule-popup-renderer.js: ERROR: schedule-container element not found.');
        return;
    }

    const planetName = currentPlanet
        ? `${currentPlanet.charAt(0).toUpperCase() + currentPlanet.slice(1)} Schedule`
        : 'Schedule';
    const planetNameElement = document.getElementById('planet-name');
    if (planetNameElement) {
        planetNameElement.textContent = planetName;
    }

    if (!currentSchedule || !Array.isArray(currentSchedule) || currentSchedule.length === 0) {
        console.warn('schedule-popup-renderer.js: No schedule data to render for', currentPlanet);
        containerDiv.innerHTML = '<p>No schedule entries available.</p>';
        return;
    }

    // Find the current activation (latest entry with timestamp <= current UTC time)
    let currentActivationIndex = -1;
    const now = DateTime ? DateTime.now().toUTC() : new Date();
    if (DateTime) {
        currentSchedule.forEach((entry, index) => {
            if (entry.timestamp) {
                const entryTime = DateTime.fromISO(entry.timestamp, { zone: 'utc' });
                if (entryTime.isValid && entryTime <= now && (currentActivationIndex === -1 || entryTime > DateTime.fromISO(currentSchedule[currentActivationIndex].timestamp, { zone: 'utc' }))) {
                    currentActivationIndex = index;
                }
            }
        });
    } else {
        currentSchedule.forEach((entry, index) => {
            if (entry.timestamp) {
                const entryTime = new Date(entry.timestamp);
                if (!isNaN(entryTime.getTime()) && entryTime <= now && (currentActivationIndex === -1 || entryTime > new Date(currentSchedule[currentActivationIndex].timestamp))) {
                    currentActivationIndex = index;
                }
            }
        });
    }
    console.log(`schedule-popup-renderer.js: Current activation index: ${currentActivationIndex}`);

    let tableHTML = '<table><thead><tr><th>Gate</th><th>Line</th><th>Timestamp</th><th>Longitude</th><th>Motion</th></tr></thead><tbody>';
    currentSchedule.forEach((entry, index) => {
        const gate = (entry.gate || '—').replace('Gate', '').trim();
        const line = String(entry.line || '—').trim();
        const longitude = entry.longitude != null ? entry.longitude.toFixed(4) : '—';
        const motion = entry.motion || '—';
        
        let timestamp = '—';
        if (entry.timestamp) {
            try {
                if (DateTime) {
                    const parsed = DateTime.fromISO(entry.timestamp, { zone: 'utc' });
                    if (!parsed.isValid) {
                        throw new Error(`Invalid timestamp: ${entry.timestamp} (${parsed.invalidReason})`);
                    }
                    
                    const effectiveTimeZone = currentTimeZone === 'local' ? DateTime.local().zoneName : currentTimeZone;
                    
                    timestamp = parsed
                        .setZone(effectiveTimeZone)
                        .toFormat('yyyy-MM-dd HH:mm:ss');
                        
                    console.log(`schedule-popup-renderer.js: Parsed timestamp ${entry.timestamp} to ${timestamp} in ${effectiveTimeZone}`);
                } else {
                    const date = new Date(entry.timestamp);
                    timestamp = date.toLocaleString('en-CA', {
                        timeZone: currentTimeZone === 'local' ? undefined : currentTimeZone,
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        hour12: false
                    }).replace(/,/, '');
                }
            } catch (error) {
                console.error(`schedule-popup-renderer.js: Error parsing timestamp "${entry.timestamp}":`, error.message);
            }
        }
        
        // Add current-activation class if this is the current activation
        const rowClass = index === currentActivationIndex ? ' class="current-activation"' : '';
        tableHTML += `<tr${rowClass}><td>${gate}</td><td>${line}</td><td>${timestamp}</td><td>${longitude}</td><td>${motion}</td></tr>`;
    });
    tableHTML += '</tbody></table>';

    containerDiv.innerHTML = tableHTML;

    // Scroll to the current activation if found
    if (currentActivationIndex !== -1) {
        const rows = containerDiv.querySelectorAll('table tbody tr');
        if (rows[currentActivationIndex]) {
            rows[currentActivationIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center' // Center the row in the viewport
            });
            console.log(`schedule-popup-renderer.js: Scrolled to current activation at index ${currentActivationIndex}`);
        }
    }
    console.log('schedule-popup-renderer.js: Table rendered successfully.');
}

function changeFontSize(delta) {
    const table = document.querySelector('#schedule-container table');
    if (table) {
        const style = window.getComputedStyle(table);
        const currentSize = parseFloat(style.fontSize);
        const newSize = Math.max(10, Math.min(28, currentSize + delta));
        table.style.fontSize = `${newSize}px`;
        console.log(`schedule-popup-renderer.js: Font size changed to ${newSize}px`);
    }
}

function updateTimeZone() {
    const select = document.getElementById('timezone-select');
    if (!select) {
        console.error('schedule-popup-renderer.js: ERROR: timezone-select element not found.');
        return;
    }
    const newTimeZone = select.value;
    console.log(`schedule-popup-renderer.js: Selected time zone: ${newTimeZone}`);
    
    currentTimeZone = newTimeZone;
    renderTable();
}

window.onload = function() {
    console.log('schedule-popup-renderer.js: Window loaded. Setting up listeners.');
    
    try {
        const timezoneSelect = document.getElementById('timezone-select');
        if (timezoneSelect) {
            if (DateTime) {
                const localZone = DateTime.local().zoneName;
                const localOption = timezoneSelect.querySelector('option[value="local"]');
                if (localOption) {
                    localOption.textContent = `Local Time (${localZone})`;
                }
            }
            timezoneSelect.addEventListener('change', updateTimeZone);
            console.log('schedule-popup-renderer.js: Attached listener to timezone-select.');
        } else {
            console.error('schedule-popup-renderer.js: ERROR: timezone-select element not found.');
        }
        
        const smallerFontBtn = document.getElementById('font-smaller-btn');
        if (smallerFontBtn) {
            smallerFontBtn.addEventListener('click', () => changeFontSize(-2));
            console.log('schedule-popup-renderer.js: Attached listener to font-smaller-btn.');
        }

        const largerFontBtn = document.getElementById('font-larger-btn');
        if (largerFontBtn) {
            largerFontBtn.addEventListener('click', () => changeFontSize(2));
            console.log('schedule-popup-renderer.js: Attached listener to font-larger-btn.');
        }

    } catch (error) {
        console.error('schedule-popup-renderer.js: Error in window.onload:', error);
    }
};