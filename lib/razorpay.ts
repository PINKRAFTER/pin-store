import Razorpay from "razorpay";

const rzpInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const razorpay = {
  createOrder: async function createOrder(price: number) {
    try {
      const options = {
        amount: Math.round(price * 100), // amount in the smallest currency unit
        currency: "INR",
        receipt: `receipt_order_${Math.random().toString(36).substring(2, 15)}`,
        payment_capture: 0,
      };

      const order = await rzpInstance.orders.create(options);
      console.log("Created Razorpay Order:", order);
      return order;
    } catch (error) {
      console.log("Error creating Razorpay order:", error);
      throw error;
    }
  },
  capturePayment: async function capturePayment(
    orderID: string,
    amount: number,
    currency: string = "INR"
  ) {
    try {
      const payment = await rzpInstance.payments.capture(
        orderID,
        Math.round(amount * 100), // amount in the smallest currency unit
        currency
      );

      return payment;
    } catch (error) {
      console.log("Error capturing Razorpay payment:", error);
      throw error;
    }
  },
};
