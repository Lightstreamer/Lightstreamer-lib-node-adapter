import { DataProvider, MetadataProvider } from '../index.js';

import { TestStream } from './utils/teststream.js';
import { expect } from './utils/expect.mjs';

var currProtocolVersion = "1.9.1";

function testInitialization() {
  const reqRespStream = new TestStream();
  const dataProvider = new DataProvider(reqRespStream);
  const test = expect();

  test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  dataProvider.on('init', function(message, response) {
    test.equal(message.parameters["P1"], "V1");
    test.equal(message.parameters["P2"], "V2");
    test.equal(message.parameters["keepalive_hint.millis"], null);
    test.equal(message.initResponseParams, null);
    response.success();
    test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
    test.done();
  });
  reqRespStream.pushTestData("ID0|DPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n");
  return test.finished;
}

function testFailedInitialization() {
  const reqRespStream = new TestStream();
  const dataProvider = new DataProvider(reqRespStream);
  const test = expect();

  test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  dataProvider.on('init', function(message, response) {
    response.error("An exception", "data");
    test.equal(reqRespStream.popTestData(), "ID0|DPI|ED|An+exception\n");
    test.done();
  });
  reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  return test.finished;
}

function testSubscribeWithSnapshot() {
  function isSnapshotAvailable(itemName) {
    test.equal(itemName, "An Item Name");
    return true;
  }
  const reqRespStream = new TestStream();
  const dataProvider = new DataProvider(reqRespStream, isSnapshotAvailable, null);
  const test = expect();

  test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  dataProvider.on('subscribe', function(itemName, response) {
    test.equal(itemName, "An Item Name");
    response.success();
    test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
    test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
    test.equal(reqRespStream.popTestData(), null);
    test.done();
  });
  reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
  return test.finished;
}

function testFailedSubscribe() {
  const reqRespStream = new TestStream();
  const dataProvider = new DataProvider(reqRespStream);
  const test = expect();

  test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  dataProvider.on('subscribe', function (itemName, response) {
    response.error("An exception", "subscription");
    test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
    test.equal(reqRespStream.popTestData(), "FAKEID|SUB|EU|An exception\n");
    test.done();
  });
  reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  reqRespStream.pushTestData("FAKEID|SUB|S|An Item Name\r\n");
  return test.finished;
}

function testUnsubscribe() {
  const reqRespStream = new TestStream();
  const dataProvider = new DataProvider(reqRespStream);
  const test = expect();

  test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  dataProvider.on('unsubscribe', function(itemName, response) {
      test.equal(itemName, "An Item Name");
      response.success();
      test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
      test.equal(reqRespStream.popTestData(), "FAKEID|USB|V\n");
      test.done();
  });
  reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  reqRespStream.pushTestData("FAKEID|USB|S|An Item Name\r\n");
  return test.finished;
}

