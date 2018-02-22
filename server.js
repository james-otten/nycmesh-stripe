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
    stripe.customers.create(
      {
        source: stripeToken.id,
        description: "NYC Mesh Donation",
        email: stripeToken.email
      },
      function(err, customer) {
        if (err) {
          console.log("Error creating customer: ", err);
          return;
        }
        console.log("Created customer: " + customer.email);

        if (donationAmount) {
          stripe.invoiceItems.create(
            {
              amount: donationAmount,
              currency: "usd",
              customer: customer.id,
              description: "Installation"
            },
            function(err, invoiceItem) {
              console.log("Invoiced " + customer.email + " " + donationAmount);
              subscribeCustomer(customer, subscriptionPlan)
            }
          );
        } else {
          subscribeCustomer(customer, subscriptionPlan)
        }
      }
    );
  } else {
    // one-time donation
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

function subscribeCustomer(customer, plan) {
  stripe.subscriptions.create(
    {
      customer: customer.id,
      items: [
        {
          plan
        }
      ]
    },
    function(err, subscription) {
      console.log("Subscribed " + customer.email + " to " + plan);
    }
  );
}

var server = restify.createServer();

server.use(restify.bodyParser());

server.post("/charge", charge);

server.listen(9090, function() {
  console.log("listening at %s", server.url);
});