const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Show server information.'),

    async execute(interaction) {
        const fishRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'fish');
        if (!fishRole || !interaction.member.roles.cache.has(fishRole.id))
            return interaction.reply({ content: "❌ Fish role required.", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle(`🏰 Server Info: ${interaction.guild.name}`)
            .setColor('#00FFFF')
            .addFields(
                { name: 'Owner', value: `<@${interaction.guild.ownerId}>`, inline: true },
                { name: 'Member Count', value: `${interaction.guild.memberCount}`, inline: true },
                { name: 'Created At (UTC)', value: interaction.guild.createdAt.toUTCString(), inline: false }
            );

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
