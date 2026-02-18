'use strict';

// monket patch for: Testing http_input_test.js.Fatal error: os.tmpDir is not a function
require('os').tmpDir = require('os').tmpdir;

var Phant = require('../index'),
  path = require('path'),
  Keychain = require('phant-keychain-hex'),
  Meta = require('phant-meta-nedb'),
  Storage = require('phant-stream-csv'),
  request = require('request'),
  rimraf = require('rimraf'),
  app = Phant(),
  http_port = 8080;
//http_port = 9888;

var keys = Keychain({
  publicSalt: 'public salt',
  privateSalt: 'private salt'
});

var meta = Meta({
  directory: path.join(__dirname, 'tmp')
});

var stream = Storage({
  directory: path.join(__dirname, 'tmp'),
  cap: 1024,
  chunk: 96
});

var validator = Phant.Validator({
  metadata: meta
});

var httpInput = Phant.HttpInput({
  throttler: Phant.MemoryThrottler(),
  validator: validator,
  keychain: keys
});

Phant.HttpServer.listen(http_port);
Phant.HttpServer.use(httpInput);

app.registerInput(httpInput);
app.registerOutput(stream);

var test_stream = {
  title: 'input test',
  description: 'this should be deleted by the test',
  fields: ['test1', 'test2'],
  tags: ['input test'],
  hidden: false
};

exports.create = function(test) {

  test.expect(1);

  meta.create(test_stream, function(err, stream) {

    test.ok(!err, 'should not error');

    test_stream = stream;

    test.done();

  });

};

exports.input = {

  'log get txt': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' +
      keys.publicKey(test_stream.id) + '.txt?private_key=' +
      keys.privateKey(test_stream.id) + '&test1=get&test2=txt';

    test.expect(4);

    request(url, function(error, response, body) {

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.equal(body, '1 success\n', 'should return a success message');

      test.done();

    });

  },

  'log get json': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' +
      keys.publicKey(test_stream.id) + '.json?private_key=' +
      keys.privateKey(test_stream.id) + '&test1=get&test2=json';

    test.expect(4);

    request(url, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'json should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'json status should be 200');

      test.ok(body.success, 'json should return a JSON object with success == true');

      test.done();

    });

  },

  'log post txt': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: 'post',
        test2: 'txt'
      }
    };

    request(options, function(error, response, body) {

      test.ok(!error, 'txt should not error');

      test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

      test.equal(response.statusCode, 200, 'txt status should be 200');

      test.equal(body, '1 success\n', 'txt should return a success message');

      test.done();

    });

  },

  'log post json': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.json',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: 'post',
        test2: 'json'
      }
    };

    request(options, function(error, response, body) {

      body = JSON.parse(body.trim());

      test.ok(!error, 'json should not error');

      test.ok(response.headers['content-type'].match('^application/json'), 'content-type should be application/json');

      test.equal(response.statusCode, 200, 'json status should be 200');

      test.ok(body.success, 'json should return a JSON object with success == true');

      test.done();

    });

  },

  'log post jsonp': function(test) {

    test.expect(4);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.json?callback=phant_jsonp_test',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: 'post',
        test2: 'jsonp'
      }
    };

    request(options, function(error, response, body) {

      var phant_jsonp_test = function(obj) {
        return obj;
      };

      var result = eval(body); // jshint ignore:line

      test.ok(!error, 'should not error');

      test.ok(response.headers['content-type'].match('^text/javascript'), 'content-type should be text/javascript');

      test.equal(response.statusCode, 200, 'status should be 200');

      test.ok(result.success, 'should return an object with success == true');

      test.done();

    });

  },

  'log post 100k': function(test) {

    test.expect(3);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
      method: 'POST',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      },
      form: {
        test1: '',
        test2: 'txt'
      }
    };

    for (var i = 0; i < 102400; i++) {
      options.form.test1 += 'x';
    }

    request(options, function(error, response, body) {

      test.ok(!error, 'should not error');
      test.equal(response.statusCode, 413, 'status should be 413');
      test.ok(/exceeded/.test(body), 'body should contain error message');

      test.done();

    });

  },

  // http.maxHeaderSize can be overridden by max-http-header-size (nodejs >12.6, >10.15)
  // https://nodejs.org/api/cli.html#cli_max_http_header_size_size (16KB on nodejs 14 by default)
  // in package.json
  //     "start": "node --max-http-header-size=16384 server.js",

  'log get 32k': function(test) {

    var url = 'http://localhost:' + http_port + '/input/' +
      keys.publicKey(test_stream.id) + '.txt?private_key=' +
      keys.privateKey(test_stream.id) + '&test1=get&test2=';

    test.expect(5);

    for (var i = 0; i < 32768; i++) {
      url += 'x';
    }
    request(url, function(error, response, body) {
      // response.maxHeaderSize: undefined
      //console.log(error);
      //console.log(response);
      // console.log(response.statusMessage);
      // console.log(response.statusCode);
      test.ok(!error, 'should not error');

      test.ok(response.headers['connection'].match('^close'), 'connection should be closed');

      test.equal(response.statusMessage, 'Request Header Fields Too Large', 'recent node versions reduce allowed header sizes by default');
      test.equal(response.statusCode, 431, 'status should be 431');

      //test.ok(/exceeded/.test(body), 'body should contain an error message');
      test.equal(response.body, '', 'body will be empty');

      test.done();

    });

  },

  'clear': function(test) {

    test.expect(5);

    var options = {
      url: 'http://localhost:' + http_port + '/input/' + keys.publicKey(test_stream.id) + '.txt',
      method: 'DELETE',
      headers: {
        'Phant-Private-Key': keys.privateKey(test_stream.id)
      }
    };
    //console.log(options);
    var count = function(cb) {

      var readStream = stream.objectReadStream(test_stream.id),
        c = 0;

      readStream.on('data', function(chunk) {
        c++;
      });

      readStream.on('end', function() {
        cb(c);
      });

    };

    count(function(c) {

      test.equal(c, 5, 'should start with 5 log entries');

      request(options, function(error, response, body) {
        //console.log(error);
        //console.log(response);
        test.ok(!error, 'should not error');

        test.ok(response.headers['content-type'].match('^text/plain'), 'content-type should be text/plain');

        test.equal(response.statusCode, 200, 'status should be 200');

        test.equal(body, '1 success\n', 'should return a success message');
        test.done();
        // var readStream = stream.objectReadStream(test_stream.id);

        // readStream.on('error', function(err) {
        //   test.ok(err, 'should error');
        //   test.done();
        // });

      });

    });

  }

};

exports.cleanup = function(test) {

  test.expect(1);

  meta.delete(test_stream.id, function(err) {

    test.ok(!err, 'remove should not error');

    rimraf.sync(path.join(__dirname, 'tmp'));

    Phant.HttpServer.close(function() {
      test.done();
    });

  });

};
