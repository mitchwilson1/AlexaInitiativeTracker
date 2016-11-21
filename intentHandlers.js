

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
                currentGame.data.order[player] = 0;
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
            currentGame.data.order[newPlayerName] = 0;
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

            speechOutput += scoreValue + ' Initiative for ' + targetPlayer + '. ';
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

    intentHandlers.SubtractScoreIntent = function (intent, session, response) {
        //take Initiative from a player, ask additional question if slot values are missing.
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
            newScore = currentGame.data.scores[targetPlayer] - scoreValue;
            currentGame.data.scores[targetPlayer] = newScore;

            speechOutput += scoreValue + ' from ' + targetPlayer + '. ';
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
                    order: currentGame.data.order[player],
                    player: player
                });
            });
            sortedPlayerScores.sort(function (p1, p2) {
                return p2.score - p1.score;
            });


            sortedPlayerScores.forEach(function (playerScore, index) {
                playerScore.order = index;
                if (index === 0) {
                    speechOutput += playerScore.player + ' has ' + playerScore.score + ' Initiative, and is in position ' + playerScore.order;
                } else if (index === sortedPlayerScores.length - 1) {
                    speechOutput += 'And ' + playerScore.player + ' has ' + playerScore.score + ', and is in position ' + playerScore.order;
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.score  + ', and is in position ' + playerScore.order;
                }

                currentGame.save(function () {
                });

                leaderboard += 'No.' + (index + 1) + ' - ' + playerScore.player + ' : ' + playerScore.score + '\n';
            });
            response.tellWithCard(speechOutput, "Leaderboard", leaderboard);
        });
    };

    intentHandlers.TellOrderIntent = function (intent, session, response) {

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
            sortedPlayerScores.forEach(function (playerScore) {
                if (playerScore.order === 0) {
                    speechOutput += playerScore.player + ' is first, followed by ';
                } else  if (playerScore.order <= sortedPlayerScores.length - 1) {
                    speechOutput += 'and ' + playerScore.player + ' is last.';
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.order + ' ';
                }
            });

            response.tellWithCard(speechOutput, "Leaderboard", leaderboard);
        });
    };

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
                    speechOutput += ' Order number: ' + playerScore.order;
                } else if (index === sortedPlayerScores.length - 1) {
                    speechOutput += 'And ' + playerScore.player + ' has ' + playerScore.score;
                    speechOutput += ' Order number: ' + playerScore.order;
                } else {
                    speechOutput += playerScore.player + ', ' + playerScore.score;
                    speechOutput += ' Order number: ' + playerScore.order;
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
