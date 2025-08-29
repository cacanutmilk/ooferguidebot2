const fs = require('fs');
const path = require('path');

function handleEvents(client) {
    const eventsPath = path.join(__dirname, '../../events/client');

    if (!fs.existsSync(eventsPath)) {
        console.warn(`⚠️ Events folder not found at ${eventsPath}`);
        return;
    }

    // Load all event files directly inside client/
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        try {
            const event = require(filePath);

            // Validate event
            if (!event.name || typeof event.execute !== 'function') {
                console.warn(`⚠️ Invalid event file: ${filePath} (missing name or execute function)`);
                continue;
            }

            // Pass Discord arguments first, then client as last argument
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            console.log(`✅ Loaded event: ${event.name}`);
        } catch (err) {
            console.error(`❌ Failed to load event ${filePath}:`, err);
        }
    }
}

module.exports = { handleEvents };
