/**
 * validate-json-locales
 * https://github.com/seventy-three/validate-json-locales.git
 *
 * Copyright (c) 2016 Florian Sey
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var _  = require('lodash');

/**
 * JSONFilesToMap() and compareMaps() taken from grunt-compare-json
 * (Removed the grunt dependency)
 * @see https://github.com/dpellier/compare-json
 */

/**
 * Convert files into js object :
 * {
 *   fileName: name of the file converted,
 *   parsedJSON: map of the JSON value
 * }
 * @param {Array} sources array of filepaths.
 * @returns {Array}.
 */
exports.JSONFilesToMap = function(sources) {

  var results = [];

  if (sources) {
    sources.forEach(function(source, idx) {
      var rawJSON = fs.readFileSync(source, 'utf-8');
      var parsedJSON = JSON.parse(rawJSON);
      results[idx] = {
        fileName: source,
        parsedJSON: parsedJSON
      };
    });
  }
  return results;
};

/**
 * Compare each json values and return a report with all missing key.
 * @param maps.
 * @returns {Array} an array of missing keys.
 */
exports.compareMaps = function(maps) {

  var reports = [];

  var isObject = function(obj) {
    return obj === Object(obj);
  };

  var compareRecursive = function(path, map, searchInto, fileName) {
    _.forOwn(map, function (value, key) {
      // check if the key is in the other files and that it's value is the same

      if (!(searchInto.hasOwnProperty(key) && (searchInto[key] != null))) {
        reports.push({
          key: path + key,
          value: undefined,
          message: 'Missing key: ' + path + key + '\t\t in file ' + fileName
        });
      } else {
        var subPath = ('' !== path ? path + key + '.' : key + '.');

        var mapValue = map[key];
        var searchIntoValue = searchInto[key];

        if (isObject(mapValue)) {
          compareRecursive(subPath, mapValue, searchIntoValue, fileName);
        }
      }
    });
  };

  if (maps) {
    maps.forEach(function (map, idx) {
      maps.forEach(function (searchInto, searchIdx) {
        if (searchIdx === idx) {
          return;
        }
        compareRecursive('', map.parsedJSON, searchInto.parsedJSON, searchInto.fileName);
      });
    });
  }
  return reports;
};

/**
 * Returns keys for which translations are empty or considered empty.
 * @param  {Object} parsedJSON a JSON object.
 * @param  {RegExp} treatAsEmptyRegExp a RegExp to test against translation value.
 * @param  {Array} allowedEmptyKeys an array of keys which value can be empty.
 * @return {Array} an array of empty translation keys { key, value, message }.
 */
exports.checkEmptyTranslations = function (parsedJSON, treatAsEmptyRegExp, allowedEmptyKeys) {

  if (!allowedEmptyKeys) {
    allowedEmptyKeys = [];
  }

  var emptyTranslationKeys = [];

  function checkRecursive(parsedJSON, key) {
    
    if (_.isString(parsedJSON)) {

      if (parsedJSON === '') {
        emptyTranslationKeys.push({
          key: key,
          value: parsedJSON,
          message: 'Key [' + key + '] is null or undefined or \'\'.'
        });
        return;
      }

      if (treatAsEmptyRegExp !== null && treatAsEmptyRegExp.test(parsedJSON)) {
        emptyTranslationKeys.push({
          key: key,
          value: parsedJSON,
          message: 'Key [' + key + '] is treated as empty value [' + parsedJSON + '] by RegExp [' + treatAsEmptyRegExp.source + '].'
        });
        return; 
      }

      return;
    }

    if (_.isObject(parsedJSON)) {
      _.forOwn(parsedJSON, function (value, k) {
        checkRecursive(value, key + (key !== '' ? '.' : '') + k);
      });
      return;
    }

    // console.warn('Key [' + key + '] is neither a string nor an object');

  }

  checkRecursive(parsedJSON, '');

  emptyTranslationKeys = emptyTranslationKeys.filter(function (emptyTranslation) {
    for (var i = 0; i < allowedEmptyKeys.length; i++) {
      if (emptyTranslation.key.indexOf(allowedEmptyKeys[i]) !== -1) {
        // console.info('Empty key [' + emptyTranslation.key + '] allowed by [' + allowedEmptyKeys[i] + ']');
        return false;
      }
    }
    return true;
  });

  return emptyTranslationKeys;
};

/**
 * Returns missing keys between JSON files.
 * @param  {Array} array of filepaths.
 * @param  {Array} array of keys to treat as not missing.
 * @return {Array}
 */
exports.checkMissingKeys = function(files, allowedMissingKeys) {
  var allParsedFiles = exports.JSONFilesToMap(files);
  var reports = exports.compareMaps(allParsedFiles)
    .filter(function (report) {
      for (var i = 0; i < allowedMissingKeys.length; i++) {
        if (report.key.indexOf(allowedMissingKeys[i]) !== -1) {
          // console.info('Missing key [' + report.key + '] allowed by [' + allowedMissingKeys[i] + ']');
          return false;
        }
      }
      return true;
    });

  return reports;
};
