/*
 * Copyright (c) 2004-2012 Weswit s.r.l., Via Campanini, 6 - 20124 Milano, Italy.
 * All rights reserved.
 * www.lightstreamer.com
 *
 * This software is the confidential and proprietary information of
 * Weswit s.r.l.
 * You shall not disclose such Confidential Information and shall use it
 * only in accordance with the terms of the license agreement you entered
 * into with Weswit s.r.l.
 */

/**
 * Module import
 *
 */
var Stream = require('stream').Stream,
    EventEmitter = require('events').EventEmitter;

/**
 * Fake synchronous stream
 * 
 */
function TestStream(ignoreWrite) {

  var that, data = new Array();

  /**
   * Fake synchronous stream
   * 
   */
  function setEncoding(encoding) {
    // NOP
  }

  function write(chunk, encoding) {
    if (!ignoreWrite) {
      data.push(chunk);
    }
  }

  function pushTestData(chunk) {
    that.emit('data', chunk);
  }

  function popTestData() {
    return data.shift();
  }

  function dumpTestData() {
    console.log("Test data:");
    for (var i = 0; i < data.length; i++) {
        console.log(data[i]);
    }
    console.log("----------------------");
  }

  function getTestData() {
    return data;
  }

  that = {
    write: write,
    pushTestData: pushTestData,
    popTestData: popTestData,
    getTestData: getTestData,
    setEncoding: setEncoding,
    dumpTestData: dumpTestData
  };

  that.__proto__ = Stream.prototype;
  
  that.writable = true;

  return that;
}

exports.TestStream = TestStream;
