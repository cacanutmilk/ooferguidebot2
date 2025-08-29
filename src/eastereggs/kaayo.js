module.exports = {
  name: 'kaayo',
  chance: 0.1, 
  userId: '789622350508589076',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`waffle for life!!! - kaayo`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`Do you like wafflez?? - kaayo`);
    }
  },
};
