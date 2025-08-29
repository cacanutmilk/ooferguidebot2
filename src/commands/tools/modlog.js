const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription("Get a user's moderation logs from Discord")
        .addUserOption(opt => opt.setName('target').setDescription('User').setRequired(true))
        .addIntegerOption(opt => opt.setName('limit').setDescription('Number of entries to show').setRequired(false)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name === 'Staff');
        if (!interaction.member.roles.cache.has(staffRole?.id)) 
            return interaction.reply({ content: 'You must be staff to use this command.', ephemeral: true });

        const target = interaction.options.getUser('target');
        const limit = interaction.options.getInteger('limit') || 10;

        try {
            const logs = await interaction.guild.fetchAuditLogs({ limit });
            const userLogs = logs.entries.filter(entry => entry.target?.id === target.id);

            if (!userLogs.size) return interaction.reply({ content: 'No moderation actions found for this user.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle(`Moderation Logs for ${target.tag}`)
                .setColor('Orange')
                .setTimestamp();

            userLogs.forEach((entry, i) => {
                embed.addFields({ name: `${i + 1}. ${entry.action}`, value: `By: ${entry.executor.tag}\nReason: ${entry.reason || 'No reason provided'}` });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: 'Error fetching audit logs.', ephemeral: true });
        }
    }
};
