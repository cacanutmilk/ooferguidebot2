const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Manage text channels')
        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a private text channel')
                .addStringOption(opt => opt.setName('name').setDescription('Channel name').setRequired(true))
                .addStringOption(opt => opt.setName('category').setDescription('Category ID (optional)'))
        )
        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete a text channel')
                .addStringOption(opt => opt.setName('id').setDescription('Channel ID').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Rename a text channel')
                .addStringOption(opt => opt.setName('id').setDescription('Channel ID').setRequired(true))
                .addStringOption(opt => opt.setName('new_name').setDescription('New name').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('move')
                .setDescription('Move a text channel to a category')
                .addStringOption(opt => opt.setName('id').setDescription('Channel ID').setRequired(true))
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

                const existing = interaction.guild.channels.cache.find(c => c.name === name && c.type === ChannelType.GuildText);
                if (existing) return interaction.editReply({ content: `❌ Text channel **${name}** already exists.` });

                let parent;
                if (categoryId) {
                    const category = interaction.guild.channels.cache.get(categoryId);
                    if (!category || category.type !== ChannelType.GuildCategory) {
                        return interaction.editReply({ content: '❌ Category ID invalid or does not exist.' });
                    }
                    parent = category.id;
                }

                // --- Create private channel ---
                const ch = await interaction.guild.channels.create({
                    name,
                    type: ChannelType.GuildText,
                    parent,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // @everyone
                            deny: [PermissionFlagsBits.ViewChannel] // deny everyone
                        },
                        {
                            id: interaction.member.id, // command user
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        }
                    ]
                });

                return interaction.editReply({ content: `✅ Created private text channel: **${ch.name}** (ID: ${ch.id})` });
            }

            // --- DELETE ---
            if (sub === 'delete') {
                const id = interaction.options.getString('id');
                const channel = interaction.guild.channels.cache.get(id);

                if (!channel || channel.type !== ChannelType.GuildText) {
                    return interaction.editReply({ content: '❌ Text channel not found or invalid ID.' });
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`delchan_confirm_${channel.id}`).setLabel('Confirm').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('delchan_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ content: `⚠️ Delete text channel **${channel.name}**?`, components: [row] });

                const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('delchan_');
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    try {
                        if (i.customId === `delchan_confirm_${channel.id}`) {
                            await channel.delete();
                            await i.update({ content: `✅ Text channel **${channel.name}** deleted.`, components: [] });
                        } else if (i.customId === 'delchan_cancel') {
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
                const channel = interaction.guild.channels.cache.get(id);

                if (!channel || channel.type !== ChannelType.GuildText) {
                    return interaction.editReply({ content: '❌ Text channel not found or invalid ID.' });
                }

                await channel.setName(newName);
                return interaction.editReply({ content: `✅ Renamed text channel to **${newName}**` });
            }

            // --- MOVE ---
            if (sub === 'move') {
                const channelId = interaction.options.getString('id');
                const categoryId = interaction.options.getString('category');

                const channel = interaction.guild.channels.cache.get(channelId);
                const category = interaction.guild.channels.cache.get(categoryId);

                if (!channel || channel.type !== ChannelType.GuildText) {
                    return interaction.editReply({ content: '❌ Text channel not found or invalid ID.' });
                }
                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.editReply({ content: '❌ Category not found or invalid ID.' });
                }

                // Move the channel without changing existing permission overwrites
                await channel.setParent(category.id, { lockPermissions: false });

                return interaction.editReply({ content: `✅ Moved text channel **${channel.name}** to category **${category.name}**` });
            }

        } catch (err) {
            console.error('❌ Error executing channel command:', err);
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
            } else {
                return interaction.reply({ content: '⚠️ Something went wrong.', ephemeral: true }).catch(() => {});
            }
        }
    }
};
