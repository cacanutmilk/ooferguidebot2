const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// Helper to convert "10m", "1h", "1d" to ms
function parseDuration(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return null;
    const [, value, unit] = match;
    const num = parseInt(value, 10);
    switch (unit.toLowerCase()) {
        case 's': return num * 1000;
        case 'm': return num * 60 * 1000;
        case 'h': return num * 60 * 60 * 1000;
        case 'd': return num * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

// Build component rows from labels + counts
function buildRows(pollId, options) {
    const styles = [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger];
    const rows = [];
    const MAX_LABEL = 80;
    for (let i = 0; i < options.length; i += 5) {
        const row = new ActionRowBuilder();
        const chunk = options.slice(i, i + 5);
        chunk.forEach((opt, j) => {
            const idx = i + j;
            // label with count, ensure not too long
            const base = opt.name.length > MAX_LABEL ? `${opt.name.slice(0, MAX_LABEL - 1)}…` : opt.name;
            const label = `${base} — ${opt.votes.length}`;
            const style = styles[idx % styles.length];
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_${pollId}_${idx}`)
                    .setLabel(label)
                    .setStyle(style)
            );
        });
        rows.push(row);
    }
    return rows;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pollcreate')
        .setDescription('Create a poll (2-10 options)')
        // required first
        .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
        .addStringOption(opt => opt.setName('option1').setDescription('Option 1').setRequired(true))
        .addStringOption(opt => opt.setName('option2').setDescription('Option 2').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 10m, 1h, 1d)').setRequired(true))
        .addBooleanOption(opt => opt.setName('multiple').setDescription('Allow multiple votes per user').setRequired(true))
        // optionals
        .addStringOption(opt => opt.setName('option3').setDescription('Option 3'))
        .addStringOption(opt => opt.setName('option4').setDescription('Option 4'))
        .addStringOption(opt => opt.setName('option5').setDescription('Option 5'))
        .addStringOption(opt => opt.setName('option6').setDescription('Option 6'))
        .addStringOption(opt => opt.setName('option7').setDescription('Option 7'))
        .addStringOption(opt => opt.setName('option8').setDescription('Option 8'))
        .addStringOption(opt => opt.setName('option9').setDescription('Option 9'))
        .addStringOption(opt => opt.setName('option10').setDescription('Option 10')),

    async execute(interaction) {
        // permissions
        if (!interaction.member.roles.cache.some(r => r.name.toLowerCase().includes('staff'))) {
            return interaction.reply({ content: 'Staff role required.', ephemeral: true });
        }

        const question = interaction.options.getString('question').trim();
        const durationStr = interaction.options.getString('duration').trim();
        const allowMultiple = interaction.options.getBoolean('multiple');

        // parse duration
        const duration = parseDuration(durationStr);
        const MIN_MS = 5 * 1000; // 5s
        const MAX_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

        if (!duration || duration < MIN_MS || duration > MAX_MS) {
            return interaction.reply({ content: 'Invalid duration. Use formats like `10m`, `1h`, `1d`. Minimum 5s, maximum 30d.', ephemeral: true });
        }

        // gather options
        const options = [];
        for (let i = 1; i <= 10; i++) {
            const opt = interaction.options.getString(`option${i}`);
            if (opt) options.push(opt.trim());
        }

        if (options.length < 2) {
            return interaction.reply({ content: 'You must provide at least 2 options (option1 and option2 required).', ephemeral: true });
        }
        if (options.length > 10) {
            return interaction.reply({ content: 'Maximum of 10 options allowed.', ephemeral: true });
        }

        // prepare initial option objects
        const pollOptions = options.map(name => ({ name, votes: [] }));

        // embed
        const embed = new EmbedBuilder()
            .setTitle('📊 Poll')
            .setDescription(`**${question}**\n\n${pollOptions.map((o, i) => `${i + 1}. ${o.name}`).join('\n')}`)
            .setColor('Blue')
            .setFooter({ text: `Ends in ${durationStr} • Multiple votes allowed: ${allowMultiple ? 'Yes' : 'No'}` });

        // initial rows (will show 0 counts)
        const rows = buildRows(interaction.id, pollOptions);

        // send
        let message;
        try {
            message = await interaction.reply({ embeds: [embed], components: rows, fetchReply: true });
        } catch (err) {
            console.error('Failed to send poll message:', err);
            return interaction.reply({ content: `Failed to create poll: ${err.message}`, ephemeral: true });
        }

        // store poll data
        if (!interaction.client.polls) interaction.client.polls = {};
        interaction.client.polls[interaction.id] = {
            messageId: message.id,
            channelId: message.channel.id,
            question,
            options: pollOptions,
            allowMultiple,
            ended: false,
            collector: null,
            durationStr,
            lockedUsers: [] // used only when allowMultiple === false
        };

        // collector
        const filter = i => i.isButton() && i.customId.startsWith(`poll_${interaction.id}_`);
        let collector;
        try {
            collector = message.createMessageComponentCollector({ filter, time: duration });
            interaction.client.polls[interaction.id].collector = collector;
        } catch (err) {
            console.error('Failed to create collector:', err);
            try { await message.edit({ components: [] }); } catch {}
            return interaction.followUp({ content: `Failed to activate poll controls: ${err.message}`, ephemeral: true });
        }

        collector.on('collect', async i => {
            try {
                const poll = interaction.client.polls[interaction.id];
                if (!poll || poll.ended) return i.reply({ content: 'This poll has ended.', ephemeral: true });

                // If single-vote poll: lock after first vote
                if (!poll.allowMultiple && poll.lockedUsers.includes(i.user.id)) {
                    return i.reply({ content: 'You are locked from voting in this poll.', ephemeral: true });
                }

                const parts = i.customId.split('_');
                const optionIndex = parseInt(parts[2], 10);
                if (Number.isNaN(optionIndex) || !poll.options[optionIndex]) {
                    return i.reply({ content: 'Invalid option selected.', ephemeral: true });
                }

                // single vs multiple logic
                if (!poll.allowMultiple) {
                    // remove the user's votes from other options (defensive)
                    poll.options.forEach(opt => {
                        const idx = opt.votes.indexOf(i.user.id);
                        if (idx !== -1) opt.votes.splice(idx, 1);
                    });
                }

                const opt = poll.options[optionIndex];
                if (!opt.votes.includes(i.user.id)) {
                    opt.votes.push(i.user.id);

                    // lock user only if multiple = false
                    if (!poll.allowMultiple) {
                        poll.lockedUsers.push(i.user.id);
                    }

                    // update buttons with new counts
                    const updatedRows = buildRows(interaction.id, poll.options);
                    try {
                        await message.edit({ components: updatedRows }).catch(() => null);
                    } catch (err) {
                        console.error('Failed to update poll buttons:', err);
                    }

                    // reply ephemeral
                    await i.reply({ content: `You voted for "${opt.name}"${!poll.allowMultiple ? ' — you are now locked from voting' : ''}.`, ephemeral: true });
                } else {
                    return i.reply({ content: 'You already voted for this option.', ephemeral: true });
                }
            } catch (err) {
                console.error('Error handling vote:', err);
                try { await i.reply({ content: 'An error occurred while processing your vote.', ephemeral: true }); } catch {}
            }
        });

        collector.on('end', async () => {
            try {
                const poll = interaction.client.polls[interaction.id];
                if (!poll || poll.ended) return;
                poll.ended = true;

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

                const resultEmbed = new EmbedBuilder()
                    .setTitle('📊 Poll Ended')
                    .setDescription(`**${poll.question}**\n\n${results}`)
                    .setColor('Green')
                    .addFields({ name: 'Winner', value: winnerText })
                    .setFooter({ text: `Ended • Multiple votes allowed: ${poll.allowMultiple ? 'Yes' : 'No'}` });

                // update message to show final results and remove buttons
                const channel = interaction.client.channels.cache.get(poll.channelId);
                if (channel) {
                    const pollMessage = await channel.messages.fetch(poll.messageId).catch(() => null);
                    if (pollMessage) await pollMessage.edit({ embeds: [resultEmbed], components: [] }).catch(() => null);
                }
            } catch (err) {
                console.error('Error finalizing poll:', err);
            }
        });
    }
};
