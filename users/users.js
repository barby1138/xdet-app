var records = [
  { id: 'x0', username: 'admin', password: 'Passme!1', displayName: 'admin', emails: [{ value: 'jane@jane.co' }] },
  { id: 'u1', username: 'olitsis', password: 'Passme!1', displayName: 'olitsis', emails: [{ value: 'olitsis@jane.co' }] }
];

exports.findById = function (id, cb) {
  process.nextTick(function () {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.id === id) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}

exports.findByUsername = function (username, cb) {
  process.nextTick(function () {
    for (var i = 0, len = records.length; i < len; i++) {
      var record = records[i];
      if (record.username === username) {
        return cb(null, record);
      }
    }
    return cb(null, null);
  });
}
