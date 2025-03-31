const { globalShortcut, clipboard, nativeImage } = require("electron");


function getClipboardContent() {
    const image = clipboard.readImage();
    if (!image.isEmpty()) {
        return { type: "image", data: image, };
    }

    const text = clipboard.readText().trim();
    if (text) {
        return { type: "text", data: text };
    }

    return null;
}


const addToClipboard = (text) => {
    clipboard.writeText(text);
}


module.exports = { getClipboardContent, addToClipboard };