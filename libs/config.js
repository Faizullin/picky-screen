const config = {
    tgBotEnabled: process.env.TG_BOT_ENABLED === "true",
    aiApiEnabled: process.env.AI_API_ENABLED === "true",
    additionalPrompt: `This is lesson on algrothms. Quiz is mutiple choice or other inputs. IN case of multiple choice, in short answers just list theme. Even when long text just show order\n`,
}

module.exports = {config}