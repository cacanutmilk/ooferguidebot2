module.exports = {
  name: 'chio',
  chance: 0.2, 
  userId: '753956372093206609',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`yoo its the og moderator!!`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`huh? oh wait you mean chiotheanimator?`);
    }
  },
};
