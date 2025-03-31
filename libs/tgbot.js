const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { getSreenshot } = require("./screenshot");
const fs = require("fs");
const { addToClipboard } = require("./clipboard");
const { saveMessage, DB_FILE } = require("./storage");
const { updateOverlayText } = require("./windowManager");
const { Message } = require("./models");
const { config } = require("./config");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Telegram Bot Token
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Telegram Channel ID




if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("❌ Missing Telegram Bot Token or Chat ID.");
    process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);


bot.command("chatid", async (ctx) => {
    const chatId = ctx.message.chat.id;
    await ctx.reply(`📡 Your Chat ID: ${chatId}`);
});


bot.command("quit", async (ctx) => {
    await ctx.reply("Пошел на х*й!!!!");
    // await ctx.telegram.leaveChat(ctx.message.chat.id);
});

let screenshotMessages = new Map();

bot.command("show", async (ctx) => {
    console.log("/show ocmmmand trigger")
    if (ctx.message.reply_to_message) {
        const referencedMessage = ctx.message.reply_to_message;
        const canReplyToScreenshot = true // screenshotMessages.has(referencedMessage.message_id);

        if (canReplyToScreenshot) {
            // const value = screenshotMessages.get(referencedMessage.message_id);
            const save_text = ctx.message.text.substring(5).trim();
            let new_message_obj = new Message(ctx.message.from.username, save_text);
            new_message_obj = saveMessage(new_message_obj);
            updateOverlayText(new_message_obj)
            addToClipboard(save_text);
            await ctx.reply("📡 Displayed.");
        } else {
            await ctx.reply("⚠️ You must reply to a message.");
        }
    } else {
        await ctx.reply("⚠️ Use `/show` while replying to a bot message.");
    }
});

const takeScreenshotAndSend = async (defaultImgPath = null) => {
    try {
        let imgPath = (defaultImgPath !== null) ? defaultImgPath : await getSreenshot();
        if (!fs.existsSync(imgPath)) {
            console.error("❌ Image file does not exist:", imgPath);
            return;
        }
        if (!imgPath) return;
        const sentMessage = await bot.telegram.sendPhoto(TELEGRAM_CHAT_ID, {
            source: imgPath,
        });
        screenshotMessages.set(sentMessage.message_id, imgPath);
    }
    catch (error) {
        console.error("❌ Screenshot failed:", error);
    }
}


bot.command("start", async (ctx) => {
    const helpMessage = `📡 Welcome to the Bot! Here are the available commands:

⚙️ *Commands:*
/start - Start the bot
/chatid - Get your Chat ID
/quit - Leave the chat
/show - Show the overlay text

📸 *Replugging Image Instructions:*
1. Use "/show" while replying to a screenshot message.
2. Ensure the bot has access to send and receive messages.

⌨️ *Keyboard Shortcuts:*
- Ctrl+Alt+H: Toggle Window
- Ctrl+Alt+S: Take Screenshot
- Ctrl+Alt+Right: Show Next Message
- Ctrl+Alt+Left: Show Previous Message
- Ctrl+Alt+R: Show Last Message
- Ctrl+Alt+Q: Stop Bot and Quit

Enjoy! 🚀`;
    await ctx.replyWithMarkdown(helpMessage);
});


const stopBot = async () => {
    if (config.tgBotEnabled) {
        await bot.telegram.sendMessage(TELEGRAM_CHAT_ID, "📡 Bot stopped.");
        bot.stop();
    }
}


bot.telegram.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "chatid", description: "Get your Chat ID" },
    { command: "quit", description: "Leave the chat" },
    { command: "show", description: "Show the overlay text" },
]);

if (config.tgBotEnabled) {
    bot.launch().then(() => {
        console.log("📡 Bot is running...");
    });
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));

    bot.telegram.sendMessage(TELEGRAM_CHAT_ID, `📡 Bot started`);
}


module.exports = { bot, TELEGRAM_CHAT_ID, takeScreenshotAndSend, stopBot };
