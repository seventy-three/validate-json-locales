/**
 * validate-json-locales
 * https://github.com/seventy-three/validate-json-locales.git
 *
 * Copyright (c) 2016 Florian Sey
 * Licensed under the MIT license.
 */

'use strict';

var assert = require('assert');
var utils = require('../lib/utils');

describe('#JSONFilesToMap', function() {
  it('should return an empty array if no arguments is passed', function() {
    var results = utils.JSONFilesToMap();

    assert.deepEqual(results, []);
  });

  it('should return a correct object', function() {
    var sources = ['test/fixtures/fileA.json'];

    var results = utils.JSONFilesToMap(sources);

    assert.ok(results.length > 0);
    assert.strictEqual(results[0].fileName, 'test/fixtures/fileA.json');
    assert.strictEqual(results[0].parsedJSON['JSON.string.1'], 'string1');
  });

  it('should handle file with BOM', function () {
    var sources = ['test/fixtures/fileWithBOM.json'];
    var results = utils.JSONFilesToMap(sources);
    assert.ok(results.length > 0);
  });
});


describe('#compareMaps', function() {
  it('should return an empty array if no arguments is passed', function() {
    var reports = utils.compareMaps();

    assert.deepEqual(reports, []);
  });

  it('should return an empty array if no differences are found', function() {
    var values = {"a": "a", "b": "b"};
    var maps = [
      {parsedJSON: values, fileName: 'fileA'},
      {parsedJSON: values, fileName: 'fileB'}
    ];

    var reports = utils.compareMaps(maps);

    assert.deepEqual(reports, []);
  });

  it('should return the missing key if some differences are found', function() {
    var valueA = {"a": "a", "b": "b"};
    var valueB = {"b": "b"};
    var maps = [
      {parsedJSON: valueA, fileName: 'fileA'},
      {parsedJSON: valueB, fileName: 'fileB'}
    ];

    var reports = utils.compareMaps(maps);

    assert.equal(reports.length, 1);
  });


  it('should return the missing key if some differences are found inside of sub-objects', function() {
    var valueA = {"a": {"me":"a","mo":"a"}, "b": "b"};
    var valueB = {"a": {"me":"a"}, "b": "b"};
    var maps = [
      {parsedJSON: valueA, fileName: 'fileA'},
      {parsedJSON: valueB, fileName: 'fileB'}
    ];

    var reports = utils.compareMaps(maps);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].key, 'a.mo');
  });
});

describe('#checkMissingKeys', function () {

  it('should return missing keys except the allowed ones', function () {

    var reports = utils.checkMissingKeys([
      'test/fixtures/missingKeysA.json',
      'test/fixtures/missingKeysB.json'
    ], ['key1.key3', 'key4']);

    assert.equal(reports.length, 1);
    assert.equal(reports[0].key, 'key1.key7');
  });

});

describe('#checkEmptyTranslations', function () {

  var data = {
    "key1": "value1",
    "key2": "",
    "key3": null,
    "key5": {
      "key6": "value6",
      "key7": ""
    },
    "key8": "_MISSING_"
  };

  it('should return translation keys with empty values', function () {
    var reports = utils.checkEmptyTranslations(data, null);
    assert.equal(reports[0].key, 'key2');
    assert.equal(reports[1].key, 'key5.key7');
  });

  it('should return translation keys with empty values with custom epmty values', function () {
    var reports = utils.checkEmptyTranslations(data, /^_.+_$/);
    assert.equal(reports[0].key, 'key2');
    assert.equal(reports[1].key, 'key5.key7');
    assert.equal(reports[2].key, 'key8');
  });

  it('should return translation keys with empty values with custom epmty values', function () {
    var reports = utils.checkEmptyTranslations({
      "key1": {
        "key2": "value2",
        "key3": "",
        "key4": ""
      }
    }, null, ['key1.key3']);
    assert.equal(reports.length, 1);
    assert.equal(reports[0].key, 'key1.key4');
  });

});
