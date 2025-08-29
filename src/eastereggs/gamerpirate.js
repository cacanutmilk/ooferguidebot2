module.exports = {
  name: 'gamerpirate',
  chance: 0.2, 
  userId: '1217477234613424144',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`yo wait is that an actual pirate?!?!?!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`who let bro cook in making art 🔥🔥`);
    }
  },
};
