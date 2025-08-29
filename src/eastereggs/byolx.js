module.exports = {
  name: 'byolx',
  chance: 0.4, 
  userId: '882801637926776933',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`no 1 knows i made this servor`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`no 1 knows i made this servor`);
    }
  },
};
