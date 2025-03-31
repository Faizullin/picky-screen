const fs = require("fs");
const path = require("path");


const { app } = require("electron");

// const DB_FILE = path.join(dataPath, 'messages.json');
const DB_FILE = app.getAppPath().replace("app.asar", "messages.json");

const arr = [];

const loadMessages = () => {
    // if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
    // return JSON.parse(fs.readFileSync(DB_FILE));
    return arr;
};

const saveMessage = (message) => {
    const messages = loadMessages();
    messages.push(message);
    // fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2));
    return message;
};

const getMessages = (page = 1, pageSize = 10) => {
    const messages = loadMessages();
    if (pageSize === null) {
        return messages;
    }
    return messages.slice((page - 1) * pageSize, page * pageSize);
};

const getMessageById = (id) => {
    const messages = loadMessages();
    return messages.find((msg) => msg.id === id);
};



module.exports = { saveMessage, getMessages, getMessageById, loadMessages, DB_FILE };