const USER_ID = 'x0'

const fs = require('fs')

const db = require('./modules/db')

function readLines(input, func) {
  let remaining = ''

  input.on('data', function(data) {
    remaining += data;
    var index = remaining.indexOf('\n')
    while (index > -1) {
      var line = remaining.substring(0, index)
      remaining = remaining.substring(index + 1)
      func(line)
      index = remaining.indexOf('\n')
    }
  })

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
  })
}

function func_kw(data) {
    var res = data.split(",")
    if (res.length > 0) {
      var key = res[0]
      var val = res[1]
      console.log(key + ': ' + val)

    //db.addKW(USER_ID, { "KW" : key, "priority" : val }, (err) => { if (err) console.log(err) } )
    }
}

function func_markers(data) {
  var res = data.split(",")
  if (res.length > 0) {
    var key = res[0]
    var val = ""
    for(var i = 1; i < res.length; i++) {
      if (res[i].replace(/\s/g, '').length == 0)
        break

      if (val.length > 0)
        val +=  ","
      val += res[i]
    }
    console.log(key + ': ' + val)

    db.addMarker(USER_ID, { "Marker" : key, "Title" : val }, (err) => { if (err) console.log(err) } )
  }
}

//var input = fs.createReadStream('./docs/kw.csv')

//var input = fs.createReadStream('./docs/uf-wow-titles.csv')
//readLines(input, func_markers)