function testUpdateByHash() {
  var fake = "";
  const reqRespStream = new TestStream();
  const dataProvider = new DataProvider(reqRespStream);
  const test = expect();

  test.equal(reqRespStream.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  dataProvider.on('subscribe', function (itemName, response) {
    response.success();
    test.equal(reqRespStream.popTestData(), "ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\n");
    test.equal(reqRespStream.popTestData(), "FAKEID|SUB|V\n");
    dataProvider.update("AnItemName", true,
      {
        "field1": "A string",
        "field2": "",
        "field3": null,
        "field4": 12.4,
        "field5": true,
        "field6": 0,
        "field7": NaN,
        "field8": fake.undef, //fake does not have an undef property
        "field9": false
      });
    test.equal(reqRespStream.popTestData().substring(13), "|EOS|S|AnItemName|S|FAKEID\n");
    test.equal(reqRespStream.popTestData().substring(13), "|UD3|S|AnItemName|S|FAKEID|B|1|" +
      "S|field1|S|A string|S|field2|S|$|S|field3|S|#|" +
      "S|field4|S|12.4|S|field5|S|true|S|field6|S|0|" +
      "S|field7|S|NaN|S|field8|S|undefined|S|field9|S|false\n");
    test.done();
  });

  reqRespStream.pushTestData("ID0|DPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  reqRespStream.pushTestData("FAKEID|SUB|S|AnItemName\r\n");
  return test.finished;
}

function testMDInitSuccess() {
  const s = new TestStream();
  const mp = new MetadataProvider(s);
  const test = expect();

  test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  mp.on('init', function(msg, resp) {
      test.equal(msg.parameters["P1"], "V1");
      test.equal(msg.parameters["P2"], "V2");
      test.equal(msg.parameters["keepalive_hint.millis"], null);
      test.equal(msg.initResponseParams, null);
      resp.success();
      test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
      test.done();
  });
  s.pushTestData("ID0|MPI|S|P1|S|V1|S|ARI.version|S|" + currProtocolVersion + "|S|P2|S|V2|S|keepalive_hint.millis|S|8000\r\n");
  return test.finished
}

function testMDInitFailure() {
  const s = new TestStream();
  const mp = new MetadataProvider(s);
  const test = expect();

  test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  mp.on('init', function(msg, resp) {
      resp.error("An error");
      test.equal(s.popTestData(), "ID0|MPI|E|An+error\n");
      test.done();
  });
  s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  return test.finished;
}

function testMDNotifyNewSessionSuccess() {
  const s = new TestStream();
  const mp = new MetadataProvider(s);
  const test = expect();

  test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  mp.on("notifyNewSession", function(msg, resp) {
      test.equal(msg.verb, "notifyNewSession");
      resp.success();
      test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
      test.equal(s.popTestData(), "FAKEID|NNS|V\n");
      test.done();
  });
  s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  s.pushTestData("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\n");
  return test.finished;
}

function testMDNotifyNewSessionFailure() {
  const s = new TestStream();
  const mp = new MetadataProvider(s);
  const test = expect();

  test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  mp.on("notifyNewSession", function(msg, resp) {
      resp.error("An error");
      test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
      test.equal(s.popTestData(), "FAKEID|NNS|E|An error\n");
      test.done();
  });
  s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  s.pushTestData("FAKEID|NNS|S|user|S|FAKESESSID|S|prop1|S|val1|S|prop2|S|val2\n");
  return test.finished;
}

function testMDNotifyMpnDeviceAccessSuccess() {
  const s = new TestStream();
  const mp = new MetadataProvider(s);
  const test = expect();

  test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  mp.on("notifyMpnDeviceAccess", function (msg, resp) {
    test.equal(msg.verb, "notifyMpnDeviceAccess");
    resp.success();
    test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
    test.equal(s.popTestData(), "FAKEID|MDA|V\n");
    test.done();
  });
  s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  s.pushTestData("FAKEID|MDA|S|user|S|FAKESESSID|P|A|S|appID|S|deviceToken\n");
  return test.finished;
}

function testMDNotifyMpnDeviceAccessFailure() {
  const s = new TestStream();
  const mp = new MetadataProvider(s);
  const test = expect();

  test.equal(s.popTestData(), "1|RAC|S|enableClosePacket|S|true|S|SDK|S|Node.js+Adapter+SDK\n");
  mp.on("notifyMpnDeviceAccess", function(msg, resp) {
      var excData = {clientCode: -2, clientMessage: "Message for the client"};
      resp.error("An error", "credits", excData);
      test.equal(s.popTestData(), "ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\n");
      test.equal(s.popTestData(), "FAKEID|MDA|EC|An error|-2|Message for the client\n");
      test.done();
  });
  s.pushTestData("ID0|MPI|S|ARI.version|S|" + currProtocolVersion + "\r\n");
  s.pushTestData("FAKEID|MDA|S|user|S|FAKESESSID|P|A|S|appID|S|deviceToken\n");
  return test.finished;
}

(async function main() {
  const to = setTimeout(() => {
    console.log('TEST FAILURE: timeout expired')
    process.exit(1)
  }, 3000)
  try {
    // DataProvider tests
    await testInitialization()
    await testFailedInitialization()
    await testSubscribeWithSnapshot()
    await testFailedSubscribe()
    await testUnsubscribe()
    await testUpdateByHash()
    // MetaDataProvider tests
    await testMDInitSuccess()
    await testMDInitFailure()
    await testMDNotifyNewSessionSuccess()
    await testMDNotifyNewSessionFailure()
    await testMDNotifyMpnDeviceAccessSuccess()
    await testMDNotifyMpnDeviceAccessFailure()
    console.log('OK')
  } catch(e) {
    console.error('TEST FAILURE:', e)
    process.exit(1)
  } finally {
    clearTimeout(to)
  }
})();