// giveawayend.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const giveawaysFile = path.join(__dirname, '../../data/giveawayCreate.json');

function loadGiveaways() {
    if (!fs.existsSync(giveawaysFile)) return [];
    try {
        return JSON.parse(fs.readFileSync(giveawaysFile, 'utf8'));
    } catch (e) {
        console.error('Failed to parse giveaways file:', e);
        return [];
    }
}
function saveGiveaways(giveaways) {
    try {
        fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 2));
    } catch (e) {
        console.error('Failed to save giveaways file:', e);
    }
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveawayend')
        .setDescription('⏹ End a giveaway instantly (accepts message ID or link)')
        .addStringOption(opt => opt
            .setName('message')
            .setDescription('Giveaway message ID or link')
            .setRequired(true)
        ),

    async execute(interaction) {
        // staff-only
        const staffRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
        if (!staffRole || !interaction.member.roles.cache.has(staffRole.id)) {
            return interaction.reply({ content: '❌ Staff only.', ephemeral: true });
        }

        const input = interaction.options.getString('message').trim();

        // Extract the last 17-19 digit group from the input (works for IDs and links)
        const lastIdMatch = input.match(/(\d{17,19})(?!.*\d)/); // last occurrence of 17-19 digits
        let messageId = lastIdMatch?.[1];

        const giveaways = loadGiveaways();

        // fallback: if no ID found, maybe the user pasted the exact messageLink stored in JSON
        if (!messageId) {
            const found = giveaways.find(g => g.messageLink === input);
            if (found) messageId = found.messageId;
        }

        if (!messageId) {
            return interaction.reply({ content: '❌ Invalid message ID or link. Provide a raw message ID or a full message link.', ephemeral: true });
        }

        const giveaway = giveaways.find(g => g.messageId === messageId);
        if (!giveaway) {
            return interaction.reply({ content: '❌ Giveaway not found in storage.', ephemeral: true });
        }

        try {
            const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch(() => null);
            if (!channel) return interaction.reply({ content: '❌ Giveaway channel not found (maybe deleted).', ephemeral: true });

            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (!message) return interaction.reply({ content: '❌ Giveaway message not found (maybe deleted).', ephemeral: true });

            // find the 🎉 reaction
            const reaction = message.reactions.cache.get('🎉') ?? message.reactions.resolve('🎉');
            if (!reaction) {
                // No reaction object — no participants
                await channel.send(`❌ No reactions found for **${giveaway.prize}** — no winners.`);
            } else {
                const users = await reaction.users.fetch().catch(() => null);
                const participants = users ? users.filter(u => !u.bot) : new Map();

                if (!participants || participants.size === 0) {
                    await channel.send(`❌ No valid entries for **${giveaway.prize}**`);
                } else {
                    // pick winners
                    const participantArray = Array.from(participants.values());
                    shuffleArray(participantArray);
                    const winners = participantArray.slice(0, Math.max(1, (giveaway.winners || 1)));

                    await channel.send(`🎉 Congratulations ${winners.map(u => `<@${u.id}>`).join(', ')}! You won **${giveaway.prize}**`);
                }
            }

            // Edit embed to show ended
            const endedEmbed = new EmbedBuilder()
                .setTitle('🎉 Giveaway Ended 🎉')
                .setDescription(`**Prize:** ${giveaway.prize}\n**Ended:** <t:${Math.floor(Date.now() / 1000)}:F>`)
                .setColor('#3498db');

            await message.edit({ embeds: [endedEmbed] }).catch(() => { /* ignore edit errors */ });

            // mark ended in JSON (keeps record for reroll)
            giveaway.ended = true;
            saveGiveaways(giveaways);

            // log to moderation channel
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === '🏴│moderation-logs');
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('⏹ Giveaway Ended')
                    .setColor('#3498db')
                    .addFields(
                        { name: 'Staff', value: interaction.user.tag, inline: true },
                        { name: 'Prize', value: giveaway.prize ?? 'Unknown', inline: true },
                        { name: 'Message Link', value: giveaway.messageLink ?? `https://discord.com/channels/${interaction.guild.id}/${giveaway.channelId}/${giveaway.messageId}`, inline: false }
                    )
                    .setTimestamp();

                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }

            return interaction.reply({ content: '✅ Giveaway ended.', ephemeral: true });
        } catch (err) {
            console.error('giveawayend error:', err);
            return interaction.reply({ content: '❌ An error occurred while ending the giveaway. Check console for details.', ephemeral: true });
        }
    }
};
