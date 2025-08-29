module.exports = {
  name: 'murdith',
  chance: 0.2, 
  userId: '934208099852619837',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`"Lamith was killed by Murdith.`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`Murdith was killed by Ooferguide Bot.`);
    }
  },
};
