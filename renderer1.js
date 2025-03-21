console.log('renderer1.js loaded');

const oppositeGates = {
  13: 7, 7: 13, 49: 4, 4: 49, 30: 29, 29: 30, 55: 59, 59: 55,
  37: 40, 40: 37, 63: 64, 64: 63, 22: 47, 47: 22, 36: 6, 6: 36,
  25: 46, 46: 25, 17: 18, 18: 17, 21: 48, 48: 21, 51: 57, 57: 51,
  42: 32, 32: 42, 3: 50, 50: 3, 27: 28, 28: 27, 24: 44, 44: 24,
  2: 1, 1: 2, 23: 43, 43: 23, 8: 14, 14: 8, 20: 34, 34: 20,
  16: 9, 9: 16, 35: 5, 5: 35, 45: 26, 26: 45, 12: 11, 11: 12,
  15: 10, 10: 15, 52: 58, 58: 52, 39: 38, 38: 39, 53: 54, 54: 53,
  62: 61, 61: 62, 56: 60, 60: 56, 31: 41, 41: 31, 33: 19, 19: 33,
  61: 62, 62: 61, 38: 39, 39: 38, 41: 31, 19: 33
};

const lastActivations = {};

function findOppositeGate(gate) {
  const numericGate = parseInt(gate.toString().replace(/\D/g, ''), 10);
  return oppositeGates[numericGate] || null;
}

async function updateDisplay(isFirstRun = false) {
  try {
      const now = new Date();
      document.getElementById('datetime').textContent = formatTime(now);

      // Fetch schedules
      const moonSchedule = await window.electronAPI.getMoonSchedule();
      const sunSchedule = await window.electronAPI.getSunSchedule();
      const nodesSchedule = await window.electronAPI.getNodesSchedule();
      const mercurySchedule = await window.electronAPI.getMercurySchedule();
      const venusSchedule = await window.electronAPI.getVenusSchedule();
      const marsSchedule = await window.electronAPI.getMarsSchedule();
      const jupiterSchedule = await window.electronAPI.getJupiterSchedule();
      const saturnSchedule = await window.electronAPI.getSaturnSchedule();
      const uranusSchedule = await window.electronAPI.getUranusSchedule();
      const neptuneSchedule = await window.electronAPI.getNeptuneSchedule();
      const plutoSchedule = await window.electronAPI.getPlutoSchedule();

      // Process Moon
      processSchedule(moonSchedule, 'moon', now, null, isFirstRun);

      // Process Sun
      processSchedule(sunSchedule, 'sun', now, null, isFirstRun);

      // Create and process Earth schedule (synced with Sun)
      const earthSchedule = sunSchedule.map(activation => ({
          ...activation,
          gate: findOppositeGate(activation.gate)
      })).filter(activation => activation.gate !== null);
      processSchedule(earthSchedule, 'earth', now, sunSchedule, isFirstRun);

      // Process North Node
      processSchedule(nodesSchedule, 'nodes', now, null, isFirstRun);

      // Create and process South Node schedule (synced with North Node)
      const southNodeSchedule = nodesSchedule.map(activation => ({
          ...activation,
          gate: findOppositeGate(activation.gate)
      })).filter(activation => activation.gate !== null);
      processSchedule(southNodeSchedule, 'southnode', now, nodesSchedule, isFirstRun);

      // Process Mercury
      processSchedule(mercurySchedule, 'mercury', now, null, isFirstRun);

      // Process Venus
      processSchedule(venusSchedule, 'venus', now, null, isFirstRun);

      // Process Mars
      processSchedule(marsSchedule, 'mars', now, null, isFirstRun);

      // Process Jupiter
      processSchedule(jupiterSchedule, 'jupiter', now, null, isFirstRun);

      // Process Saturn
      processSchedule(saturnSchedule, 'saturn', now, null, isFirstRun);

      // Process Uranus
      processSchedule(uranusSchedule, 'uranus', now, null, isFirstRun);

      // Process Neptune
      processSchedule(neptuneSchedule, 'neptune', now, null, isFirstRun);

      // Process Pluto
      processSchedule(plutoSchedule, 'pluto', now, null, isFirstRun);

  } catch (error) {
      console.error('Error:', error);
  }
}

