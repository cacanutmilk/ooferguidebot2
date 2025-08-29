const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delmsguser')
        .setDescription("Delete a user's messages")
        .addUserOption(opt => opt.setName('target').setDescription('User').setRequired(true))
        .addIntegerOption(opt => opt.setName('count').setDescription('Number of messages').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => r.name.toLowerCase().includes('staff'))) 
            return interaction.reply({ content: "Staff role required.", ephemeral: true });

        const user = interaction.options.getUser('target');
        const count = interaction.options.getInteger('count');

        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = messages.filter(m => m.author.id === user.id).first(count);

        for (const msg of userMessages) {
            await msg.delete().catch(() => {});
        }

        await interaction.reply({ content: `Deleted ${userMessages.length} messages from ${user.username}.` });
    }
};
