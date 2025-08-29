const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('takerole')
        .setDescription('Remove a role from a member')
        .addUserOption(opt => opt.setName('user').setDescription('User to remove role from').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to remove').setRequired(true)),

    async execute(interaction) {
        const member = interaction.member;
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];

        if (!allowedRoles.some(r => member.roles.cache.some(role => role.name === r))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const target = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        const bot = interaction.guild.members.me;

        // Check if the target has the role
        if (!target.roles.cache.has(role.id)) {
            return interaction.reply({ content: `${target.user.tag} does not have the role ${role.name}.`, ephemeral: true });
        }

        // Check if bot can manage the role
        if (role.position >= bot.roles.highest.position) {
            return interaction.reply({ content: 'I cannot remove a role higher or equal to my highest role.', ephemeral: true });
        }

        // Check if member can remove the role
        if (role.position >= member.roles.highest.position) {
            return interaction.reply({ content: 'You cannot remove a role higher or equal to your highest role.', ephemeral: true });
        }

        // Check for moderator permissions
        const modPermissions = ['BanMembers', 'KickMembers', 'ModerateMembers', 'Administrator'];
        const hasModPerms = role.permissions.toArray().some(p => modPermissions.includes(p));

        if (hasModPerms) {
            // Ask for confirmation with buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_takerole')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_takerole')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                content: `⚠️ Warning! The role "${role.name}" has moderator permissions. Are you sure you want to proceed?`,
                components: [row],
                ephemeral: true
            });

            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_takerole') {
                    await target.roles.remove(role);
                    await i.update({ content: `Successfully removed ${role.name} from ${target.user.tag}`, components: [] });

                    // Log
                    const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Role Removed')
                            .addFields(
                                { name: 'User', value: target.user.tag, inline: true },
                                { name: 'Role', value: role.name, inline: true },
                                { name: 'By', value: interaction.user.tag, inline: true }
                            )
                            .setColor('Orange')
                            .setTimestamp();

                        await logChannel.send({ embeds: [logEmbed] });
                    }
                } else if (i.customId === 'cancel_takerole') {
                    await i.update({ content: 'Command terminated. Role not removed.', components: [] });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: 'No response. Command terminated.', components: [] });
                }
            });

        } else {
            // Remove role immediately if no moderator permissions
            try {
                await target.roles.remove(role);
                await interaction.reply({ content: `Successfully removed ${role.name} from ${target.user.tag}` });

                // Log
                const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Role Removed')
                        .addFields(
                            { name: 'User', value: target.user.tag, inline: true },
                            { name: 'Role', value: role.name, inline: true },
                            { name: 'By', value: interaction.user.tag, inline: true }
                        )
                        .setColor('Orange')
                        .setTimestamp();
                    await logChannel.send({ embeds: [logEmbed] });
                }
            } catch (err) {
                await interaction.reply({ content: `Error removing role: ${err.message}`, ephemeral: true });
            }
        }
    }
};
