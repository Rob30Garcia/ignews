import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../services/stripe";

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
  'checkout.session.completed'
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
      console.log('Evento recebido', event);
      
    }

    res.json({ok: true });

  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
  }
  
}

//stripe listen --forward-to localhost:3000/api/webhooks