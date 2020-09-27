'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Sex = require('../modules/Sex');

var _Sex2 = _interopRequireDefault(_Sex);

var _Pornhub = require('../modules/Pornhub');

var _Pornhub2 = _interopRequireDefault(_Pornhub);

var _Pornmd = require('../modules/PornMD');

var _Pornmd2 = _interopRequireDefault(_Pornmd)

var _Redtube = require('../modules/Redtube');

var _Redtube2 = _interopRequireDefault(_Redtube);

var _Xvideos = require('../modules/Xvideos');

var _Xvideos2 = _interopRequireDefault(_Xvideos);

var _Xhamster = require('../modules/Xhamster');

var _Xhamster2 = _interopRequireDefault(_Xhamster);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  pornmd: _Pornmd2.default,
  sex: _Sex2.default,
  pornhub: _Pornhub2.default,
  redtube: _Redtube2.default,
  xvideos: _Xvideos2.default,
  xhamster: _Xhamster2.default
};
module.exports = exports['default'];