const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pollshow')
        .setDescription('Show and end a poll immediately')
        .addStringOption(opt => opt.setName('message').setDescription('Poll message ID or link').setRequired(true)),

    async execute(interaction) {
        // permission check
        if (!interaction.member.roles.cache.some(r => r.name.toLowerCase().includes('staff'))) {
            return interaction.reply({ content: 'Staff role required.', ephemeral: true });
        }

        // Defer early to avoid "Unknown interaction" on longer ops
        await interaction.deferReply({ ephemeral: true });

        const input = interaction.options.getString('message').trim();

        // Parse message link or ID
        // Link form: /channels/<guildId>/<channelId>/<messageId>
        const linkMatch = input.match(/\/channels\/(\d+)\/(\d+)\/(\d+)/);
        let messageId;
        if (linkMatch) {
            messageId = linkMatch[3];
        } else {
            const idMatch = input.match(/(\d{17,19})$/);
            messageId = idMatch ? idMatch[1] : input;
        }

        const polls = interaction.client.polls || {};
        const poll = Object.values(polls).find(p => String(p.messageId) === String(messageId));

        if (!poll) {
            return interaction.editReply({ content: 'Poll not found.', ephemeral: true });
        }

        // If already ended, show results and ensure buttons removed
        if (poll.ended) {
            const resultsText = poll.options
                .map(o => `${o.name}: ${o.votes.length} vote${o.votes.length !== 1 ? 's' : ''}`)
                .join('\n') || 'No votes cast.';

            // determine winner(s)
            const counts = poll.options.map(o => o.votes.length);
            const max = counts.length ? Math.max(...counts) : 0;
            let winnerText;
            if (max === 0) {
                winnerText = 'No votes were cast.';
            } else {
                const winners = poll.options.filter(o => o.votes.length === max).map(o => o.name);
                if (winners.length === 1) {
                    winnerText = `**${winners[0]}** with **${max}** vote${max !== 1 ? 's' : ''}.`;
                } else {
                    winnerText = `Tie between ${winners.map(w => `**${w}**`).join(', ')} — **${max}** votes each.`;
                }
            }

            const embedAlready = new EmbedBuilder()
                .setTitle('📊 Poll Results (Already Ended)')
                .setDescription(`**${poll.question}**\n\n${resultsText}`)
                .addFields({ name: 'Winner', value: winnerText })
                .setColor('Purple')
                .setFooter({ text: `Multiple votes allowed: ${poll.allowMultiple ? 'Yes' : 'No'}` });

            // Attempt to remove components on the original message
            try {
                const channel = await interaction.client.channels.fetch(poll.channelId).catch(() => null);
                if (channel) {
                    const pollMessage = await channel.messages.fetch(poll.messageId).catch(() => null);
                    if (pollMessage) await pollMessage.edit({ components: [] }).catch(() => null);
                }
            } catch (err) {
                console.error('Error cleaning ended poll message:', err);
            }

            return interaction.editReply({ embeds: [embedAlready] });
        }

        // Mark ended immediately to prevent race with collector end handler
        poll.ended = true;

        // Stop collector if present (collector's 'end' handler will be skipped because poll.ended === true)
        try {
            if (poll.collector && typeof poll.collector.stop === 'function') {
                poll.collector.stop('ended_by_staff');
            }
        } catch (err) {
            console.error('Error stopping poll collector:', err);
            // continue — we'll still build and send results
        }

        // Build results
        const results = poll.options
            .map(o => `${o.name}: ${o.votes.length} vote${o.votes.length !== 1 ? 's' : ''}`)
            .join('\n') || 'No votes cast.';

        // determine winner(s)
        const counts = poll.options.map(o => o.votes.length);
        const max = counts.length ? Math.max(...counts) : 0;
        let winnerText;
        if (max === 0) {
            winnerText = 'No votes were cast.';
        } else {
            const winners = poll.options.filter(o => o.votes.length === max).map(o => o.name);
            if (winners.length === 1) {
                winnerText = `**${winners[0]}** with **${max}** vote${max !== 1 ? 's' : ''}.`;
            } else {
                winnerText = `Tie between ${winners.map(w => `**${w}**`).join(', ')} — **${max}** votes each.`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Poll Ended')
            .setDescription(`**${poll.question}**\n\n${results}`)
            .addFields({ name: 'Winner', value: winnerText })
            .setColor('Purple')
            .setFooter({ text: `Multiple votes allowed: ${poll.allowMultiple ? 'Yes' : 'No'}` });

        // Update original poll message (remove buttons and show results)
        try {
            const channel = await interaction.client.channels.fetch(poll.channelId).catch(() => null);
            if (channel) {
                const pollMessage = await channel.messages.fetch(poll.messageId).catch(() => null);
                if (pollMessage) {
                    await pollMessage.edit({ embeds: [embed], components: [] }).catch(err => {
                        console.error('Failed to edit poll message:', err);
                    });
                }
            }
        } catch (err) {
            console.error('Error updating poll message:', err);
        }

        // Final ephemeral reply to staff
        return interaction.editReply({ content: 'Poll ended and results displayed to the channel.', embeds: [embed] });
    }
};
