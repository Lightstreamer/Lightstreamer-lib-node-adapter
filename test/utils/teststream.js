/*
Copyright (c) Lightstreamer Srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
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
