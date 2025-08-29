const fs = require('fs');
const notesPath = './Bot/src/data/notes.json';
const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ---- Safe JSON read/write helpers ----
function safeReadNotes() {
    try {
        if (fs.existsSync(notesPath)) {
            const data = fs.readFileSync(notesPath, 'utf8');
            return JSON.parse(data || '{}');
        }
    } catch (err) {
        console.error("❌ Failed to read notes.json:", err);
    }
    return {};
}

function safeWriteNotes(notes) {
    try {
        fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
    } catch (err) {
        console.error("❌ Failed to write notes.json:", err);
    }
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // ----- Slash commands -----
            if (interaction.isCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                try {
                    await command.execute(interaction, client);
                } catch (err) {
                    console.error(`❌ Error running command ${interaction.commandName}:`, err);

                    // Avoid double replies
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: "⚠️ Something went wrong.",
                            ephemeral: true
                        }).catch(() => {});
                    } else {
                        await interaction.followUp({
                            content: "⚠️ Something went wrong.",
                            ephemeral: true
                        }).catch(() => {});
                    }
                }
                return;
            }

            // ----- Note modal submission -----
            if (interaction.isModalSubmit() && interaction.customId.startsWith('noteadd_')) {
                const targetId = interaction.customId.split('_')[1];
                const noteText = interaction.fields.getTextInputValue('note_text');

                let notes = safeReadNotes();
                if (!notes[targetId]) notes[targetId] = [];

                notes[targetId].push({
                    note: noteText,
                    author: interaction.user.tag,
                    date: new Date().toUTCString()
                });

                safeWriteNotes(notes);

                if (!interaction.replied && !interaction.deferred) {
                    return interaction.reply({ content: `✅ Note added for <@${targetId}>`, ephemeral: true });
                } else {
                    return interaction.followUp({ content: `✅ Note added for <@${targetId}>`, ephemeral: true });
                }
            }

            // ----- Delete note select menu -----
            if (interaction.isStringSelectMenu() && interaction.customId.startsWith('delnote_')) {
                const targetId = interaction.customId.split('_')[1];
                const selectedIndex = parseInt(interaction.values[0]);

                let notesData = safeReadNotes();
                if (!notesData[targetId] || !notesData[targetId][selectedIndex]) {
                    return interaction.update({ content: '❌ Note not found.', components: [] });
                }

                notesData[targetId].splice(selectedIndex, 1);
                if (notesData[targetId].length === 0) delete notesData[targetId];

                safeWriteNotes(notesData);
                return interaction.update({ content: '✅ Note deleted.', components: [] });
            }

            // ----- Button interactions -----
            if (interaction.isButton()) {
                const id = interaction.customId.split('_')[1];

                if (interaction.customId.startsWith('confirmDelChan_')) {
                    const vc = interaction.guild.channels.cache.get(id);
                    if (vc) await vc.delete().catch(() => {});
                    return interaction.update({ content: '✅ Voice channel deleted.', components: [] });
                }

                if (interaction.customId.startsWith('confirmDelText_')) {
                    const ch = interaction.guild.channels.cache.get(id);
                    if (ch) await ch.delete().catch(() => {});
                    return interaction.update({ content: '✅ Text channel deleted.', components: [] });
                }

                if (interaction.customId === 'declineDel' || interaction.customId === 'declineText') {
                    return interaction.update({ content: '❌ Action cancelled.', components: [] });
                }
            }

        } catch (err) {
            console.error("❌ Uncaught error in interactionCreate:", err);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "⚠️ Something went wrong.",
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.followUp({
                    content: "⚠️ Something went wrong.",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
};
