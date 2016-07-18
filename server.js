var key = require('./key.json')
var stripe = require("stripe")(key);

var restify = require('restify');

function charge(req, res) {
  console.log(req.params)
  if (!req.params || !req.params.stripeToken)
    return

  //should really sanitize input
  var stripeToken = req.params.stripeToken;

  stripe.customers.create({
    source: stripeToken,
    plan: "hundred-monthly"
  }, function(err, customer) {
    console.log(err, customer)
  });
}

var server = restify.createServer();

server.use(restify.bodyParser());

server.post('/charge', charge);

server.listen(9090, function() {
  console.log('listening at %s', server.url);
});
