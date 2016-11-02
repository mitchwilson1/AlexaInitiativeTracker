'use strict';
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');

var APP_ID = undefined;//replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var skillContext = {};

/**
 * ScoreKeeper is a child of AlexaSkill.
 */
var ScoreKeeper = function () {
    AlexaSkill.call(this, APP_ID);
    skillContext.needMoreHelp = true;
};


// Extend AlexaSkill
ScoreKeeper.prototype = Object.create(AlexaSkill.prototype);
ScoreKeeper.prototype.constructor = ScoreKeeper;

eventHandlers.register(ScoreKeeper.prototype.eventHandlers, skillContext);
intentHandlers.register(ScoreKeeper.prototype.intentHandlers, skillContext);

module.exports = ScoreKeeper;

