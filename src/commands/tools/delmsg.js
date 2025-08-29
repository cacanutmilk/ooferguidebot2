const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delmsg')
        .setDescription('Delete messages from a channel (max 100).')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)),

    async execute(interaction) {
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === "staff");
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');
        if (amount < 1 || amount > 100) return interaction.reply({ content: "⚠️ You can only delete 1-100 messages at a time.", ephemeral: true });

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: `✅ Deleted ${deleted.size} message(s).`, ephemeral: true });
        } catch (err) {
            console.error(err);
            interaction.reply({ content: "❌ Failed to clear messages. Make sure messages are not older than 14 days.", ephemeral: true });
        }
    }
};
