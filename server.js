var key = require("./key");
var stripe = require("stripe")(key);
var restify = require("restify");

function donate(req, res) {
  if (!req.params || !req.params.stripeToken) return;

  // should really sanitize input
  var stripeToken = req.params.stripeToken;
  var donationAmount = req.params.donationAmount;
  var subscriptionPlan = req.params.subscriptionPlan;

  // One time donation
  if (donationAmount) {
    createCharge(stripeToken, donationAmount, (err, charge) => {
      if (err) {
        console.log("Error charging card: ", err);
        res.send(400, "Error charging card");
      } else {
        console.log("Charged " + charge.receipt_email + " " + donationAmount);
        res.end(200);
      }
    });
  }

  // Monthly subscription
  if (subscriptionPlan) {
    createSubscription(stripeToken, subscriptionPlan, (err, charge) => {
      if (err) {
        console.log("Error creating subscription: ", err);
        res.send(400, "Error creating subscription");
      } else {
        console.log("Subscribed " + charge.receipt_email + " to " + subscriptionPlan);
        res.end(200);
      }
    })
  }
}

function createCharge(stripeToken, amount, cb) {
  const charge = {
    amount: donationAmount,
    currency: "usd",
    source: stripeToken.id,
    description: "NYC Mesh Donation"
  };
  stripe.charges.create(charge, cb);
}

function createSubscription(stripeToken, subscriptionPlan, cb) {
  const customer = {
    source: stripeToken.id,
    plan: subscriptionPlan,
    description: "NYC Mesh Donation",
    email: stripeToken.email
  };
  stripe.customers.create(customer, cb);
}

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
          console.log("Charged " + charge.receipt_email + " " + donationAmount);
        }
      }
    );
  }
}

function subscribeCustomer(customer, plan, trialDays) {
  const trial_end = parseInt(
    new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).getTime() / 1000
  );
  stripe.subscriptions.create(
    {
      customer: customer.id,
      items: [
        {
          plan
        }
      ],
      trial_end
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

server.post("/donate", donate);

server.listen(9090, function() {
  console.log("listening at %s", server.url);
});