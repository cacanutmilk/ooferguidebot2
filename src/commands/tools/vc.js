const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Manage voice channels')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a private voice channel')
                .addStringOption(opt => opt.setName('name').setDescription('Voice channel name').setRequired(true))
                .addStringOption(opt => opt.setName('category').setDescription('Category ID (optional)'))
        )
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete a voice channel')
                .addStringOption(opt => opt.setName('id').setDescription('Voice channel ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Rename a voice channel')
                .addStringOption(opt => opt.setName('id').setDescription('Voice channel ID').setRequired(true))
                .addStringOption(opt => opt.setName('new_name').setDescription('New name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('move')
                .setDescription('Move a voice channel to a category')
                .addStringOption(opt => opt.setName('id').setDescription('Voice channel ID').setRequired(true))
                .addStringOption(opt => opt.setName('category').setDescription('Category ID').setRequired(true))
        ),

    async execute(interaction) {
        const allowedRoles = ['Management Fish', 'Community Holder', 'Goldfish'];
        if (!interaction.member.roles.cache.some(r => allowedRoles.includes(r.name))) {
            return interaction.reply({ content: '❌ You don’t have permission for this command.', ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        try {
            await interaction.deferReply({ ephemeral: true });

            // --- CREATE ---
            if (sub === 'create') {
                const name = interaction.options.getString('name');
                const categoryId = interaction.options.getString('category');

                const existing = interaction.guild.channels.cache.find(c => c.name === name && c.type === ChannelType.GuildVoice);
                if (existing) return interaction.editReply({ content: `❌ Voice channel **${name}** already exists.` });

                let parent;
                if (categoryId) {
                    const category = interaction.guild.channels.cache.get(categoryId);
                    if (!category || category.type !== ChannelType.GuildCategory) {
                        return interaction.editReply({ content: '❌ Category ID invalid or does not exist.' });
                    }
                    parent = category.id;
                }

                // --- Create private voice channel ---
                const vc = await interaction.guild.channels.create({
                    name,
                    type: ChannelType.GuildVoice,
                    parent,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // @everyone
                            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
                        },
                        {
                            id: interaction.member.id, // command user
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels]
                        }
                    ]
                });

                return interaction.editReply({ content: `✅ Private voice channel **${vc.name}** created.` });
            }

            // --- DELETE ---
            if (sub === 'delete') {
                const vcId = interaction.options.getString('id');
                const vc = interaction.guild.channels.cache.get(vcId);

                if (!vc || vc.type !== ChannelType.GuildVoice) {
                    return interaction.editReply({ content: '❌ Voice channel not found or invalid ID.' });
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`delvc_confirm_${vc.id}`).setLabel('Confirm').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('delvc_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ content: `⚠️ Delete voice channel **${vc.name}**?`, components: [row] });

                const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('delvc_');
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    try {
                        if (i.customId === `delvc_confirm_${vc.id}`) {
                            await vc.delete();
                            await i.update({ content: `✅ Voice channel **${vc.name}** deleted.`, components: [] });
                        } else if (i.customId === 'delvc_cancel') {
                            await i.update({ content: '❌ Deletion cancelled.', components: [] });
                        }
                    } catch (err) {
                        console.error('❌ Error handling delete button:', err);
                        await i.update({ content: '⚠️ Error occurred.', components: [] }).catch(() => {});
                    }
                    collector.stop();
                });

                collector.on('end', collected => {
                    if (collected.size === 0) {
                        interaction.editReply({ content: '❌ Deletion timed out.', components: [] }).catch(() => {});
                    }
                });
            }

            // --- EDIT ---
            if (sub === 'edit') {
                const id = interaction.options.getString('id');
                const newName = interaction.options.getString('new_name');
                const vc = interaction.guild.channels.cache.get(id);

                if (!vc || vc.type !== ChannelType.GuildVoice) {
                    return interaction.editReply({ content: '❌ Voice channel not found or invalid ID.' });
                }

                await vc.setName(newName);
                return interaction.editReply({ content: `✅ Renamed voice channel to **${newName}**` });
            }

            // --- MOVE ---
            if (sub === 'move') {
                const vcId = interaction.options.getString('id');
                const categoryId = interaction.options.getString('category');

                const vc = interaction.guild.channels.cache.get(vcId);
                const category = interaction.guild.channels.cache.get(categoryId);

                if (!vc || vc.type !== ChannelType.GuildVoice) {
                    return interaction.editReply({ content: '❌ Voice channel not found or invalid ID.' });
                }
                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.editReply({ content: '❌ Category ID invalid or does not exist.' });
                }

                await vc.setParent(category.id);
                return interaction.editReply({ content: `✅ Moved voice channel **${vc.name}** to category **${category.name}**` });
            }

        } catch (err) {
            console.error('❌ Error executing vc command:', err);
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
            } else {
                return interaction.reply({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
            }
        }
    }
};
