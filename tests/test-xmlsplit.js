var fs = require('fs')
  , path = require('path')
  , should = require('should')
  , XmlSplit = require('../lib/xmlsplit')

describe('XmlSplit', function() {

  var firstDoc

  describe('basic parsing features', function() {
    var xmlSplit, firstDoc

    before(function() {
      firstDoc = fs.readFileSync(path.resolve(__dirname, 'fixtures/first_item.xml'), 'utf8')
    })

    beforeEach(function() {
      xmlSplit = new XmlSplit()
      var stream = fs.createReadStream(path.resolve(__dirname, 'fixtures/items.xml'))
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

  describe('streaming related features', function() {

    before(function() {
      firstDoc = fs.readFileSync(path.resolve(__dirname, 'fixtures/first_item.xml'), 'utf8')
    })

    it('input stream line by line', function(done) {
      var xmlSplit = new XmlSplit()
      fs.readFileSync(path.resolve(__dirname, 'fixtures/items.xml'), 'utf8')
      .split(/\n/)
      .forEach(function(line) {
        xmlSplit.write(line + "\n", 'utf8')
      })
      xmlSplit.end()

      var count=0
      xmlSplit.on('data', function(data) {
        count++
        if (count === 1) {
          data.toString().should.eql(firstDoc.trim())
        }
      }).on('header', function(header) {
        header.should.be.not.empty()
      }).on('end', function() {
        done()
      })
    })
  })

  describe('Batch size feature', function() {
    it('number of chunks fixtures', function(done) {
      // checks if the number of chunks while using a batchsize > 2 is correct
      var batchSizes = [2,3,5,10,20,100]
      batchSizes.forEach(function(batchSize, index) {
        var xmlSplit = new XmlSplit(batchSize)
        var stream = fs.createReadStream(path.resolve(__dirname, 'fixtures/items.xml'))
        stream.pipe(xmlSplit)
        var count = 0
        xmlSplit.on('data', function(data) {
          count++
        }).on('end', function() {
          var expectedNumberOfChunks = batchSize < 10 ? Math.ceil(10 / batchSize) : 1
          count.should.be.eql(expectedNumberOfChunks)
          if (index === batchSizes.length-1) done()
        })
      })
    })
  })

})
