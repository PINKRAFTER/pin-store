import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateOrderPaymentStatus } from "@/lib/actions/order.actions";

export async function POST(req: NextRequest) {
  // Build the webhook event
  const event = await Stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get("Stripe-Signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  // Check if the payment is successful
  if (event.type === "charge.succeeded") {
    const { object } = event.data;

    // Update the order status to paid
    await updateOrderPaymentStatus(object.metadata.order_id, {
      id: object.id,
      status: "COMPLETED",
      email_address: object.billing_details.email!,
      pricePaid: (object.amount / 100).toFixed(2),
    });

    return NextResponse.json({ message: "Updated order status to COMPLETED" });
  }

  return NextResponse.json({ message: "Event type not handled" });
}
