

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage');

var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.NewGameIntent = function (intent, session, response) {
        //reset scores for all existing players
        storage.loadGame(session, function (currentGame) {
            if (currentGame.data.players.length === 0) {
                response.ask('New game started. Who\'s your first player?',
                    'Please tell me who\'s your first player?');
                return;
            }
            currentGame.data.players.forEach(function (player) {
                currentGame.data.scores[player] = 0;
            });
            currentGame.save(function () {
                var speechOutput = 'New game started with '
                    + currentGame.data.players.length + ' existing player';
                if (currentGame.data.players.length > 1) {
                    speechOutput += 's';
                }
                speechOutput += '.';
                if (skillContext.needMoreHelp) {
                    speechOutput += '. You can give a player Initiative, add another player, reset all players or exit. What would you like?';
                    var repromptText = 'You can give a player Initiative, add another player, reset all players or exit. What would you like?';
                    response.ask(speechOutput, repromptText);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.AddPlayerIntent = function (intent, session, response) {
        //add a player to the current game,
        //terminate or continue the conversation based on whether the intent
        //is from a one shot command or not.
        var newPlayerName = textHelper.getPlayerName(intent.slots.PlayerName.value);
        if (!newPlayerName) {
            response.ask('OK. Who do you want to add?', 'Who do you want to add?');
            return;
        }
        storage.loadGame(session, function (currentGame) {
            var speechOutput,
                reprompt;
            if (currentGame.data.scores[newPlayerName] !== undefined) {
                speechOutput = newPlayerName + ' has already joined the game.';
                if (skillContext.needMoreHelp) {
                    response.ask(speechOutput + ' What else?', 'What else?');
                } else {
                    response.tell(speechOutput);
                }
                return;
            }
            speechOutput = newPlayerName + ' has joined your game. ';
            currentGame.data.players.push(newPlayerName);
            currentGame.data.scores[newPlayerName] = 0;
            if (skillContext.needMoreHelp) {
                if (currentGame.data.players.length == 1) {
                    speechOutput += 'You can say, I am Done Adding Players. Now who\'s your next player?';
                    reprompt = textHelper.nextHelp;
                } else {
                    speechOutput += 'Who is your next player?';
                    reprompt = textHelper.nextHelp;
                }
            }
            currentGame.save(function () {
                if (reprompt) {
                    response.ask(speechOutput, reprompt);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.AddScoreIntent = function (intent, session, response) {
        //give a player Initiative, ask additional question if slot values are missing.
        var playerName = textHelper.getPlayerName(intent.slots.PlayerName.value),
            score = intent.slots.ScoreNumber,
            scoreValue;
        if (!playerName) {
            response.ask('sorry, I did not hear the player name, please say that again', 'Please say the name again');
            return;
        }
        scoreValue = parseInt(score.value);
        if (isNaN(scoreValue)) {
            console.log('Invalid score value = ' + score.value);
            response.ask('sorry, I did not hear the Initiative, please say that again', 'please say the Initiative again');
            return;
        }
        storage.loadGame(session, function (currentGame) {
            var targetPlayer, speechOutput = '', newScore;
            if (currentGame.data.players.length < 1) {
                response.ask('sorry, no player has joined the game yet, what can I do for you?', 'what can I do for you?');
                return;
            }
            for (var i = 0; i < currentGame.data.players.length; i++) {
                if (currentGame.data.players[i] === playerName) {
                    targetPlayer = currentGame.data.players[i];
                    break;
                }
            }
            if (!targetPlayer) {
                response.ask('Sorry, ' + playerName + ' has not joined the game. What else?', playerName + ' has not joined the game. What else?');
                return;
            }
            newScore = currentGame.data.scores[targetPlayer] + scoreValue;
            currentGame.data.scores[targetPlayer] = newScore;

            speechOutput += scoreValue + ' for ' + targetPlayer + '. ';
            if (currentGame.data.players.length == 1 || currentGame.data.players.length > 3) {
                speechOutput += targetPlayer + ' has ' + newScore + ' in total.';
            } else {
                speechOutput += 'That\'s ';
                currentGame.data.players.forEach(function (player, index) {
                    if (index === currentGame.data.players.length - 1) {
                        speechOutput += 'And ';
                    }
                    speechOutput += player + ', ' + currentGame.data.scores[player];
                    speechOutput += ', ';
                });
            }
            currentGame.save(function () {
                response.tell(speechOutput);
            });
        });
    };

    intentHandlers.NewRoundIntent = function (intent, session, response) {
        //Sets the player turn order so that it isn't altered during combat actions
        storage.loadGame(session, function (currentGame) {
            var playerScore = [],
                continueSession,
                speechOutput = '',
                turnboard = '';
            if (currentGame.data.players.length === 0) {
                response.tell('There are no Exalted in the game.');
                return;
            }
            currentGame.data.players.forEach(function (player) {
                playerScore.push({
                    score: currentGame.data.scores[player],
                    player: player
                });
            });
            playerScore.sort(function (p1, p2) {
                return p2.score - p1.score;
            });
            playerScore.forEach(function (playeScore, index) {
                if (index === 0) {
                    speechOutput += playerScore.player + ' has ' + playerScore.score + ' Initiative';
                    playerScore.order = index;
                } else if (index === playerOrder.length - 1) {
                    speechOutput += 'And ' + playerScore.player + ' has ' + playerScore.score;
                    playerScore.order = index;
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.score;
                    playerScore.order = index;
                }
                speechOutput += '. ';
                turnboard += 'No.' + (index + 1) + ' _ ' + playerScore.player + ' : ' + playerScore.score + '\n';
            });
            response.tellWithCard(speechOutput, "turnboard", turnboard);
        });
    };

    intentHandlers.TellOrderIntent = function (intent, session, response) {
        //Tells the player turn order determined at the start of a round
        storage.loadGame(session, function (currentGame) {
            var playerOrder = [],
                continueSession,
                speechOutput = '',
                turnboard = '';
            if (currentGame.data.players.length === 0) {
                response.tell('There are no Exalted in the game.');
                return;
            }
            currentGame.data.players.forEach(function (player) {
                playerOrder.push({
                    score: currentGame.data.scores[player],
                    player: player
                });
            });
            playerOrder.sort(function (p1, p2) {
                return p2.score - p1.score;
            });
            playerOrder.forEach(function (playerScore, index) {
                if (playerOrder.order === 0) {
                    speechOutput += playerScore.player + ' has ' + playerScore.score + ' Initiative';
                } else if (index === playerOrder.order - 1) {
                    speechOutput += 'And ' + playerScore.player + ' has ' + playerScore.score;
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.score;
                };
                speechOutput += '. ';
                turnboard += 'No.' + (index + 1) + ' _ ' + playerScore.player + ' : ' + playerScore.score + '\n';
            });
            response.tellWithCard(speechOutput, "turnboard", turnboard);
        });
    }; //End of Tell Order Intent

    intentHandlers.TellScoresIntent = function (intent, session, response) {
        //tells the scores in the leaderboard and send the result in card.
        storage.loadGame(session, function (currentGame) {
            var sortedPlayerScores = [],
                continueSession,
                speechOutput = '',
                leaderboard = '';
            if (currentGame.data.players.length === 0) {
                response.tell('There are no Exalted in the game.');
                return;
            }
            currentGame.data.players.forEach(function (player) {
                sortedPlayerScores.push({
                    score: currentGame.data.scores[player],
                    player: player
                });
            });
            sortedPlayerScores.sort(function (p1, p2) {
                return p2.score - p1.score;
            });
            sortedPlayerScores.forEach(function (playerScore, index) {
                if (index === 0) {
                    speechOutput += playerScore.player + ' has ' + playerScore.score + ' Initiative';
                } else if (index === sortedPlayerScores.length - 1) {
                    speechOutput += 'And ' + playerScore.player + ' has ' + playerScore.score;
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.score;
                }
                speechOutput += '. ';
                leaderboard += 'No.' + (index + 1) + ' - ' + playerScore.player + ' : ' + playerScore.score + '\n';
            });
            response.tellWithCard(speechOutput, "Leaderboard", leaderboard);
        });
    };

    intentHandlers.ResetPlayersIntent = function (intent, session, response) {
        //remove all players
        storage.newGame(session).save(function () {
            response.ask('New game started without players, who do you want to add first?', 'Who do you want to add first?');
        });
    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.tell(textHelper.completeHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving Initiative to the players in your game.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving Initiative to the players in your game.');
        } else {
            response.tell('');
        }
    };
};
exports.register = registerIntentHandlers;
