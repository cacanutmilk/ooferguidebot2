module.exports = {
  name: 'pinv',
  chance: 0.2, 
  userId: '594943517860692102',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hey itz me, pinv!!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`pinv waz here`);
    }
  },
};
