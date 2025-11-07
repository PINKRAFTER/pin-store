import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions/order.actions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const PaymentSuccessPage = async (props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment_intent: string }>;
}) => {
  const { id } = await props.params;
  const { payment_intent } = await props.searchParams;

  // Fetch Order
  const order = await getOrderById(id);
  if (!order) notFound();

  // Retrieve the Payment Intent to confirm payment status
  const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

  // Check if payment is valid
  if (
    paymentIntent.metadata.order_id == null ||
    paymentIntent.metadata.order_id != order.id.toString()
  )
    return notFound();

  // Check if payment was successful
  const isPaymentSuccessful = paymentIntent.status === "succeeded";

  if (!isPaymentSuccessful) return redirect(`/order/${id}`);

  return (
    <div className="p-4max-w-4xl w-full mx-auto space-y-8">
      <div className="flex flex-col gap-6 items-center">
        <h1 className="h1-bold">Thanks for your purchase</h1>
        <div>We are processing your order</div>
        <Button asChild>
          <Link href={`/order/${id}`}>View Order Details</Link>
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
