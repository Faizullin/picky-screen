const { BrowserWindow, screen } = require("electron");
const path = require('node:path')

const windows = {}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { height } = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    width: 100,
    height: 50,
    x: -200,
    y: height - 90,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.hide();

  if (process.env.NODE_ENV === "development" || process.env.DEBUG) {
    mainWindow.webContents.openDevTools();
  }

  global.mainWindow = mainWindow;
  setTimeout(() => {
    mainWindow.webContents.send("update-content", {
      type: "single-message",
      data: {
        username: "johndoe",
        content: "Hello, World!",
      },
    });
  }, 2000);

  return mainWindow;
}


const window_sizes = { width: 100, height: 50 }

function toggleWindow(name = "main") {
  const win = mainWindow;
  if (win.isVisible()) {
    win.hide();
  } else {
    const { height } = screen.getPrimaryDisplay().bounds;
    win.setBounds({ x: 10, y: height - 110, ...window_sizes });
    win.setAlwaysOnTop(true);
    win.focus();
    win.show();
  }
}
function updateOverlayText(message_obj) {
  mainWindow.webContents.send('update-content', {
    "type": "single-message",
    "data": message_obj,
  });
}

module.exports = { createWindow, toggleWindow, updateOverlayText, };
