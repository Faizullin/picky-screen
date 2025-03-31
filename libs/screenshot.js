const screenshot = require("screenshot-desktop");


async function getSreenshot() {
    try {
        const imgPath = "tmp-screenshot.jpg";
        await screenshot({ filename: imgPath });

        return imgPath;
    } catch (error) {
        console.error("❌ Screenshot failed:", error);
        return null;
    }
}


module.exports = { getSreenshot };
