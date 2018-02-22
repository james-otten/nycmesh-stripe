var key = require("./key");
var stripe = require("stripe")(key);

var restify = require("restify");

function charge(req, res) {
  if (!req.params || !req.params.stripeToken) return;

  // should really sanitize input
  var stripeToken = req.params.stripeToken;
  var donationAmount = req.params.donationAmount;
  var subscriptionPlan = req.params.subscriptionPlan;

  // subscription
  if (subscriptionPlan) {
    const monthFromNow = parseInt(new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).getTime()/1000);
    stripe.customers.create(
      {
        source: stripeToken.id,
        plan: subscriptionPlan,
        description: "NYC Mesh Donation",
        email: stripeToken.email,
        trial_end: monthFromNow
      },
      function(err, customer) {
        if (err) {
          console.log("Error creating subscription: ", err);
          return
        }
        console.log(customer.email + " subscribed to " + subscriptionPlan);
        
        stripe.invoiceItems.create({
          amount: donationAmount,
          currency: 'usd',
          customer: customer.id,
          description: 'Installation',
        }, function(err, invoiceItem) {
          console.log("Invoiced " + customer.email + " " + donationAmount)
        });
      }
    );
  }

  // one-time donation
  else {
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
}

var server = restify.createServer();

server.use(restify.bodyParser());

server.post("/charge", charge);

server.listen(9090, function() {
  console.log("listening at %s", server.url);
});