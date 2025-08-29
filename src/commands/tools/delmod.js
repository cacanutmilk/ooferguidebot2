const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delmod')
        .setDescription('Remove all moderator permissions from a role')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to remove moderator permissions from').setRequired(true)),

    async execute(interaction) {
        const member = interaction.member;
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];
        const bot = interaction.guild.members.me;

        // Permission check
        if (!allowedRoles.some(r => member.roles.cache.some(role => role.name === r))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const role = interaction.options.getRole('role');

        // Check if bot can manage role
        if (role.position >= bot.roles.highest.position) {
            return interaction.reply({ content: 'I cannot modify a role higher than my highest role.', ephemeral: true });
        }

        // Moderator permissions to remove
        const modPerms = [
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.BanMembers,
            PermissionsBitField.Flags.ModerateMembers,
            PermissionsBitField.Flags.ManageMessages
        ];

        // Check if role has any moderator permissions
        const roleHasModPerms = role.permissions.has(modPerms);
        if (!roleHasModPerms) {
            return interaction.reply({ content: `The role "${role.name}" does not have any moderator permissions.`, ephemeral: true });
        }

        // Confirmation buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_delmod')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delmod')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            content: `⚠️ Warning! The role "${role.name}" is going to have all moderator permissions removed. Proceed?`,
            components: [row],
            ephemeral: true
        });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_delmod') {
                try {
                    // Remove only moderator permissions, keep other permissions
                    const newPerms = role.permissions.remove(modPerms);
                    await role.setPermissions(newPerms);

                    await i.update({ content: `All moderator permissions have been removed from ${role.name}.`, components: [] });

                    // Log
                    const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Moderator Permissions Removed')
                            .addFields(
                                { name: 'Role', value: role.name },
                                { name: 'By', value: interaction.user.tag }
                            )
                            .setColor('Orange')
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                } catch (err) {
                    await i.update({ content: `Error removing moderator permissions: ${err.message}`, components: [] });
                }
            } else if (i.customId === 'cancel_delmod') {
                await i.update({ content: 'Command terminated. Permissions not removed.', components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'No response. Command terminated.', components: [] });
            }
        });
    }
};
