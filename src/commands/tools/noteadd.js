const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const notesFile = path.join(__dirname, '../../data/notes.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('noteadd')
        .setDescription('Add a note for a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to add a note for')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('note')
                .setDescription('The note content')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const noteContent = interaction.options.getString('note');

        let notesData = {};
        if (fs.existsSync(notesFile)) {
            notesData = JSON.parse(fs.readFileSync(notesFile));
        }

        if (!notesData[user.id]) notesData[user.id] = [];
        const noteId = notesData[user.id].length > 0
            ? notesData[user.id][notesData[user.id].length - 1].id + 1
            : 1;

        notesData[user.id].push({
            id: noteId,
            note: noteContent,
            timestamp: new Date().toISOString() // UTC automatically
        });

        fs.writeFileSync(notesFile, JSON.stringify(notesData, null, 2));

        await interaction.reply(`✅ Note added for ${user.tag} (ID: ${noteId})`);
    }
};
