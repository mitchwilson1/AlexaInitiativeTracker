'use strict';
var textHelper = (function () {
    var nameBlacklist = {
        player: 1,
        players: 1
    };

    return {
        completeHelp: 'Here\'s some things you can say,'
        + ' add john.'
        + ' give john 5 Initiative.'
        + ' take 5 Initiative from john'
        + ' tell me the score.'
        + ' tell me the player order'
        + ' new game.'
        + ' reset.'
        + ' and exit.',
        nextHelp: 'You can give or take Initiative from a player, add a player, get the current score, or say help. What would you like?',

        getPlayerName: function (recognizedPlayerName) {
            if (!recognizedPlayerName) {
                return undefined;
            }
            var split = recognizedPlayerName.indexOf(' '), newName;

            if (split < 0) {
                newName = recognizedPlayerName;
            } else {
                //the name should only contain a first name, so ignore the second part if any
                newName = recognizedPlayerName.substring(0, split);
            }
            if (nameBlacklist[newName]) {
                //if the name is on our blacklist, it must be mis-recognition
                return undefined;
            }
            return newName;
        }
    };
})();
module.exports = textHelper;
