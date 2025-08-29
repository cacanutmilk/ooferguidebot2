const { Events } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log(`Client ID: ${CLIENT_ID}`);
        console.log(`Guild ID: ${GUILD_ID}`);
    },
};
