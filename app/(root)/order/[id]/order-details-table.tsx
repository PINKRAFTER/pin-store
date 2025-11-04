"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { RazorpayOrderOptions, useRazorpay } from "react-razorpay";
import {
  approveRazorpayPayment,
  createRazorpayOrder,
  markOrderAsDelivered,
  markOrderAsPaid,
} from "@/lib/actions/order.actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useTransition } from "react";
import { APP_DESCRIPTION, COMPANY_NAME } from "@/lib/constants";

const OrderDetailsTable = ({
  order,
  razorpayClientId,
  isAdmin,
}: {
  order: any;
  razorpayClientId: string;
  isAdmin: boolean;
}) => {
  const {
    id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderItems,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
  } = order;

  const [isLoading, setIsLoading] = useState(true);
  const { error, Razorpay } = useRazorpay();

  const handleCreateRazorpayOrder = async () => {
    const result = await createRazorpayOrder(id);

    if (!result.success) {
      toast.error(result.message);
    }

    return result.data;
  };

  const handleApproveRazorpayOrder = async (data: { paymentId: string }) => {
    console.log("Razorpay Payment Data:", data);
    console.log("Order ID:", id);
    const result = await approveRazorpayPayment(id, data.paymentId);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const RazorpayScriptProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const loadRazorpayScript = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };

    useEffect(() => {
      loadRazorpayScript();
      setIsLoading(false);
    }, []);

    return <>{children}</>;
  };

  const RazorpayButton = () => {
    const handlePayment = async () => {
      const orderId = await handleCreateRazorpayOrder();
      const options: RazorpayOrderOptions = {
        key: razorpayClientId,
        amount: Math.round(totalPrice * 100), // in paise
        currency: "INR",
        name: COMPANY_NAME,
        description: APP_DESCRIPTION,
        order_id: orderId as string,
        handler: async function (response: any) {
          setIsLoading(true);
          await handleApproveRazorpayOrder({
            paymentId: response.razorpay_payment_id,
          });
          setIsLoading(false);
        },
        prefill: {
          name: shippingAddress.fullName,
          email: "",
        },
        theme: {
          // color: "#3399cc",
          color: "#F37254",
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    };
    return (
      <>
        {error && (
          <div className="mb-4 text-center text-red-500">
            Error loading Razorpay
          </div>
        )}
        <Button className="w-full" onClick={handlePayment} disabled={isLoading}>
          {isLoading ? "Processing..." : "Pay with Razorpay"}
        </Button>
      </>
    );
  };

  const MarkAsPaidButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await markOrderAsPaid(id);
            if (!result.success) {
              toast.error(result.message || "Failed to mark as paid");
              return;
            }
            toast.success("Order marked as paid successfully");
          })
        }>
        {isPending ? "Processing..." : "Mark as Paid"}
      </Button>
    );
  };

  const MarkAsDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();
    return (
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await markOrderAsDelivered(id);

            if (!result.success) {
              toast.error(result.message || "Failed to mark as delivered");
              return;
            }
            toast.success("Order marked as delivered successfully");
          })
        }>
        {isPending ? "Processing..." : "Mark as Delivered"}
      </Button>
    );
  };

  return (
    <>
      <h1 className="py-4 text-2xl">Order {formatId(id)}</h1>
      <div className="grid md:grid-cols-3 md:gap-5">
        <div className="col-span-2 space-4-y overflow-x-auto">
          <Card>
            <CardContent className="p-4 gap-4">
              <div className="h2 text-xl pb-4">Payment Method</div>
              <p className="mb-2">{paymentMethod}</p>
              {isPaid ? (
                <Badge variant="secondary">
                  Paid at {formatDateTime(paidAt!).dateTime}
                </Badge>
              ) : (
                <Badge variant="destructive">Not Paid</Badge>
              )}
            </CardContent>
          </Card>
          <Card className="my-2">
            <CardContent className="p-4 gap-4">
              <div className="h2 text-xl pb-4">Shipping Address</div>
              <p>{shippingAddress.fullName}</p>
              <p className="mb-2">
                {shippingAddress.streetAddress}, {shippingAddress.city},
                {shippingAddress.state} {shippingAddress.zipCode}
              </p>
              {isDelivered ? (
                <Badge variant="secondary">
                  Delivered at {formatDateTime(deliveredAt!).dateTime}
                </Badge>
              ) : (
                <Badge variant="destructive">Not Delivered</Badge>
              )}
            </CardContent>
          </Card>
          <Card className="my-2">
            <CardContent className="p-4 gap-4">
              <h2 className="text-xl pb-4">Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item: OrderItem) => (
                    <TableRow key={item.slug}>
                      <TableCell>
                        <Link
                          href={`/product/${item.slug}`}
                          className="flex items-center">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                            // className="inline-block mr-2"
                          />
                          <span className="px-2">{item.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="px-2">{item.quantity}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        ₹ {item.price}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-4 gap-4 space-y-4">
              <div className="flex justify-between">
                <div>Items</div>
                <div>{formatCurrency(itemsPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Tax</div>
                <div>{formatCurrency(taxPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Shipping Price</div>
                <div>{formatCurrency(shippingPrice)}</div>
              </div>
              <div className="flex justify-between">
                <div>Total</div>
                <div>{formatCurrency(totalPrice)}</div>
              </div>
              {/* PayPal Payment */}
              {!isPaid && paymentMethod === "Razorpay" && (
                <div>
                  <RazorpayScriptProvider>
                    <RazorpayButton />
                  </RazorpayScriptProvider>
                </div>
              )}

              {/* Cash On Delivery */}
              {isAdmin && !isPaid && paymentMethod === "Cash On Delivery" && (
                <MarkAsPaidButton />
              )}
              {isAdmin && isPaid && !isDelivered && <MarkAsDeliveredButton />}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsTable;
