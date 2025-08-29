module.exports = {
  name: 'wello',
  chance: 0.1, 
  userId: '1019959014714515478',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hey itz the corn guy wello!! 🌽`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`dont you dare steal my corns.. or else. -wello`);
    }
  },
};
