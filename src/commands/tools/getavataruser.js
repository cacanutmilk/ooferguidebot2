const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getavataruser')
        .setDescription("Get a user's main avatar")
        .addUserOption(option => option.setName('target').setDescription('User').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => r.name === 'Fish')) 
            return interaction.reply({ content: "You need the Fish role.", ephemeral: true });

        const user = interaction.options.getUser('target');
        await interaction.reply({ content: user.avatarURL({ dynamic: true, size: 1024 }) });
    }
};
