# Lightstreamer SDK for Node Adapters #
Compatible with Adapter Remoting Infrastructure since 1.4.3

This package includes the resources needed to write Data Adapters and Metadata Adapters for Lightstreamer Server in a node environment. 
The adapters will run in a separate process, communicating with the Server through the Adapter Remoting Infrastructure.

## Use ##
Install the package using npm
```
npm install lightstreamer-adapter
```

### Configure Lightstreamer ###
1.    Download and install Lightstreamer
2.    Go to the "adapters" folder of your Lightstreamer Server installation. Create a new folder to deploy the remote adapters in, let's call it "NodeAdapter", and a "lib" folder inside it.
3.    Copy the "ls-proxy-adapters.jar" file from "Lightstreamer/DOCS-SDKs/sdk_adapter_remoting_infrastructure/lib" in the newly created "lib" folder.
4.    Create an "adapters.xml" file inside the "NodeAdapter" folder and use the following contents (this is an example configuration, you can modify it to your liking by following the adapter remoting infrastructure documentation):
```xml      
<?xml version="1.0"?>
<adapters_conf id="PROXY_NODE">
        <metadata_provider>
                <adapter_class>com.lightstreamer.adapters.remote.metadata.RobustNetworkedMetadataProvider</adapter_class>
                <param name="request_reply_port">8003</param>
                <param name="timeout">36000000</param>
        </metadata_provider>
        <data_provider>
                <adapter_class>com.lightstreamer.adapters.remote.data.RobustNetworkedDataProvider</adapter_class>
                <param name="request_reply_port">8001</param>
                <param name="notify_port">8002</param>
                <param name="timeout">36000000</param>
        </data_provider>
</adapters_conf>
```

5.    Take note of the ports configured in the adapters.xml file as those are needed to write the remote part of the adapters.

### Write The Adapters ###
Create a .js file, let's call it "adapters.js"

1.    Get the net package and create the connections to Lightstreamer server. Note that the ports are the same used in the above file; LIGHTSTREAMER_SERVER_HOST is the host of the Lightstreamer server e.g.: "localhost".
```js
var net = require('net'),
    reqRespStream = net.createConnection(8001, LIGHTSTREAMER_SERVER_HOST),
    notifyStream = net.createConnection(8002, LIGHTSTREAMER_SERVER_HOST),
    metadataStream = net.createConnection(8003, LIGHTSTREAMER_SERVER_HOST);
```

2.    Get the adapter classes and create the needed instances
```js
var MetadataProvider = require('lightstreamer-adapter').MetadataProvider,
DataProvider = require('lightstreamer-adapter').DataProvider,
dataProvider = new DataProvider(reqRespStream, notifyStream),
metadataProvider = new MetadataProvider(metadataStream);
```

3.    Now you can register the events to respond to the adapters duties; see the documentation for the details
```js
dataProvider.on('subscribe', function(itemName, response) {
        //HERE start sending updates for the itemName item
        response.success();
});
dataProvider.on('unsubscribe', function(itemName, response) {
        //HERE stop sending updates for the itemName item
        response.success();
});
metadataProvider.on('notifyUserMessage', function(request, response) {
        //HERE handle user message
        response.success();
});
```

4.    Send updates for an item:
```js
dataProvider.update(itemName, false, {
        'field1': valField1,
        'field2': valField2
});
```

### Run ###
From the command line call
```
node adapters.js
```

### Connect A Client ###
```js
var lsClient = new LightstreamerClient(LIGHTSTREAMER_SERVER_HOST,"PROXY_NODE");
lsClient.connect();
```

note that the "PROXY_NODE" string is taken from the adapters.xml

### API reference ###
At the time of writing API docs are not deployed anywhere so you have to generate it yourself (see below how to do so). We will deploy them somewhere online at some point.

## Develop ##
This section is dedicated to developers who want to extend/modify the library itself, if you're simply looking to use it, ignore it.

### Linking ###
We want to write code to use our package by requiring "lightstreamer-adapter" without having to specify the full path. 
On the other hand during development we do not want to install the package from the repo as we want in fact test it before put it on the repo for everyone else to enjoy.
So:

1.    Go to the root of this project
2.    Call
```
npm link
```

3.    Go to the project where you need to use the development version of the package
4.    Call
```
npm link lightstreamer-adapter
```

NOTE: you can't globally link the package (using -g) to make it available everywhere   

### Testing ###
First install nodeunit
```
npm -g install nodeunit
```

the -g unit will install it on the system instead of installing it locally, you may remove it if you prefer a local installation
  
Go to the test folder and run the following commands
```
nodeunit dataprotocol.test.js
nodeunit dataprovider.test.js
nodeunit metadataprotocol.test.js
nodeunit metadataprovider.test.js
```

### Generate Documentation ###
1.    Get [JSDoc 3](https://github.com/jsdoc3/jsdoc "JSDoc 3")
2.    Assuming you have the jsdoc folder in your path, go to this project folder and call
```
jsdoc --recurse --destination docs lib
```

The API documentation will be available in the docs folder.

## See Also ##
* [Adapter Remoting Infrastructure Network Protocol Specification](http://www.lightstreamer.com/latest/Lightstreamer_Allegro-Presto-Vivace_5_1_Colosseo/Lightstreamer/DOCS-SDKs/sdk_adapter_remoting_infrastructure/doc/ARI%20Protocol.pdf "Lightstreamer ARI protocol")
* [Lightstreamer Chat Demo adapter for Node](https://github.com/Weswit/Lightstreamer-example-Chat-adapter-node "Lightstreamer Chat Demo adapter for Node")