function processSchedule(schedule, prefix, now, syncedSchedule = null, isFirstRun = false) {
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      console.warn(`[WARNING] ${prefix} schedule is empty or invalid`);
      document.getElementById(`${prefix}-current-activation`).textContent = '-';
      document.getElementById(`${prefix}-next-activation`).textContent = '-';
      document.getElementById(`${prefix}-countdown-timer`).textContent = '-';
      return;
  }

  let currentActivation = null;
  let nextActivation = null;

  console.log(`[PROCESSING] ${prefix} schedule with ${schedule.length} entries`);

  for (const activation of schedule) {
      const activationTime = parseTimestamp(activation.timestamp);
      if (!activationTime) {
          console.warn(`[WARNING] Invalid timestamp in ${prefix} activation:`, activation);
          continue;
      }

      console.log(`[PROCESSING] ${prefix} activation:`, {
          gate: activation.gate,
          line: activation.line,
          time: activationTime.toISOString()
      });

      if (activationTime <= now) {
          currentActivation = activation;
      } else {
          nextActivation = activation;
          break;
      }
  }

  // Notification logic
  const activationKey = `${currentActivation?.gate}-${currentActivation?.line}-${currentActivation?.timestamp}`;
  if (currentActivation) {
      if (isFirstRun) {
          // On first run, initialize lastActivations without notifying
          lastActivations[prefix] = activationKey;
      } else if (lastActivations[prefix] !== activationKey) {
          // After first run, notify only on change
          lastActivations[prefix] = activationKey;
          showNotification(prefix, currentActivation);
      }
  }

  // Update UI elements
  console.log(`[UI UPDATE] ${prefix}-current:`, currentActivation?.gate);
  document.getElementById(`${prefix}-current-activation`).textContent = formatActivation(currentActivation);

  console.log(`[UI UPDATE] ${prefix}-next:`, nextActivation?.gate);
  document.getElementById(`${prefix}-next-activation`).textContent = formatActivation(nextActivation);

  // Use syncedSchedule for countdown if provided (Earth and South Node)
  const countdownSource = syncedSchedule || schedule;
  let countdownNext = null;
  for (const activation of countdownSource) {
      const activationTime = parseTimestamp(activation.timestamp);
      if (activationTime > now) {
          countdownNext = activation;
          break;
      }
  }
  document.getElementById(`${prefix}-countdown-timer`).textContent = formatCountdown(countdownNext, now);
}

function showNotification(prefix, activation) {
    const planetName = prefix.toUpperCase();
    const message = `${planetName} moved to ${activation.gate}, line ${activation.line}`;

    // Send to system notification
    window.electronAPI.showNotification(planetName, message);

    // Play sound
    const audio = new Audio('sounds/notification.mp3');
    audio.play().catch(err => console.error('Audio playback failed:', err));
}

function parseTimestamp(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp);
}

function formatActivation(activation) {
  if (!activation || !activation.gate || !activation.line || !activation.timestamp) return '-';
  const cleanGate = parseInt(activation.gate.toString().replace(/\D/g, ''), 10);
  const gateLine = `${cleanGate}.${String(activation.line).trim()} :`; // ": " after xx.x
  const dateTime = `${formatDate(activation.timestamp)}, ${formatTime(activation.timestamp)}`; // Added comma after date
  const result = `${gateLine} ${dateTime}`;
  console.log(`[formatActivation] Output for gate ${activation.gate}: ${result}`);
  return result;
}

function formatCountdown(nextActivation, now) {
  if (!nextActivation || !nextActivation.timestamp) return '-';
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

// Run once on startup with isFirstRun true, then every second without it
updateDisplay(true);
setInterval(() => updateDisplay(false), 1000);
