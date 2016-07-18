var key = require('./key.json')
var stripe = require("stripe")(key);

var restify = require('restify');

function charge(req, res) {
  if (!req.params || !req.params.stripeToken)
    return

  // should really sanitize input
  var stripeToken = req.params.stripeToken;
  var donationAmount = req.params.donationAmount;

  // one-time donation
  if (parseInt(donationAmount)) {
    stripe.charges.create({
      amount: donationAmount,
      currency: "usd",
      source: stripeToken.id,
      description: "NYC Mesh Donation"
    }, function(err, charge) {
      if (err)
        console.log("Error charging card: ", err)
      else
        console.log(customer.email+' '+donationAmount);
    });
  }

  // subscription
  else if (donationAmount == 'twenty-monthly'
    || donationAmount == 'fifty-monthly'
    || donationAmount == 'hundred-monthly') {

    var plan = req.params.plan;
    stripe.customers.create({
      source: stripeToken.id,
      plan: donationAmount,
      description: "NYC Mesh Donation",
      email: stripeToken.email
    }, function(err, customer) {
      if (err)
        console.log("Error creating subscription: ", err)
      else
        console.log(customer.email+' '+donationAmount);
    });
  }
}

var server = restify.createServer();

server.use(restify.bodyParser());

server.post('/charge', charge);

server.listen(9090, function() {
  console.log('listening at %s', server.url);
});
