const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const notesFile = path.join(__dirname, '../../data/notes.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editnote')
        .setDescription('Edit a note of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member whose note to edit')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('note_id')
                .setDescription('The ID of the note to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('replacenotemessage')
                .setDescription('The new note message')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const noteId = interaction.options.getInteger('note_id');
        const newMessage = interaction.options.getString('replacenotemessage');

        if (!fs.existsSync(notesFile)) return interaction.reply('No notes found.');

        const notesData = JSON.parse(fs.readFileSync(notesFile));
        const userNotes = notesData[user.id];

        if (!userNotes) return interaction.reply(`${user.tag} has no notes.`);

        const note = userNotes.find(n => n.id === noteId);
        if (!note) return interaction.reply(`Note ID ${noteId} not found.`);

        note.note = newMessage;
        note.timestamp = new Date().toISOString(); // Update timestamp in UTC

        fs.writeFileSync(notesFile, JSON.stringify(notesData, null, 2));

        await interaction.reply(`✅ Note ID ${noteId} updated for ${user.tag}.`);
    }
};
