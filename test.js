var http = require('http');
var xml2js = require('xml2js');
var parseString = xml2js.parseString;
var builder = new xml2js.Builder();
var colors = require('colors');

var error_count = 0;
var test_count = 0;

exports.execute = function (test, body, callback) {
  var options = {
    host: 'localhost',
    path: '/api/v1',
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': body.length,
      connection: 'keep-alive',
    },
    port: 3000,
  };

  http_callback = function (response) {
    var str = '';

    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      response.raw = str;
      try {
        response.raw_json = JSON.parse(str);
      } catch (e) {}
      parseString(str, function (err, result) {
        response.body = result;
        response.xml_parse_error = err;
        callback(response, err);
      });
    });
  };
  var req = http.request(options, http_callback);
  req.on('error', function (e) {
    callback(500, e, null);
  });
  req.write(body);
  req.end();
};

exports.error = function (module, test, trace, err) {
  error_count += 1;
  if (trace) {
    var lines = trace.split('\n');
    for (var line in lines) {
      console.log(module + ':' + test + ':' + lines[line].red);
    }
  }
  console.log('FAIL'.red + ':' + module.red + ':' + test.red + ':' + err.red);
};

exports.pass = function (module, test, msg) {
  console.log('PASS'.green + ':' + module.green + ':' + test.green + ':' + msg.green);
};

exports.exception = function (module, test, e) {
  error_count += 1;
  var lines = e.stack.split('\n');
  for (var line in lines) {
    console.log('EXCEPTION'.red + ':' + module + ':' + test + ':' + lines[line].red);
  }
  console.log('FAIL'.red + ':' + module.red + ':' + test.red + ':' + 'exception'.red);
};

exports.summary = function () {
  if (error_count == 0) {
    console.log('');
    console.log('**************'.green);
    console.log('PASSED'.green + ':[' + test_count.toString().green + '/' + test_count.toString().green + ']');
  } else {
    console.log('');
    console.log('**************'.red);
    console.log('FAILED'.red + ':[' + error_count.toString().red + '/' + test_count.toString().green + ']');
  }
};

exports.require_status = function (module, res, required_status) {
  var test = 'require_status';
  test_count += 1;
  try {
    if (res.statusCode != required_status) {
      exports.error(module, test, res.raw, 'wanted ' + required_status + ' got ' + res.statusCode);
    } else {
      exports.pass(module, test, 'wanted ' + required_status);
    }
  } catch (e) {
    exports.exception(module, test, e);
  }
};

exports.require_success_response = function (module, res) {
  var test = 'require_success_response';
  test_count += 1;
  try {
    var error = res.body['root']['error'];
    if (error) {
      exports.error(module, test, res.raw, 'wanted TRUE got FALSE');
    } else {
      exports.pass(module, test, 'wanted TRUE');
    }
  } catch (e) {
    exports.exception(module, test, e);
  }
};

exports.require_error_response = function (module, res) {
  var test = 'require_error_response';
  test_count += 1;
  try {
    if (!res.body) {
      exports.error(module, test, res.raw, 'wanted valid xml got ' + res.xml_parse_error);
    } else {
      var error = res.body['root']['error'];
      if (!error) {
        exports.error(module, test, res.raw, 'wanted FALSE got TRUE');
      } else {
        exports.pass(module, test, 'wanted FALSE');
      }
    }
  } catch (e) {
    exports.exception(module, test, e);
  }
};

exports.require_successful_transaction = function (module, res) {
  var test = 'require_successful_transaction';
  test_count += 1;
  try {
    if (!res.body || !res.body['root']) {
      exports.error(module, test, res.raw, 'wanted valid xml got ' + res.xml_parse_error);
    } else {
      if (res.body['root']['success'] != '1') {
        exports.error(module, test, res.raw, 'wanted success == 1');
      } else {
        exports.pass(module, test, 'wanted success == 1');
      }
    }
  } catch (e) {
    exports.exception(module, test, e);
  }
};

exports.require_payment_data = function (module, res) {
  var test = 'require_payment_data';
  test_count += 1;
  try {
    if (!res.body) {
      exports.error(module, test, res.raw, 'wanted valid xml got ' + res.xml_parse_error);
    } else {
      var node = Object.keys(res.body['root']['body'][0])[0];
      var payment = res.body['root']['body'][0][node][0]['transactionRequest'][0]['payment'][0];
      if (payment && payment['creditCard']) {
        exports.pass(module, test, 'wanted payment node');
      } else {
        exports.error(module, test, res.raw, 'wanted payment node got nothing');
      }
    }
  } catch (e) {
    exports.exception(module, test, e);
  }
};

exports.require_error_text = function (module, res, required_text) {
  var test = 'require_error_text';
  test_count += 1;
  try {
    if (!res.body) {
      exports.error(module, test, res.raw, 'wanted valid xml got ' + res.xml_parse_error);
    } else {
      var error_text = res.body['root']['message'][0];
      if (error_text != required_text) {
        exports.error(module, test, res.raw, "wanted '" + required_text + "' got '" + error_text) + "'";
      } else {
        exports.pass(module, test, 'wanted ' + required_text);
      }
    }
  } catch (e) {
    exports.exception(module, test, e);
  }
};
