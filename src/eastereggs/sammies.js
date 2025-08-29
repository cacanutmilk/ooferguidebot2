module.exports = {
  name: 'sammies',
  chance: 0.3, 
  userId: '934608506420600872',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hey guys im sam`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`hey guys im jam`);
    }
  },
};
