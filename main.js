// ---- Imports ----
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');
const { handleCommands } = require('./src/functions/handlers/handleCommands');
const { handleEvents } = require('./src/functions/handlers/handleEvents');
require('dotenv').config(); // <-- Load .env variables

// ---- Config from environment variables ----
const DISCORD_TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || '1410778738211160104';
const GUILD_ID = process.env.GUILD_ID || '1235781527506255934';
const LOG_CHANNELID = process.env.LOG_CHANNELID || '1407323966128783360';
const LOG_USERID = process.env.LOG_USERID || '941309399341887529';
const PORT = process.env.PORT || 10000;

// ---- Express KeepAlive Server ----
const app = express();
let lastPing = 0;

app.get('/', (req, res) => {
    const now = Date.now();
    if (now - lastPing > 60 * 1000) {
        console.log(`[KeepAlive] Ping received at ${new Date().toLocaleString()}`);
        lastPing = now;
    }
    res.send('Bot is alive..!');
});

app.listen(PORT, '0.0.0.0', () => console.log(`[KeepAlive] Server running on port ${PORT}`));

// ---- Discord Client Setup ----
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildBans,
    ]
});

client.commands = new Collection();

// ---- Logger to Discord ----
async function logToChannel(message) {
    try {
        const channel = await client.channels.fetch(LOG_CHANNELID);
        const userMention = `<@${LOG_USERID}>`;
        if (channel) await channel.send(`${userMention} ${message}`);
    } catch (err) {
        console.error("❌ Failed to send log to channel:", err);
    }
}

// ---- Safe Shutdown ----
async function safeShutdown(reason, error) {
    console.error("🛑 Safe shutdown triggered:", reason, error || "");
    try {
        await logToChannel(`⚠️ Bot shutting down due to **${reason}**\n\`\`\`${error?.stack || error}\`\`\``);
    } catch (err) {
        console.error("❌ Failed to log shutdown to channel:", err);
    }
    if (client && client.destroy) await client.destroy();
    process.exit(1);
}

// ---- Global Error Handlers ----
process.on("unhandledRejection", (reason) => safeShutdown("unhandledRejection", reason));
process.on("uncaughtException", (err) => safeShutdown("uncaughtException", err));
process.on("uncaughtExceptionMonitor", (err) => console.error("⚠️ Uncaught Exception Monitor:", err));

// ---- Client Events ----
client.on("error", (error) => {
    console.error("❌ Client error:", error);
    logToChannel(`❌ Client error: \`${error.message}\``);
});

client.on("shardError", (error) => {
    console.error("🔴 Shard error:", error);
    logToChannel(`🔴 Shard error: \`${error.message}\``);
});

client.on("warn", (info) => {
    console.warn("⚠️ Warning:", info);
    logToChannel(`⚠️ Warning: \`${info}\``);
});

client.once("ready", () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    logToChannel(`✅ Bot is online as **${client.user.tag}**`);
});

// ---- Load Commands & Events ----
(async () => {
    try {
        console.log("🔄 Loading commands...");
        await handleCommands(client);

        console.log("🔄 Loading events...");
        await handleEvents(client);
    } catch (err) {
        console.error("❌ Failed to load commands or events:", err);
        safeShutdown("Failed to load commands/events", err);
    }
})();

// ---- Login ----
(async () => {
    try {
        console.log("🟡 Attempting to login...");
        console.log("DEBUG - Token exists:", !!DISCORD_TOKEN);
        console.log("DEBUG - Token length:", DISCORD_TOKEN ? DISCORD_TOKEN.length : 0);
        await client.login(DISCORD_TOKEN);
    } catch (error) {
        console.error("❌ Login failed:", error);
        safeShutdown("Login failed", error);
    }
})();

// ---- Exit Hooks ----
process.on("beforeExit", (code) => console.warn(`⚠️ Bot is about to exit with code: ${code}`));
process.on("exit", (code) => console.warn(`⚠️ Bot exited with code: ${code}`));
