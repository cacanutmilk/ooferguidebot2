module.exports = {
  name: 'dusk',
  chance: 0.001, 
  userId: '1014633397290811474',

  async execute(message, args) {
    if (message.author.id === this.userId) {
      return message.channel.send(`My name is dusk05. Im 16 years old. My house is in the northeast section of the world, where all the Americans are, and I am not married. I work as an animator, and I get home every day by 8 PM at the latest. I dont smoke, but I occasionally drink. Im in bed by 10 PM, and make sure I get eight hours of sleep, no matter what. After having a glass of warm milk and doing about twenty minutes of stretches before going to bed, I usually have no problems sleeping until morning. Just like a baby, I wake up without any fatigue or stress in the morning. I was told there were no issues at my last check-up. Im trying to explain that Im a person who wishes to live a very quiet life. I take care not to trouble myself with any enemies, like winning and losing, that would cause me to lose sleep at night. That is how I deal with society, and I know that is what brings me happiness. Although, if I were to fight, I wouldnt lose to anyone.`);
    }


    if (Math.random() <= this.chance) {
      return message.channel.send(`My name is dusk05. Im 16 years old. My house is in the northeast section of the world, where all the Americans are, and I am not married. I work as an animator, and I get home every day by 8 PM at the latest. I dont smoke, but I occasionally drink. Im in bed by 10 PM, and make sure I get eight hours of sleep, no matter what. After having a glass of warm milk and doing about twenty minutes of stretches before going to bed, I usually have no problems sleeping until morning. Just like a baby, I wake up without any fatigue or stress in the morning. I was told there were no issues at my last check-up. Im trying to explain that Im a person who wishes to live a very quiet life. I take care not to trouble myself with any enemies, like winning and losing, that would cause me to lose sleep at night. That is how I deal with society, and I know that is what brings me happiness. Although, if I were to fight, I wouldnt lose to anyone.`);
    }
  },
};
