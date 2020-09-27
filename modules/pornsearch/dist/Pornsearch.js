'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _Modules = require('./core/Modules');

var _Modules2 = _interopRequireDefault(_Modules);

const puppeteer = require('puppeteer');
require('events').EventEmitter.defaultMaxListeners = 500

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GIF = 'gif';
var PARSER = 'Parser';
var VIDEO = 'video';
var USER_VIDEO = 'user_video';

var Pornsearch = function () {
  function Pornsearch(driver) {
    (0, _classCallCheck3.default)(this, Pornsearch);

    //console.log(driver)
    this.module = {};
    this.modules = _Modules2.default;
    this.browser = null;

    // TODO review
    this.driver(driver, "dummy");
  }

  (0, _createClass3.default)(Pornsearch, [{
    key: 'support',
    value: function support() {
      return this.modules.map(function (module) {
        return module.name;
      });
    }
  }, {
    key: 'current',
    value: function current() {
      return this.module.name;
    }
  }, {
    key: 'init',
    value: async function init() {
      //if (this.browser == null)
      this.browser = await puppeteer.launch(
      
        {
          //executablePath: 'google-chrome',
          headless:false, SIGHUP: false, handleSIGINT: false,
          args: [
            // Required for Docker version of Puppeteer
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // This will write shared memory files into /tmp instead of /dev/shm,
            // because Docker’s default for /dev/shm is 64MB
            '--disable-dev-shm-usage'
          ]
        });
    }
  }, {
    key: 'close',
    value: async function close() {
      this.browser.close();
    }
  }, {
    key: 'gifs',
    value: function gifs(query, page) {
      this.module.query = query;
      return this._get(this.module.gifUrl(page), GIF, page || this.module.firstpage);
    }
  }, {
    key: 'videos',
    value: function videos(query, page) {
      this.module.query = query;
      console.log(this.module.videoUrl);
      return this._get(this.module.videoUrl(page), VIDEO, page || this.module.firstpage);
    }
  }, {
    // wait js exec
    key: 'videos2',
    value: function videos2(query, page, wait_sel) {
      this.module.query = query;
      return this._get2(this.module.videoUrl(page), VIDEO, wait_sel);
    }
  }, {
    // wait js exec
    key: 'user_videos',
    value: function user_videos(query, page) {
      this.module.query = query;
      return this._get(this.module.user_videoUrl(page), USER_VIDEO);
    }
  }, {
    // wait js exec
    key: 'user_videos2',
    value: function user_videos2(query, page) {
      this.module.query = query;
      return this._get2(this.module.user_videoUrl(page), USER_VIDEO, this.module.user_videoSel());
    }
  }, {
    key: '_get',
    value: function _get(url, type, page) {
      var _this = this;
      //console.log(url);
      return new _promise2.default( function (resolve, reject) {
        _axios2.default.get(url, { timeout: 5000 })
        .then(async function (_ref) {
          var body = _ref.data;
          //console.log(_ref.status);
          //console.log(_ref.statusText);
          //console.log(_ref.headers);
          //console.log(_ref.config);
          //console.log(_ref.data);

          var l = _cheerio2.default.load(body)
          var data = await _this.module[type + PARSER](l, body);

          /*
          if (!data.length) {
            throw new Error('No results');
          }
          */

          resolve(data);
        }).catch(function (error) {
          console.warn(error);

          reject(new Error('No results for search related to ' + _this.module.query + ' in page ' + page));
        });
        
      });
    }
  }, {
    key: '_get2',
    value: function _get2(url, type, wait_sel) {
      var _this = this;

      return new _promise2.default( function (resolve, reject) {
       _this.browser.newPage()
        .then(function(page) {
          return page.goto(url, { timeout: 120000 } ).then(async function() {
              // site specific selector
              await page.waitFor(wait_sel)
              /*
              //const aElementsWithHi = await page.$x("//li/a[@data-page='next']"); 
              const aElementsWithHi = await page.$x("//li/a[@data-page='1']");
              await aElementsWithHi[0].click()
              await page.waitFor(5000)
              */
              const html = await page.content()    
              await page.close();
              return html
          });
        })
        .then(async function(html) {
          //console.log(html);

          var data = await _this.module[type + PARSER](_cheerio2.default.load(html), html);

          /*
          if (!data.length) {
            throw 'No results';
          }
          */

          resolve(data);
        })
        .catch(function(err) {
          //handle error
          reject(err);
        });

      });

    }
  }, {
    key: 'driver',
    value: function driver() {
      var _driver = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'pornhub';

      var query = arguments[1];

      var PornModule = this.modules[_driver.toLowerCase()];

      if (!PornModule) {
        throw new Error('We don\'t support ' + _driver + ' by now =/');
      }

      this.module = new PornModule(query || this.query);

      return this;
    }
  }, {
    key: 'query',
    get: function get() {
      return this.module.query || '';
    }
  }], [{
    key: 'search',
    value: function search(query) {
      return new Pornsearch(query);
    }
  }]);
  return Pornsearch;
}();

exports.default = Pornsearch;
module.exports = exports['default'];