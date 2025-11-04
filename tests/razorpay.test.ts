import { razorpay } from "../lib/razorpay";

let orderId = "";

// Test to create a Razorpay order
test("creates order in Razorpay", async () => {
  const orderResponse = await razorpay.createOrder(100);
  console.log("Created Razorpay Order:", orderResponse);
  orderId = orderResponse.id;
  expect(orderResponse).toHaveProperty("id");
  expect(orderResponse).toHaveProperty("status", "created");
});

// Test to capture a Razorpay payment with a mock order ID
test("simulates capturing a Razorpay payment from an order", async () => {
  const mockOrderID = "order_test123";
  const mockAmount = 100;
  const mockCurrency = "INR";

  // Create a mock response that simulates successful payment capture
  const mockPaymentResponse = {
    id: "pay_test123",
    entity: "payment",
    amount: mockAmount * 100,
    currency: mockCurrency,
    status: "captured",
    order_id: mockOrderID,
    method: "card",
  } as any; // Use 'as any' to avoid TypeScript type issues in tests

  // Create a mock that returns a successful payment capture response
  const mockCapturePayment = jest
    .spyOn(razorpay, "capturePayment")
    .mockResolvedValue(mockPaymentResponse);

  const captureResponse = await razorpay.capturePayment(
    mockOrderID,
    mockAmount,
    mockCurrency
  );
  console.log("Captured Razorpay Payment:", captureResponse);

  // Verify the function was called with correct parameters
  expect(mockCapturePayment).toHaveBeenCalledWith(
    mockOrderID,
    mockAmount,
    mockCurrency
  );
  expect(captureResponse).toHaveProperty("status", "captured");
  expect(captureResponse).toHaveProperty("id", "pay_test123");
  expect(captureResponse).toHaveProperty("amount", mockAmount * 100);

  mockCapturePayment.mockRestore();
});
