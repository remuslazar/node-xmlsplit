/*global module console require Buffer */

var util = require('util')
  , Transform = require('stream').Transform

// transforms a big XML file into smaller chunks of valid xml documents
util.inherits(XmlSplit, Transform)

function XmlSplit(batchSize, options) {
  Transform.call(this, options)

  this._header = null
  this._headerEndTag = null
  this._rawHeader = []
  this._sawFirstDelim = false
  this._tag = null
  this._data = ""
  this._index = 0
  this._buffer = []
  this._batchSize = batchSize
}

XmlSplit.prototype._flush = function(done) {
  if (this._buffer.length) {
    this.push(this._header + this._buffer.join('') + this._headerEndTag)
    this._buffer = [] // just in case
  }
  done()
}

XmlSplit.prototype._transform = function(chunk, encoding, done) {
  if (!this._header) {
    // check if we have the full xml header in the input data
    var split = -1
    var found = 0

    for (var i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0x3e) { // '>'
        if (this._sawFirstDelim) {
          split = i
          break
        } else {
          this._sawFirstDelim = true
        }
      }
    }

    if (split === -1) {
      // still waiting for the full xml header, stash the chunk
      this._rawHeader.push(chunk)
    } else {
      var h = chunk.slice(0, split+1) // include the last > in the header data
      this._rawHeader.push(h)
      this._header = Buffer.concat(this._rawHeader).toString()
      var tag = this._header.match(/<\w+/mg)
      if (tag) {
        this._headerEndTag = '</' + tag.shift().slice(1) + '>'
      } else {
        this.emit('error', new Error('invalid xml data'))
      }
      this._data = chunk.slice(split+1).toString()
      this.emit('header', this._header + this._headerEndTag)
    }
  } else {
    this._data += chunk.toString()
  }

  // process the data if available
  if (this._data) {

    if (!this._tag) {
      var tag = this._data.match(/<\w+/mg)
      if (tag) {
        this._tag = tag.shift().slice(1)
      }
    }

    if (this._tag) {
      var token = '</' + this._tag + '>'
      var dataChunks = this._data.split(token)
      if (dataChunks.length > 1) {
        var lastChunkIndex = dataChunks.length-1
        dataChunks.forEach(function(dataChunk, index) {
          if (index === lastChunkIndex) {
            this._data = dataChunk
          } else {
            if (this._batchSize) {
              this._buffer.push(dataChunk + token)
            } else {
              // push directly for perf. reasons
              this.push(this._header + dataChunk + token + this._headerEndTag)
            }
            this._index++
          }
        }, this)
      }
      while (this._batchSize && this._buffer.length >= this._batchSize) {
        this.push(this._header + this._buffer.splice(0,this._batchSize).join('') + this._headerEndTag)
      }
    }

  }

  done()
}

module.exports = XmlSplit
