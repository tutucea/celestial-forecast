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
const planetDisplayNames = {
  'moon': 'Moon',
  'sun': 'Sun',
  'nodes': 'North Node',
  'southnode': 'South Node',
  'mercury': 'Mercury',
  'venus': 'Venus',
  'mars': 'Mars',
  'jupiter': 'Jupiter',
  'saturn': 'Saturn',
  'uranus': 'Uranus',
  'neptune': 'Neptune',
  'pluto': 'Pluto',
  'chiron': 'Chiron',
  'earth': 'Earth'
};
let isCountdownHidden = false; // Global flag to track toggle state

function findOppositeGate(gate) {
  const numericGate = parseInt(gate.toString().replace(/\D/g, ''), 10);
  return oppositeGates[numericGate] || null;
}

async function updateDisplay(isFirstRun = false) {
  try {
    const now = new Date();
    document.getElementById('datetime').textContent = formatTime(now);

    const schedulePromises = planetNames.map(p => {
      const method = `get${p.charAt(0).toUpperCase() + p.slice(1)}Schedule`;
      if (!window.electronAPI[method]) {
        console.error(`renderer1.js: electronAPI.${method} is not defined`);
        return Promise.resolve([]);
      }
      return window.electronAPI[method]().catch(err => {
        console.error(`renderer1.js: Error fetching ${p} schedule:`, err);
        return [];
      });
    });
    const schedules = await Promise.all(schedulePromises);
    const scheduleMap = {};
    planetNames.forEach((planet, index) => {
      scheduleMap[planet] = schedules[index] || [];
    });

    // Process main planets
    planetNames.forEach(planet => {
      processSchedule(scheduleMap[planet], planet, now, null, isFirstRun);
    });

    // Process Earth based on Sun's schedule
    const sunSchedule = scheduleMap['sun'];
    if (sunSchedule && sunSchedule.length > 0) {
      const earthSchedule = sunSchedule
        .map(activation => ({
          ...activation,
          gate: findOppositeGate(activation.gate)
        }))
        .filter(activation => activation.gate !== null);
      processSchedule(earthSchedule, 'earth', now, sunSchedule, isFirstRun);
    } else {
      console.warn('renderer1.js: No sun schedule available for earth');
    }
    
    // Process South Node based on North Node's schedule
    const nodesSchedule = scheduleMap['nodes'];
    if (nodesSchedule && nodesSchedule.length > 0) {
      const southNodeSchedule = nodesSchedule
        .map(activation => ({
          ...activation,
          gate: findOppositeGate(activation.gate)
        }))
        .filter(activation => activation.gate !== null);
      processSchedule(southNodeSchedule, 'southnode', now, nodesSchedule, isFirstRun);
    } else {
      console.warn('renderer1.js: No nodes schedule available for southnode');
    }

  } catch (error) {
    console.error('renderer1.js: Error during display update:', error);
  }
}

function processSchedule(schedule, prefix, now, syncedSchedule = null, isFirstRun = false) {
  const planetContainer = document.getElementById(prefix);
  if (!planetContainer) {
    console.warn(`renderer1.js: No container found for ${prefix}`);
    return;
  }

  const currentElement = document.getElementById(`${prefix}-current-activation`);
  const nextElement = document.getElementById(`${prefix}-next-activation`);
  const countdownElement = document.getElementById(`${prefix}-countdown-timer`);
  const countdownTextElement = countdownElement.querySelector('.countdown-text');
  const percentageElement = countdownElement.querySelector('.percentage');
  const planetNameElement = document.getElementById(`${prefix}-planet-name`);

  if (!currentElement || !nextElement || !countdownElement || !countdownTextElement || !percentageElement || !planetNameElement) {
    console.error(`renderer1.js: Missing DOM elements for ${prefix}`);
    return;
  }

  if (!schedule || schedule.length === 0) {
    currentElement.textContent = 'No Data';
    nextElement.textContent = '-';
    countdownTextElement.textContent = '-';
    percentageElement.textContent = '';
    planetNameElement.classList.add('hidden-planet-name');
    percentageElement.classList.add('hidden-percentage');
    return;
  }

  let currentActivation = null,
      nextActivation = null;
  for (const activation of schedule) {
    const activationTime = parseTimestamp(activation.timestamp);
    if (!activationTime) {
      continue;
    }
    if (activationTime <= now) {
      currentActivation = activation;
    } else {
      nextActivation = activation;
      break;
    }
  }

  const activationKey = currentActivation ? `${currentActivation.gate}-${currentActivation.line}-${currentActivation.timestamp}` : null;
  if (currentActivation) {
    if (isFirstRun) {
      lastActivations[prefix] = activationKey;
    } else if (lastActivations[prefix] !== activationKey) {
      lastActivations[prefix] = activationKey;
      showNotification(prefix, currentActivation);
    }
  }

  currentElement.textContent = formatActivation(currentActivation);
  nextElement.textContent = formatActivation(nextActivation);

  const countdownSource = syncedSchedule || schedule;
  let countdownNext = null;
  for (const activation of countdownSource) {
    if (parseTimestamp(activation.timestamp) > now) {
      countdownNext = activation;
      break;
    }
  }

  countdownTextElement.textContent = formatCountdown(countdownNext, now);
  
  let percentage = '';
  if (currentActivation && countdownNext) {
    const currentTime = parseTimestamp(currentActivation.timestamp);
    const nextTime = parseTimestamp(countdownNext.timestamp);

    if (currentTime && nextTime) {
      // *** START: REVISED PERCENTAGE LOGIC ***
      const timeSinceNext = now.getTime() - nextTime.getTime();
      const totalDuration = nextTime.getTime() - currentTime.getTime();

      if (timeSinceNext >= 0) {
        // The activation time has passed.
        if (timeSinceNext < 1000) {
          // It happened within the last second, show 100% for this one update cycle.
          percentage = '<span style="color: rgb(255, 0, 0);">100%</span>';
        } else {
          // It's been over a second, reset to 0 for the new cycle.
          percentage = '0%';
        }
      } else if (totalDuration > 0) {
        // The activation is still in the future.
        const elapsedDuration = now.getTime() - currentTime.getTime();
        // Use Math.floor to prevent showing 100% prematurely. It will show up to 99%.
        const percent = Math.floor((elapsedDuration / totalDuration) * 100);

        // Improved Green -> Yellow -> Red color gradient
        let color;
        if (percent < 50) {
          // Green to Yellow: Increase Red component
          const r = Math.round(5.1 * percent); // 5.1 * 50 = 255
          color = `rgb(${r}, 255, 0)`;
        } else {
          // Yellow to Red: Decrease Green component
          const g = Math.round(255 - (5.1 * (percent - 50)));
          color = `rgb(255, ${g}, 0)`;
        }
        percentage = `<span style="color: ${color};">${Math.max(0, percent)}%</span>`; // Math.max to prevent weird negative values
      } else {
        percentage = '0%';
      }
      // *** END: REVISED PERCENTAGE LOGIC ***
    }
  } else {
    percentage = '0%';
  }
  percentageElement.innerHTML = percentage;

  // This logic correctly applies classes based on the global state
  if (isCountdownHidden) {
    countdownTextElement.classList.add('hidden-countdown');
    planetNameElement.classList.remove('hidden-planet-name');
    percentageElement.classList.remove('hidden-percentage');
  } else {
    countdownTextElement.classList.remove('hidden-countdown');
    planetNameElement.classList.add('hidden-planet-name');
    percentageElement.classList.add('hidden-percentage');
  }
}

