const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delrole')
        .setDescription('Delete a role from the server')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to delete').setRequired(true)),

    async execute(interaction) {
        const member = interaction.member;
        const bot = interaction.guild.members.me;
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];

        // Permission check
        if (!allowedRoles.some(r => member.roles.cache.some(role => role.name === r))) {
            return interaction.reply({ content: 'You do not have permission to delete roles.', ephemeral: true });
        }

        const role = interaction.options.getRole('role');

        // User cannot delete higher/equal role
        if (role.position >= member.roles.highest.position) {
            return interaction.reply({ content: 'You cannot delete a role higher or equal to your highest role.', ephemeral: true });
        }

        // Bot cannot delete higher/equal role
        if (role.position >= bot.roles.highest.position) {
            return interaction.reply({ content: 'I cannot delete a role higher or equal to my highest role.', ephemeral: true });
        }

        // Check for moderator permissions
        const modPermissions = ['BanMembers', 'KickMembers', 'ModerateMembers', 'Administrator'];
        const hasModPerms = role.permissions.toArray().some(p => modPermissions.includes(p));

        if (hasModPerms) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_delrole')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_delrole')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                content: `⚠️ Warning! The role "${role.name}" has moderator permissions. Are you sure you want to delete it?`,
                components: [row],
                ephemeral: true
            });

            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_delrole') {
                    try {
                        await role.delete();
                        await i.update({ content: `Role ${role.name} deleted successfully!`, components: [] });

                        // Log
                        const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('Role Deleted')
                                .addFields(
                                    { name: 'Role', value: role.name },
                                    { name: 'By', value: interaction.user.tag }
                                )
                                .setColor('Red')
                                .setTimestamp();

                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    } catch (err) {
                        await i.update({ content: `Error deleting role: ${err.message}`, components: [] });
                    }
                } else if (i.customId === 'cancel_delrole') {
                    await i.update({ content: 'Command terminated. Role not deleted.', components: [] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'No response. Command terminated.', components: [] });
                }
            });

        } else {
            // Delete immediately if no moderator permissions
            try {
                await role.delete();
                await interaction.reply({ content: `Role ${role.name} deleted successfully!` });

                const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Role Deleted')
                        .addFields(
                            { name: 'Role', value: role.name },
                            { name: 'By', value: interaction.user.tag }
                        )
                        .setColor('Red')
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            } catch (err) {
                await interaction.reply({ content: `Error deleting role: ${err.message}`, ephemeral: true });
            }
        }
    }
};
