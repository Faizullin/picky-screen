require("dotenv").config({ override: true });
const { app } = require("electron");
const { createWindow } = require("./libs/windowManager");
const { setupShortcuts } = require("./libs/shortcuts");
const { loadMessages } = require("./libs/storage");
require("./libs/tgbot");

app.whenReady().then(() => {
  const mainWindow = createWindow();
  setupShortcuts(mainWindow);
  loadMessages();
  console.log("App is running...");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!global.mainWindow) {
    createWindow();
  }
});

