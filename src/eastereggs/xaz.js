module.exports = {
  name: 'xaz',
  chance: 0.2, 
  userId: '905275425087954965',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`senator im singaporean`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`senator im singaporean`);
    }
  },
};
