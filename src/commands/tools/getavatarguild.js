const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getavatarguild')
        .setDescription("Get a user's guild avatar")
        .addUserOption(option => option.setName('target').setDescription('User').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => r.name === 'Fish')) 
            return interaction.reply({ content: "You need the Fish role.", ephemeral: true });

        const member = interaction.options.getMember('target');
        await interaction.reply({ content: member.displayAvatarURL({ dynamic: true, size: 1024 }) });
    }
};
