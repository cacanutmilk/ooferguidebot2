module.exports = {
  name: 'xoaterz',
  chance: 0.1, 
  userId: '545846899584794625',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hey wait isnt that the blocktales anomator?!?!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`toaster? wait no its xoaterz my bad.`);
    }
  },
};
