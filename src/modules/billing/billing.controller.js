const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { updateTenantPlan, updateTenantStripeCustomer } = require('../tenant/tenant.queries');

const createCheckoutSession = async (req, res) => {
  const tenantId = req.user.tenantId;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Echoboard Pro' },
          unit_amount: 1900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    metadata: { tenantId },
    success_url: 'http://localhost:5173/dashboard?upgraded=true',
    cancel_url: 'http://localhost:5173/dashboard',
  });

  res.json({ url: session.url });
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const tenantId = session.metadata.tenantId;
    const stripeCustomerId = session.customer;

    await updateTenantStripeCustomer(tenantId, stripeCustomerId);
    await updateTenantPlan(stripeCustomerId, 'pro');
  }

  res.json({ received: true });
};

module.exports = { createCheckoutSession, handleWebhook };