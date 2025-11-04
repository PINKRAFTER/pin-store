import { generateAccessToken, paypal } from "../lib/paypal";

// Test to generate access token from PayPal
test("generates token from PayPal", async () => {
  const tokenResponse = await generateAccessToken();
  console.log("Generated PayPal Access Token:", tokenResponse);
  expect(typeof tokenResponse).toBe("string");
  expect(tokenResponse.length).toBeGreaterThan(0);
});

// Test to create a PayPal order
test("creates order in PayPal", async () => {
  const token = await generateAccessToken();
  const orderResponse = await paypal.createOrder(100);
  console.log("Created PayPal Order:", orderResponse);
  expect(orderResponse).toHaveProperty("id");
  expect(orderResponse).toHaveProperty("status", "CREATED");
});

// Test to capture a PayPal payment with a mock order ID
test("simulates capturing a payment from an order", async () => {
  const mockOrderID = "100";

  const mockCapturePayment = jest
    .spyOn(paypal, "capturePayment")
    .mockResolvedValue({
      status: "COMPLETED",
    });

  const captureResponse = await paypal.capturePayment(mockOrderID);
  console.log("Captured PayPal Payment:", captureResponse);

  expect(mockCapturePayment).toHaveBeenCalledWith(mockOrderID);
  expect(captureResponse).toHaveProperty("status", "COMPLETED");

  mockCapturePayment.mockRestore();
});
