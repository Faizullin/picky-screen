const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateContent: (callback) => ipcRenderer.on('update-content', (_event, value) => {
    console.log("onUpdateContent", _event, value);
    callback(value);
  }),
})

// // Listen for left/right arrow keys for navigation
// document.addEventListener("keydown", (event) => {
//   if (event.key === "ArrowLeft") {
//     messageIndex = Math.max(0, messageIndex - 1);
//     ipcRenderer.send("request-message", messageIndex);
//   } else if (event.key === "ArrowRight") {
//     messageIndex++;
//     ipcRenderer.send("request-message", messageIndex);
//   }
// });
