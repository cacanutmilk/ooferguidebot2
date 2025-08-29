const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const cooldowns = new Set();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Bot will say your message')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the message')
                .setRequired(false)),

    async execute(interaction) {
        try {
            // Staff role check
            const staffRole = interaction.guild.roles.cache.find(
                r => r.name.toLowerCase() === "staff"
            );
            if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
                return interaction.reply({
                    content: "❌ Only Staff can use this command.",
                    ephemeral: true
                });
            }

            // Apply cooldown only for non-staff
            const isStaff = interaction.member.roles.cache.has(staffRole.id);
            if (!isStaff && cooldowns.has(interaction.user.id)) {
                return interaction.reply({
                    content: "⚠️ You are on cooldown. Please wait 3 seconds.",
                    ephemeral: true
                });
            }

            const msg = interaction.options.getString('message');
            let channel = interaction.options.getChannel('channel') || interaction.channel;

            // Safety check: only text channels bot can send messages to
            if (channel.type !== ChannelType.GuildText || 
                !channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
                channel = interaction.channel; // fallback to current channel
            }

            // Send message and acknowledge user in parallel
            await Promise.all([
                channel.send(msg),
                interaction.reply({ content: `✅ Message sent in ${channel}`, ephemeral: true })
            ]);

            // Only apply cooldown for non-staff
            if (!isStaff) {
                cooldowns.add(interaction.user.id);
                setTimeout(() => cooldowns.delete(interaction.user.id), 3000);
            }

        } catch (err) {
            console.error("❌ Error in say.js:", err);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "❌ Failed to send the message.",
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.editReply("❌ Failed to send the message.").catch(() => {});
            }
        }
    }
};
