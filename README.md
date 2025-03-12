# maya-forecast
Human design transit tracker. This can be used/installed on Windows, Mac and Linux.

Download and install Node.js from the official website https://nodejs.org/en/download. This will also install npm (Node Package Manager) along with it.

Download Maia-Forecast by clicking on "CODE"(colored in green) and download as zip https://github.com/tutucea/maya-forecast .. or simply download all the files individually in the same folder  

"cd maya-forecast-app" ( or whatever folder you downloaded the files) by using a terminal (cmd for windows)

"npm install"

"npm start"

Every time you want to run it, you will need to use the terminal, navigate to the directory (cd into it), and run "npm start". To create your own DMG or EXE, navigate to the directory where all your files are located and run "npm run dist" or "npm run build". This will generate a directory called dist or build—open it, locate your DMG or EXE file, and install it yourself.



This is what it looks like, see here https://ibb.co/4gfF8wz2 and https://ibb.co/N8NB5cL


If the times for the crossings do not align let me know. Before you do so, please check for accuracy https://www.astro.com/swisseph/swetest.htm or https://ssd.jpl.nasa.gov/horizons/.



If you wish to add this application to your startup sequence, there are several methods. This is the approach I recommend: Press Win + R, type shell:startup, and press Enter. This will open the Startup folder. Place the start_electron.bat file into this folder. However, the file requires a minor edit, which can be done using Notepad in Windows. First, replace xxxx with your actual username and verify that the folder path to your application is correct. I have included the start_electron.bat file with the other application files.
