# Celestial-Forecast: Human Design Transits Tracker

**Celestial-Forecast** is an open-source Electron app for tracking transits in the Human Design System. Monitor planetary movements and gate activations with real-time notifications for line changes. Perfect for Human Design enthusiasts, astrologers, and cosmic explorers, this app runs on Windows, macOS, and Linux.

Celestial-Forecast Screenshot -  https://ibb.co/RGLbVTq2  
*Track Human Design transits with an intuitive interface.*

## ✨ Features
- **Real-Time Transit Tracking**: Stay updated on Human Design gate and line transits with precise timing.
- **System Notifications**: Receive alerts when lines change, with customizable notification sounds. See example -- https://ibb.co/V0NDL51g.  
- **Cross-Platform**: Compatible with Windows, macOS, and Linux.
- **Open-Source**: Free to use, modify, and contribute to under the [MIT License](#license).
- **Custom Builds**: Generate DMG or EXE installers for easy distribution.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Install Node.js (chose a prebuilt version for your system, includes npm) from [nodejs.org](https://nodejs.org/en/download).

### Installation
1. **Download Celestial-Forecast**:
   - Click the green "CODE" button on the [GitHub repository](https://github.com/tutucea/maya-forecast) and select "Download ZIP". Unzip it.
   - Or clone the repository:  
     ```bash
     git clone https://github.com/tutucea/maya-forecast.git
     ```
2. **Navigate to the Project Folder**:
   - Open a terminal (or Command Prompt on Windows) and navigate to the project directory:  
     ```bash
     cd celestial-forecast
     ```
     *Note: Replace `celestial-forecast` with the actual folder name if different.*

3. **Install Dependencies**:
   - Run the following command to install required packages (ignore any deprecated warnings):  
     ```bash
     npm install
     ```

4. **Start the Application**:
   - Launch the app with:  
     ```bash
     npm start
     ```

5. **Optional: Build a DMG/EXE**:
   - To create an installer, run:  
     ```bash
     npm run dist
     ```
     or
     ```bash
     npm run build
     ```
   - Find the DMG (macOS) or EXE (Windows) in the `dist` or `build` folder and install it.
  
6. ##  Detailed Planetary Schedule

This application features a powerful, on-demand schedule viewer that provides in-depth transit data for each celestial body.

### How it Works
Simply click on any planet's symbol (e.g., ☉, ☽) in the main window to open a dedicated popup with its full schedule.

### Key Features
*   **On-Demand Data:** Instantly access a detailed data table for any planet without cluttering the main view.
*   **Dynamic Timezone Conversion:** The schedule popup includes a robust timezone switcher. Users can instantly convert all timestamps to:
    *   Their own **local time**, which is detected automatically.
    *   **UTC** (Coordinated Universal Time).
    *   A customizable list of major world timezones.
*   **Comprehensive Information:** The table displays crucial data points for each transit, including Gate, Line, the exact Timestamp, Longitude, and Motion.
*   **User-Friendly Interface:** The popup window includes controls to increase or decrease the text size for better readability.
*   https://ibb.co/tPp9TCn9
*   do this if you only updating your files for the timezones, if you install everything there is no need
*   ```bash
    npm install luxon
    ```

### Linux (Ubuntu) Users
If you see a `chrome-sandbox` error (e.g., [this error](https://pastebin.com/8kZ6Uwnp)), run this before `npm start`:
```bash
sudo chown root chrome-sandbox && sudo chmod 4755 chrome-sandbox
```
### Accuracy 
Please let me know if you see any discrepancies but before check this [Swiss Ephemeris - Swetest](https://www.astro.com/swisseph/swetest.htm)  or 
[JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)
### Notes
If you wish to change the notification sound, create a folder named "sounds" inside the directory where all the files are located, and place a file named notification.mp3 inside it.
You can also use your own notification sound—just make sure to name it notification.mp3.


Every time you want to run the program, open a terminal and navigate to the project directory:
```bash
cd celestial-forecast/
npm start
```

I do update the look once in a while also I will update the dates and times for all the crossings when they are about to expire.

Buy me a beer [via PayPal](https://paypal.me/EJohnson275)





