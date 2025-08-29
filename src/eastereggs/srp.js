module.exports = {
  name: 'srp',
  chance: 0.2, 
  userId: '1227136631593500714',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`hi im david - srp 2025`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`srp was here, trust.`);
    }
  },
};
