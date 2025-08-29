module.exports = {
  name: 'ozel',
  chance: 0.1, 
  userId: '669608269228015628',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hey is that teh forsaken content creator guy`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`ozelblock was here`);
    }
  },
};
