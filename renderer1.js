const oppositeGates = {
  13: 7, 7: 13, 49: 4, 4: 49, 30: 29, 29: 30, 55: 59, 59: 55,
  37: 40, 40: 37, 63: 64, 64: 63, 22: 47, 47: 22, 36: 6, 6: 36,
  25: 46, 46: 25, 17: 18, 18: 17, 21: 48, 48: 21, 51: 57, 57: 51,
  42: 32, 32: 42, 3: 50, 50: 3, 27: 28, 28: 27, 24: 44, 44: 24,
  2: 1, 1: 2, 23: 43, 43: 23, 8: 14, 14: 8, 20: 34, 34: 20,
  16: 9, 9: 16, 35: 5, 5: 35, 45: 26, 26: 45, 12: 11, 11: 12,
  15: 10, 10: 15, 52: 58, 58: 52, 39: 38, 38: 39, 53: 54, 54: 53,
  62: 61, 61: 62, 56: 60, 60: 56, 31: 41, 41: 31, 33: 19, 19: 33
};

const lastActivations = {};
const planetNames = [
    'moon', 'sun', 'nodes', 'mercury', 'venus', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'
];

function findOppositeGate(gate) {
  const numericGate = parseInt(gate.toString().replace(/\D/g, ''), 10);
  return oppositeGates[numericGate] || null;
}

async function updateDisplay(isFirstRun = false) {
  try {
      const now = new Date();
      document.getElementById('datetime').textContent = formatTime(now);

      const schedulePromises = planetNames.map(p => window.electronAPI[`get${p.charAt(0).toUpperCase() + p.slice(1)}Schedule`]());
      const schedules = await Promise.all(schedulePromises);
      const scheduleMap = {};
      planetNames.forEach((planet, index) => {
          scheduleMap[planet] = schedules[index];
      });

      planetNames.forEach(planet => {
          processSchedule(scheduleMap[planet], planet, now, null, isFirstRun);
      });

      const sunSchedule = scheduleMap['sun'];
      if (sunSchedule) {
          const earthSchedule = sunSchedule.map(activation => ({
              ...activation, gate: findOppositeGate(activation.gate)
          })).filter(activation => activation.gate !== null);
          processSchedule(earthSchedule, 'earth', now, sunSchedule, isFirstRun);
      }

      const nodesSchedule = scheduleMap['nodes'];
      if (nodesSchedule) {
          const southNodeSchedule = nodesSchedule.map(activation => ({
              ...activation, gate: findOppositeGate(activation.gate)
          })).filter(activation => activation.gate !== null);
          processSchedule(southNodeSchedule, 'southnode', now, nodesSchedule, isFirstRun);
      }

  } catch (error) {
      console.error('Error during display update:', error);
  }
}

function processSchedule(schedule, prefix, now, syncedSchedule = null, isFirstRun = false) {
  const planetContainer = document.getElementById(prefix);
  if (!planetContainer) return; // Exit if the container div for the planet doesn't exist

  if (!schedule || schedule.length === 0) {
      document.getElementById(`${prefix}-current-activation`).textContent = 'No Data';
      document.getElementById(`${prefix}-next-activation`).textContent = '-';
      document.getElementById(`${prefix}-countdown-timer`).textContent = '-';
      return;
  }

  let currentActivation = null, nextActivation = null;
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

  const activationKey = `${currentActivation?.gate}-${currentActivation?.line}-${currentActivation?.timestamp}`;
  if (currentActivation) {
      if (isFirstRun) {
          lastActivations[prefix] = activationKey;
      } else if (lastActivations[prefix] !== activationKey) {
          lastActivations[prefix] = activationKey;
          showNotification(prefix, currentActivation);
      }
  }

  document.getElementById(`${prefix}-current-activation`).textContent = formatActivation(currentActivation);
  document.getElementById(`${prefix}-next-activation`).textContent = formatActivation(nextActivation);

  const countdownSource = syncedSchedule || schedule;
  let countdownNext = null;
  for (const activation of countdownSource) {
      if (parseTimestamp(activation.timestamp) > now) {
          countdownNext = activation;
          break;
      }
  }
  document.getElementById(`${prefix}-countdown-timer`).textContent = formatCountdown(countdownNext, now);

  // --- [THIS IS THE UPDATED PART] ---
  if (isFirstRun) { // Only add the listener once on the very first run
    // Find the title element (the <h2>) inside the planet's container
    const planetTitle = planetContainer.querySelector('h2');
    if (planetTitle) {
      planetTitle.classList.add('planet-title'); // Add our new class for styling

      planetTitle.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevents the click from bubbling up if needed

        // Remove 'clicked' class from all other titles first
        document.querySelectorAll('.planet-title.clicked').forEach(el => {
            el.classList.remove('clicked');
        });

        // Add 'clicked' class to the one we just clicked on
        planetTitle.classList.add('clicked');

        // Determine the correct planet name to send to the API
        const primaryPlanetName = prefix.replace('south', ''); // 'southnode' -> 'node'
        if (planetNames.includes(primaryPlanetName)) {
            window.electronAPI.openScheduleFor(primaryPlanetName);
        } else if (prefix === 'earth') {
            window.electronAPI.openScheduleFor('sun'); // Earth schedule is derived from Sun
        }
      });
    }
  }
}

// ... (The rest of the functions: showNotification, parseTimestamp, formatActivation, etc., remain exactly the same)
function showNotification(prefix, activation) {
    const planetName = prefix.toUpperCase();
    const message = `${planetName} moved to ${activation.gate}, line ${activation.line}`;
    window.electronAPI.showNotification({ title: planetName, body: message });
    const audio = new Audio('./notification.mp3');
    audio.play().catch(err => console.error('Audio playback failed:', err));
}
function parseTimestamp(timestamp) {
  return timestamp ? new Date(timestamp) : null;
}
function formatActivation(activation) {
  if (!activation || !activation.gate || !activation.line) return '-';
  const cleanGate = parseInt(activation.gate.toString().replace(/\D/g, ''), 10);
  const gateLine = `${cleanGate}.${String(activation.line).trim()}:`;
  const dateTime = `${formatDate(activation.timestamp)}, ${formatTime(activation.timestamp)}`;
  return `${gateLine} ${dateTime}`;
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
      hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : '-';
}

updateDisplay(true);
setInterval(() => updateDisplay(false), 1000);
