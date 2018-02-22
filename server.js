var key = require("./key");
var stripe = require("stripe")(key);

var restify = require("restify");

function charge(req, res) {
  if (!req.params || !req.params.stripeToken) return;

  // should really sanitize input
  var stripeToken = req.params.stripeToken;
  var donationAmount = req.params.donationAmount;
  var subscriptionPlan = req.params.subscriptionPlan;

  // If subscription selected, invoice customer
  // then add them to plan with 30 day trial
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
          res.send(400);
          return;
        }
        console.log("Created customer: " + customer.email);
        stripe.invoiceItems.create(
          {
            amount: donationAmount,
            currency: "usd",
            customer: customer.id,
            description: "Installation"
          },
          function(err, invoiceItem) {
            if (err) {
              console.log("Error invoicing customer: ", err);
              res.send(400);
              return;
            }
            console.log("Invoiced " + customer.email + " " + donationAmount);
            subscribeCustomer(customer, subscriptionPlan, 30);
          }
        );
      }
    );
  } else {
    // Otherwise just make the one time charge
    // one-time donation
    stripe.charges.create(
      {
        amount: donationAmount,
        currency: "usd",
        source: stripeToken.id,
        description: "NYC Mesh Donation"
      },
      function(err, charge) {
        if (err) {
          console.log("Error charging card: ", err);
          res.send(400, "Error charging card");
        } else {
          console.log("Charged" + charge.email + " " + donationAmount);
        }
      }
    );
  }
}

function subscribeCustomer(customer, plan, trialPeriod) {
  stripe.subscriptions.create(
    {
      customer: customer.id,
      items: [
        {
          plan
        }
      ],
      trial_period_days: trialPeriod || 0
    },
    function(err, subscription) {
      if (err) {
        console.log("Error subscribing " + customer.email, err);
        return;
      }

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