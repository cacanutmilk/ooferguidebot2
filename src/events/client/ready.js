const { Events } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID || '1410778738211160104';
const GUILD_ID = process.env.GUILD_ID || '1235781527506255934';

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log(`Client ID: ${CLIENT_ID}`);
        console.log(`Guild ID: ${GUILD_ID}`);
    },
};

