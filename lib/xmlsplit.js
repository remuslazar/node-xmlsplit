/*global module console require Buffer */

var util = require('util')
  , Transform = require('stream').Transform

// transforms a big XML file into smaller chunks of valid xml documents
util.inherits(XmlSplit, Transform)

function XmlSplit(batchSize, tagName, options) {
  Transform.call(this, options)

  this._header = null
  this._headerEndTag = null
  this._tag = null
  this._data = ""
  this._index = 0
  this._buffer = []
  this._batchSize = batchSize
  this._tagName = tagName
}

XmlSplit.prototype._flush = function(done) {
  if (this._buffer.length) {
    this.push(this._header + this._buffer.join('') + this._headerEndTag)
    this._buffer = [] // just in case
  }
  done()
}

XmlSplit.prototype._transform = function(chunk, encoding, done) {
  this._data += chunk.toString()

  if (!this._header) {
    // check if we have the full xml header in the input data
    var res = (/<(\w+)[>\s]/mg).exec(this._data)
    if (res !== null) {
      var tagName = res[1]
      this._headerEndTag = '</' + tagName + '>'
      this._header = this._data.slice(0,res.index+1)
      this._data = this._data.slice(res.index+1)
    }
  }

  // process the data if available
  if (this._header && this._data) {

    if (!this._tag) {
      // if there is a preconfigured tag, try to find that one, else autodetect
      var re = this._tagName ? new RegExp('<('+this._tagName+')','mgi')
             : /<(\w+)[\s>]/mg

      var res = re.exec(this._data)
      if (res !== null) {
        var tagName = res[1]
        this._tag = tagName
        this._header += this._data.slice(0,res.index)
        this.emit('header', this._header + this._headerEndTag)
        this._data = this._data.slice(res.index)
      }
    }

    if (this._tag && this._data) {
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
        this.push( this._header
                 + this._buffer.splice(0,this._batchSize).join('')
                 + this._headerEndTag)
      }
    }

  }

  done()
}

module.exports = XmlSplit
