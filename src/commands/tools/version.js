const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readFileSync } = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('version')
        .setDescription('Show bot version.'),

    async execute(interaction) {
        const fishRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'fish');
        if (!fishRole || !interaction.member.roles.cache.has(fishRole.id))
            return interaction.reply({ content: "❌ Fish role required.", ephemeral: true });

        const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
        const embed = new EmbedBuilder()
            .setTitle('Bot Version')
            .setColor('#00FFFF')
            .setDescription(`Version: **${pkg.version}**`);

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
