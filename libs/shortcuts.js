const { globalShortcut, clipboard } = require("electron");
const { toggleWindow } = require("./windowManager");
const { takeScreenshotAndSend } = require("./tgbot");
const { getMessages, saveMessage } = require("./storage");
const { app } = require("electron");
const { stopBot, bot, TELEGRAM_CHAT_ID } = require("./tgbot");
const { config } = require("./config");
const { sendScreenshotToAI, sendTextToAI } = require("./aiApi")
const { getSreenshot } = require("./screenshot");
const { Message } = require("./models");
const { getClipboardContent, addToClipboard } = require("./clipboard");
const fs = require("fs");

let currentPage = 1;


let currentAiModel = "gpt-4o"; // or "o1"

function setupShortcuts(mainWindow) {
  globalShortcut.register("Ctrl+Alt+H", () => {
    toggleWindow("main");
  });

  const processAiResponse = (response, aiModel) => {
    let tmp_response = response.trim();
    console.log(`[${aiModel}]value:`, tmp_response);
    const user = aiModel;
    const new_message = new Message(
      `${user}`,
      `(${user}): ${tmp_response}`
    );
    addToClipboard(new_message.content);
    saveMessage(new_message);
  }


  globalShortcut.register("Ctrl+Alt+V", async () => {
    const content = getClipboardContent();
    console.log("Clipboard type: ", content.type);
    if (!content) {
      console.log("Clipboard is empty.");
      return;
    }


    if (content.type === "image") {
      console.log("Detected image in clipboard, sending to AI...");

      const imgPath = "tmp-screenshot.jpg";
      fs.writeFileSync(imgPath, content.data.toJPEG(100)); // Save as JPEG format
      // // Convert base64 image to a file
      // const imgBuffer = Buffer.from(content.data.replace(/^data:image\/\w+;base64,/, ""), "base64");
      // const tempPath = path.join(app.getPath("temp"), `clipboard_image.png`);
      // fs.writeFileSync(tempPath, imgBuffer);

      try {
        if (config.aiApiEnabled) {
          const aiModelStr = (' ' + currentAiModel).slice(1);
          const response = await sendScreenshotToAI(imgPath, aiModelStr);
          processAiResponse(response, aiModelStr);
        }
      } catch (error) {
        console.error("Error sending clipboard image to AI:", error.message);
      }
    } else if (content.type === "text") {
      console.log("Detected text in clipboard, sending to AI...", content.data);
      const use_tg_bot = config.tgBotEnabled && (!content.data.endsWith("42"));
      const use_ai_api = config.aiApiEnabled && (!content.data.endsWith("_"));
      if (use_tg_bot) {
        bot.telegram.sendMessage(TELEGRAM_CHAT_ID, content.data);
      }
      try {
        if (use_ai_api) {
          const aiModelStr = (' ' + currentAiModel).slice(1);
          const response = await sendTextToAI(content.data, aiModelStr);
          processAiResponse(response, aiModelStr);
        }
      } catch (error) {
        console.error("Error sending clipboard text to AI:", error.message);
        const error_msg = new Message(`${user}`, `(${user}): [Error] ${error.message}`);
        saveMessage(error_msg);
      }
    }
  });

  globalShortcut.register("Ctrl+Alt+S", async () => {
    console.log("Taking screenshot...");
    const imgPath = await getSreenshot();
    if (config.tgBotEnabled) {
      await takeScreenshotAndSend(imgPath);
    }
    if (config.aiApiEnabled) {
      try {
        const aiModelStr = (' ' + currentAiModel).slice(1);
        const response = await sendScreenshotToAI(imgPath, aiModelStr);
        processAiResponse(response, aiModelStr);
      } catch (e) {
        console.error("Error sending screenshot to AI:", e.message);
      }
    }
  });

  globalShortcut.register("Ctrl+Alt+Right", () => {
    // get next message and send to renderer
    const messages = getMessages(1, null);
    if (currentPage < messages.length) {
      currentPage++;
    }
    const nextMessage = messages[currentPage - 1];
    mainWindow.webContents.send("update-content", {
      type: "single-message",
      data: nextMessage,
    });

  });

  globalShortcut.register("Ctrl+Alt+Left", () => {
    const messages = getMessages(1, null);
    if (currentPage > 1) {
      currentPage--;
    }
    const prevMessage = messages[currentPage - 1];
    mainWindow.webContents.send("update-content", {
      type: "single-message",
      data: prevMessage,
    });

  });

  globalShortcut.register("Ctrl+Alt+R", () => {
    // get last message and send to renderer
    const messages = getMessages(1, null);
    currentPage = messages.length;
    const lastMessage = messages[currentPage - 1];
    mainWindow.webContents.send("update-content", {
      type: "single-message",
      data: lastMessage,
    });
  });

  globalShortcut.register("Ctrl+Alt+Q", () => {
    stopBot().then(() => {
      app.quit();
    });
  })

  globalShortcut.register("Ctrl+Alt+M", () => {
    toggleWindow("config");
  });

  const setCurrentAiModel = (model) => {
    currentAiModel = model;
    console.log("AI model set to:", model);
  };

  globalShortcut.register("Ctrl+Alt+1", () => {
    setCurrentAiModel("gpt-4o");
  });

  globalShortcut.register("Ctrl+Alt+2", () => {
    setCurrentAiModel("o1");
  });

  globalShortcut.register("Ctrl+Alt+3", () => {
    setCurrentAiModel("claude-3-7-sonnet-20250219");
  });

  console.log("Shortcuts registered.");
}

module.exports = { setupShortcuts };
