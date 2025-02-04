async function updateDisplay() {
    try {
        const now = new Date();
        document.getElementById('datetime').textContent = formatTime(now);

        // Fetch schedules
        const schedules = {
            moon: await window.electronAPI.getMoonSchedule(),
            sun: await window.electronAPI.getSunSchedule(),
            nodes: await window.electronAPI.getNodesSchedule(),
            mercury: await window.electronAPI.getMercurySchedule(),
            venus: await window.electronAPI.getVenusSchedule(),
            mars: await window.electronAPI.getMarsSchedule(),
            jupiter: await window.electronAPI.getJupiterSchedule(),
            saturn: await window.electronAPI.getSaturnSchedule(),
            uranus: await window.electronAPI.getUranusSchedule(),
            neptune: await window.electronAPI.getNeptuneSchedule(),
            pluto: await window.electronAPI.getPlutoSchedule()
        };

        // Process each schedule
        for (const [prefix, schedule] of Object.entries(schedules)) {
            console.log(`Processing ${prefix} schedule:`, schedule);
            processSchedule(schedule, prefix, now);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

function processSchedule(schedule, prefix, now) {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        console.warn(`${prefix} schedule is empty or invalid.`);
        return;
    }

    let currentActivation = null;
    let nextActivation = null;

    for (const activation of schedule) {
        const activationTime = parseTimestamp(activation.timestamp);
        if (!activationTime) continue;

        if (activationTime <= now) {
            currentActivation = activation;
        } else {
            nextActivation = activation;
            break;
        }
    }

    // Update current activation
    document.getElementById(`${prefix}-current-activation`).textContent = formatActivation(currentActivation);

    // Update next activation
    document.getElementById(`${prefix}-next-activation`).textContent = formatActivation(nextActivation);

    // Update countdown timer
    document.getElementById(`${prefix}-countdown-timer`).textContent = formatCountdown(nextActivation, now);
}

function parseTimestamp(timestamp) {
    if (!timestamp) return null;
    return new Date(timestamp); // Handles both formats
}

function formatActivation(activation) {
    if (!activation) return '-';
    return ` ${activation.gate} line ${String(activation.line).trim()}: ${formatDate(activation.timestamp)}, ${formatTime(activation.timestamp)}`;
}

function formatCountdown(nextActivation, now) {
    if (!nextActivation) return '-';
    const timeUntilNext = parseTimestamp(nextActivation.timestamp) - now;
    if (timeUntilNext < 0) return '-';

    const days = Math.floor(timeUntilNext / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeUntilNext % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeUntilNext % (1000 * 60)) / 1000);

    return days > 0 
        ? `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(timestamp) {
    const date = parseTimestamp(timestamp);
    return date ? `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}` : '-';
}

function formatTime(timestamp) {
    const date = parseTimestamp(timestamp);
    return date ? date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) : '-';
}


// Run updates
updateDisplay();
setInterval(updateDisplay, 1000);
