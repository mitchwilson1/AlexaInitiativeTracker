'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The Game class stores all game states for the user
     */
    function Game(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                players: [],
                scores: {},
                order: {}
            };
        }
        this._session = session;
    }

    Game.prototype = {
        isEmptyScore: function () {
            //check if any one had non-zero score,
            //it can be used as an indication of whether the game has just started
            var allEmpty = true;
            var gameData = this.data;
            gameData.players.forEach(function (player) {
                if (gameData.scores[player] !== 0) {
                    allEmpty = false;
                }
            });
            return allEmpty;
        },
        save: function (callback) {
            //save the game states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentGame = this.data;
            dynamodb.putItem({
                TableName: 'ScoreKeeperUserData',
                Item: {
                    CustomerId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadGame: function (session, callback) {
            if (session.attributes.currentGame) {
                console.log('get game from session=' + session.attributes.currentGame);
                callback(new Game(session, session.attributes.currentGame));
                return;
            }
            dynamodb.getItem({
                TableName: 'ScoreKeeperUserData',
                Key: {
                    CustomerId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentGame;
                if (err) {
                    console.log(err, err.stack);
                    currentGame = new Game(session);
                    session.attributes.currentGame = currentGame.data;
                    callback(currentGame);
                } else if (data.Item === undefined) {
                    currentGame = new Game(session);
                    session.attributes.currentGame = currentGame.data;
                    callback(currentGame);
                } else {
                    console.log('get game from dynamodb=' + data.Item.Data.S);
                    currentGame = new Game(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentGame = currentGame.data;
                    callback(currentGame);
                }
            });
        },
        newGame: function (session) {
            return new Game(session);
        }
    };
})();
module.exports = storage;
