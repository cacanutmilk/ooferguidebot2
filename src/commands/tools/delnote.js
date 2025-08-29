const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const notesFile = path.join(__dirname, '../../data/notes.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delnote')
        .setDescription('Delete a note of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member whose note to delete')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('note_id')
                .setDescription('The ID of the note to delete')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const noteId = interaction.options.getInteger('note_id');

        if (!fs.existsSync(notesFile)) return interaction.reply('No notes found.');

        const notesData = JSON.parse(fs.readFileSync(notesFile));
        const userNotes = notesData[user.id];

        if (!userNotes) return interaction.reply(`${user.tag} has no notes.`);

        const index = userNotes.findIndex(n => n.id === noteId);
        if (index === -1) return interaction.reply(`Note ID ${noteId} not found.`);

        userNotes.splice(index, 1);
        notesData[user.id] = userNotes;

        fs.writeFileSync(notesFile, JSON.stringify(notesData, null, 2));

        await interaction.reply(`✅ Note ID ${noteId} deleted for ${user.tag}.`);
    }
};
