module.exports = {
  name: 'isaac',
  chance: 0.1, 
  userId: '1225855414936010864',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`OMG IS THAT OOFERGUIDE FROM YOUTUBE??? JASKDASDLASDJKADSSADSAKDSAKASDNSDAJAKDXZ`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`burp blub blup blourp? (how are you man?)`);
    }
  },
};
