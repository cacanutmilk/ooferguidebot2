const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('givemod')
        .setDescription('Give a role moderator permissions')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to give moderator permissions').setRequired(true)),

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
            return interaction.reply({ content: 'I cannot give permissions to a role higher than my highest role.', ephemeral: true });
        }

        // Moderator permissions to add
        const modPerms = [
            PermissionsBitField.Flags.KickMembers,
            PermissionsBitField.Flags.BanMembers,
            PermissionsBitField.Flags.ModerateMembers,
            PermissionsBitField.Flags.ManageMessages
        ];

        // Check if role already has all moderator permissions
        const hasAllModPerms = modPerms.every(p => role.permissions.has(p));
        if (hasAllModPerms) {
            return interaction.reply({ content: `The role "${role.name}" already has all moderator permissions.`, ephemeral: true });
        }

        // Ask for confirmation
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_givemod')
                    .setLabel('Confirm')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_givemod')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({
            content: `⚠️ Warning! The role "${role.name}" is going to have moderator permissions added. Proceed?`,
            components: [row],
            ephemeral: true
        });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_givemod') {
                try {
                    // Combine existing permissions with moderator permissions
                    const newPerms = role.permissions.add(modPerms);
                    await role.setPermissions(newPerms);

                    await i.update({ content: `Moderator permissions have been added to ${role.name}.`, components: [] });

                    // Log
                    const logChannel = interaction.guild.channels.cache.find(c => c.name === '🏴│moderation-logs');
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Moderator Permissions Added')
                            .addFields(
                                { name: 'Role', value: role.name },
                                { name: 'By', value: interaction.user.tag }
                            )
                            .setColor('Green')
                            .setTimestamp();
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                } catch (err) {
                    await i.update({ content: `Error giving moderator permissions: ${err.message}`, components: [] });
                }
            } else if (i.customId === 'cancel_givemod') {
                await i.update({ content: 'Command terminated. Permissions not given.', components: [] });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'No response. Command terminated.', components: [] });
            }
        });
    }
};
