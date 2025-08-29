const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetcase')
        .setDescription('Reset moderation cases.'),

    async execute(interaction) {
        const allowedRoles = ["Management Fish", "Community Holder", "Goldfish"];
        const hasRole = interaction.member.roles.cache.some(r => allowedRoles.includes(r.name));
        if (!hasRole) return interaction.reply({ content: "❌ You don't have permission. Required permission: Management Fish+", ephemeral: true });

        // Root path to cases.json
        const casesPath = path.join(process.cwd(), 'cases.json');

        try {
            // Overwrite the existing file
            fs.writeFileSync(casesPath, JSON.stringify({ lastCase: 0, count: 0 }, null, 2), 'utf8');
            await interaction.reply({ content: "✅ Cases have been reset.", ephemeral: false });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: "❌ Failed to reset cases.", ephemeral: true });
        }
    }
};
