const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
require('dotenv').config(); // Load environment variables

// ---- Config from environment variables ----
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || '1410778738211160104';
const GUILD_ID = process.env.GUILD_ID || '1235781527506255934';

async function handleCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname, '../../commands/tools');

    if (!fs.existsSync(commandsPath)) {
        console.warn(`⚠️ Commands folder not found at ${commandsPath}`);
        return;
    }

    // Load all command files directly inside tools/
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);

        try {
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                console.log(`✅ Loaded command: ${command.data.name}`);
            } else {
                console.warn(`⚠️ Command file missing "data" or "execute": ${filePath}`);
            }
        } catch (err) {
            console.error(`❌ Failed to load command ${filePath}:`, err);
        }
    }

    // Register commands with Discord
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    try {
        console.log('🔄 Registering commands with Discord...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log(`✅ Successfully registered ${commands.length} commands.`);
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

module.exports = { handleCommands };
