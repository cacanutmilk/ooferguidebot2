module.exports = {
  name: 'mug',
  chance: 0.5, 
  userId: '763922764947783681',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`mugo`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`mugo`);
    }
  },
};
