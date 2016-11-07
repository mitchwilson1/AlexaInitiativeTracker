'use strict';
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');

var APP_ID = 'amzn1.ask.skill.f0e269a8-d6ab-47b5-8cab-f126dcccc8e3'
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

