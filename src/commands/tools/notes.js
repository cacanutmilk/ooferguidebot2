const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const notesFile = path.join(__dirname, '../../data/notes.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notes')
        .setDescription('View all notes of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member whose notes to view')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');

        if (!fs.existsSync(notesFile)) return interaction.reply('No notes found.');

        const notesData = JSON.parse(fs.readFileSync(notesFile));
        const userNotes = notesData[user.id];

        if (!userNotes || userNotes.length === 0) {
            return interaction.reply(`${user.tag} has no notes.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`Notes for ${user.tag}`)
            .setColor('Blue')
            .setDescription(userNotes.map(n => `**ID ${n.id}** | ${n.note} | \`${n.timestamp}\``).join('\n'));

        await interaction.reply({ embeds: [embed] });
    }
};
