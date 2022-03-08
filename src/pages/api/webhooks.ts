import { fail } from "assert";
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
	const chunks = [];

	for await (const chunk of readable) {
		chunks.push(
			typeof chunk === "string" ? Buffer.from(chunk) : chunk
		);
	}

	return Buffer.concat(chunks);	
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if(req.method === 'POST') {
    const buf = await buffer(req);
    const secret = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    const { type } = event;

    //se precisar ser readable
    if(relevantEvents.has(type)) {
      //console.log('Evento recebido', event);

      const checkoutSession = event.data.object as Stripe.Checkout.Session;

      try {
        switch(type) {
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;            

            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            );

            break;

          case 'checkout.session.completed':
          
            await saveSubscription(
              checkoutSession.subscription.toString(),
              checkoutSession.customer.toString(),
              true
            );

            break;
          default:
            throw new Error('Unhandled event.');
        }
      } catch (err) {
        //um erro no desenvolvimento, nesse caso pode usar um terceiro para informar o erro. Sentry ou bugnet
        return res.json({error: 'Webhooks handler failed.'})
      }
    }

    res.json({ok: true });

  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
  }
  
}

//stripe listen --forward-to localhost:3000/api/webhooks