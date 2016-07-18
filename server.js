var restify = require('restify');

function charge(req, res, next) {
  console.log(req)
  res.send(req);
  next();
}

var server = restify.createServer();
server.get('/charge', charge);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