function showNotification(prefix, activation) {
  const planetName = planetDisplayNames[prefix] || prefix.toUpperCase();
  const message = `${planetName} moved to ${activation.gate}, line ${activation.line}`;
  console.log(`renderer1.js: Showing notification: ${planetName} - ${message}`);
  window.electronAPI.showNotification({
    title: planetName,
    body: message
  });
  const audio = new Audio('./notification.mp3');
  audio.play().catch(err => console.error('renderer1.js: Audio playback failed:', err));
}

function parseTimestamp(timestamp) {
  const date = timestamp ? new Date(timestamp) : null;
  if (date && isNaN(date.getTime())) {
    console.warn('renderer1.js: Invalid date parsed from timestamp:', timestamp);
    return null;
  }
  return date;
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
  return days > 0 ?
    `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` :
    `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(timestamp) {
  const date = parseTimestamp(timestamp);
  return date ?
    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}` :
    '-';
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

document.body.addEventListener('click', (event) => {
  const targetPlanet = event.target.closest('.planet-title');
  if (targetPlanet) {
    event.stopPropagation();
    const prefix = targetPlanet.parentElement.parentElement.id;
    let primaryPlanetName = prefix.replace('south', '');
    if (prefix === 'earth') {
      primaryPlanetName = 'sun';
    }
    console.log(`renderer1.js: Opening schedule for ${primaryPlanetName}`);
    if (planetNames.includes(primaryPlanetName) && window.electronAPI?.openScheduleFor) {
      window.electronAPI.openScheduleFor(primaryPlanetName);
    } else {
      console.error(`renderer1.js: Cannot open schedule for ${primaryPlanetName} or API not available`);
    }
    targetPlanet.classList.add('clicked');
    setTimeout(() => {
      targetPlanet.classList.remove('clicked');
    }, 300);
    return;
  }

  const targetCountdown = event.target.closest('.clickable-countdown');
  if (targetCountdown) {
    const gateNumber = targetCountdown.dataset.currentGate;
    if (gateNumber && window.electronAPI?.openGateInfoPopup) {
      console.log(`renderer1.js: Countdown clicked. Requesting info for Gate: ${gateNumber}`);
      window.electronAPI.openGateInfoPopup(gateNumber);
    } else {
      console.error("renderer1.js: Could not get gate number from countdown or API is not available.");
    }
    return;
  }

  if (event.target.id === 'toggle-countdown-btn') {
    isCountdownHidden = !isCountdownHidden; // Toggle the global flag

    // Apply the correct classes to all relevant elements based on the new state
    document.querySelectorAll('.countdown-text').forEach(ct => ct.classList.toggle('hidden-countdown', isCountdownHidden));
    document.querySelectorAll('.planet-name').forEach(pn => pn.classList.toggle('hidden-planet-name', !isCountdownHidden));
    document.querySelectorAll('.percentage').forEach(p => p.classList.toggle('hidden-percentage', !isCountdownHidden));
    
    // *** FIXED: Correctly set button text based on the *new* state ***
    event.target.textContent = isCountdownHidden ? 'Show All Countdowns' : 'Hide All Countdowns';
    return;
  }
});

updateDisplay(true);
setInterval(() => updateDisplay(false), 1000);
