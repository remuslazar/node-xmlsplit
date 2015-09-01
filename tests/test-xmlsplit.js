var fs = require('fs')
  , path = require('path')
  , should = require('should')
  , XmlSplit = require('../lib/xmlsplit')

describe('XmlSplit', function() {

  var xmlSplit, firstDoc

  beforeEach(function() {
    xmlSplit = new XmlSplit()
    var stream = fs.createReadStream(path.resolve(__dirname, 'fixtures/items.xml'))
    firstDoc = fs.readFileSync(path.resolve(__dirname, 'fixtures/first_item.xml'), 'utf8')
    stream.pipe(xmlSplit)
  })

  it('should detect the header correctly', function(done) {
    xmlSplit.on('header', function(header) {
      header.should.match(/<?xml/)
      header.should.not.match(/<item(\s+|>)/)
      done()
    })
  })

  it('should split all items', function(done) {
    var count = 0
    xmlSplit.on('data', function(data) {
      count++
    }).on('end', function() {
      count.should.be.eql(10)
      done()
    })
  })

  it('should split first item', function(done) {
    xmlSplit.on('data', function(data) {
      data.toString().should.eql(firstDoc.trim())
      done() // dont care about all remining items
    })
  })

})
