module.exports = {
  name: 'jakob',
  chance: 0.1, 
  userId: '1290653385829257226',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hey its me teh garfield guy!!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`jakob was here!?!?!??!`);
    }
  },
};
