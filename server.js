var key = require("./key");
var stripe = require("stripe")(key);

var restify = require("restify");

function charge(req, res) {
  if (!req.params || !req.params.stripeToken) return;

  // should really sanitize input
  var stripeToken = req.params.stripeToken;
  var donationAmount = req.params.donationAmount;
  var subscriptionPlan = req.params.subscriptionPlan;

  // one-time donation
  if (parseInt(donationAmount)) {
    stripe.charges.create(
      {
        amount: donationAmount,
        currency: "usd",
        source: stripeToken.id,
        description: "NYC Mesh Donation"
      },
      function(err, charge) {
        if (err) console.log("Error charging card: ", err);
        else console.log("Charged" + charge.email + " " + donationAmount);
      }
    );
  }

  // subscription
  if (subscriptionPlan) {
    stripe.customers.create(
      {
        source: stripeToken.id,
        plan: subscriptionPlan,
        description: "NYC Mesh Donation",
        email: stripeToken.email,
        trial_period_days: 30
      },
      function(err, customer) {
        if (err) {
          console.log("Error creating subscription: ", err);
          console.log(customer)
        }
        else console.log(customer.email + " " + subscriptionPlan);
      }
    );
  }
}

var server = restify.createServer();

server.use(restify.bodyParser());

server.post("/charge", charge);

server.listen(9090, function() {
  console.log("listening at %s", server.url);
});