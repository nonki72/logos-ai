'use strict';
const egw = require('./edgeglove/edgeglove_word.js');
const edgeglove_word = egw.edgeglove_word;
const egd = require('./edgeglove/edgeglove_data_75.js');
const edgeglove_data = egd.edgeglove_data;
const egc = require('./edgeglove/edgeglove.code.js');

exports.edgegloveFreqWords = egc.edgegloveFreqWords;
exports.edgegloveFreqWord = egc.edgegloveFreqWord;