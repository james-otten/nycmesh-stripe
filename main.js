// Set your secret key: remember to change this to your live secret key in production
// See your keys here https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")("sk_test_wmfz9Cs1fPDG9RXQSQJZepRY");

stripe.customers.create({
  source: stripeToken,
  plan: "gold",
  email: "payinguser@example.com"
}, function(err, customer) {
  // ...
});
