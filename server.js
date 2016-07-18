var restify = require('restify');
var fs = require('fs');

var CERTIFICATE_PATH = '/etc/letsencrypt/live/donate.nycmesh.net/cert.pem'
var KEY_PATH = '/etc/letsencrypt/live/donate.nycmesh.net/privkey.pem'

function charge(req, res, next) {
  console.log(req)
  // res.send(req);
  next();
}

var server = restify.createServer({
  certificate: fs.readFileSync(CERTIFICATE_PATH),
  key: fs.readFileSync(KEY_PATH)
});
server.post('/charge', charge);

server.listen(9090, function() {
  console.log('%s listening at %s', server.name, server.url);
});
