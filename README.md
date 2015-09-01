XmlSplit
========

Abstract
--------

This utility helps you dealing with (very) large XML input files, splitting them
into smaller chunks of valid XML files, which can be processed sequentially (in memory)
using e.g. libxmljs.

This implementation uses the Node.js
[stream.Transform API](https://nodejs.org/api/stream.html#stream_class_stream_transform_1).


Motivation
----------

Performance.

There are other (very useful) libs available, like

* https://github.com/assistunion/xml-stream
* https://github.com/StevenLooman/saxpath

to name a few, because of the xml parsing behind the scenes, the performance is
not quite good enough for some applications.

To handle the XML parsing part, plain JavaScript Strings and methods (.slice, split)
are being used, for obvious reasons.


Example
-------

An example XML input file could look something like

```
<?xml version = '1.0' encoding = 'UTF-8'?>
<product_export  date="2015-06-19">
    <product id=1> ... </product>
    <product id=2> ... </product>
    ...
</product_export>
```

Using this code snippet:

```
var XmlSplit = require('./lib/xmlsplit.js')

var xmlsplit = new XmlSplit()
var inputStream = fs.createReadStream() // from somewhere

inputStream.pipe(xmlsplit).on('data', function(data) {
    var xmlDocument = data.toString()
    // do something with xmlDocument ..
})
```

You will get a full valid XML document on each iteration:

```
<?xml version = '1.0' encoding = 'UTF-8'?>
<product_export  date="2015-06-19">
    <product id=1> ... </product>
</product_export>
```

```
<?xml version = '1.0' encoding = 'UTF-8'?>
<product_export  date="2015-06-19">
    <product id=2> ... </product>
</product_export>
```

License
-------

See [LICENSE.txt](LICENSE.txt)
