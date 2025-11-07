"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToObject, formatError } from "../utils";
import { auth } from "@/auth";
import { getUserById } from "./user.actions";
import { getMyCart } from "./cart.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem, PaymentResult, ShippingAddress } from "@/types";
// import { paypal } from "../paypal";
import { razorpay } from "../razorpay";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "../constants";
import { Prisma } from "../generated/prisma";
import { sendPurchaseReceipt } from "@/email";

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

// Create Order and order items.
export async function createOrder() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await getUserById(userId);
    const cart = await getMyCart();

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Cart is empty",
        redirectTo: "/cart",
      };
    }

    if (!user.address) {
      return {
        success: false,
        message: "Shipping address not found",
        redirectTo: "/shipping-address",
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: "Payment method not found",
        redirectTo: "/payment-method",
      };
    }

    // Create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      taxPrice: cart.taxPrice,
      shippingPrice: cart.shippingPrice,
      totalPrice: cart.totalPrice,
    });

    // create a transaction to create order and order items
    const insertedOrderId = await prisma.$transaction(async (tx) => {
      // Create Order
      const insertedOrder = await tx.order.create({
        data: order,
      });

      // create order items using cart items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: item.price,
            orderId: insertedOrder.id,
          },
        });
      }

      // Clear user's cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          itemsPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          totalPrice: 0,
        },
      });

      return insertedOrder.id;
    });

    if (!insertedOrderId) throw new Error("Failed to create order");

    return {
      success: true,
      message: "Order created successfully",
      redirectTo: `/order/${insertedOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderItems: true,
      user: { select: { name: true, email: true } },
    },
  });

  return convertToObject(data);
}

// Create new PayPal order
// export async function createPayPalOrder(orderId: string) {
export async function createRazorpayOrder(orderId: string) {
  try {
    // Get Order from Database
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Create PayPal Order
    // const paypalOrder = await paypal.createOrder(Number(order.totalPrice));
    const razorpayOrder = await razorpay.createOrder(Number(order.totalPrice));

    // Update order with PayPal order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentResult: {
          id: razorpayOrder.id,
          status: razorpayOrder.status,
          email_address: "",
          pricePaid: order.totalPrice.toString(),
        },
      },
    });

    return {
      success: true,
      message: "Order created successfully",
      data: razorpayOrder.id,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Aprove PayPal payment for an order and update database
// export async function approvePayPalPayment(
export async function approveRazorpayPayment(
  orderId: string,
  razorpayOrderId: string
) {
  try {
    // Get Order from Database
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // const captureData = await paypal.capturePayment(paypalOrderId);
    const capturedData = await razorpay.capturePayment(
      razorpayOrderId,
      Number(order.totalPrice),
      "INR"
    );

    if (
      !capturedData ||
      capturedData.order_id !== (order.paymentResult as PaymentResult).id ||
      capturedData.status !== "captured"
    ) {
      throw new Error("Razorpay payment failed");
    }

    // Update order payment status in database
    await updateOrderPaymentStatus(orderId, {
      id: capturedData.order_id,
      status: capturedData.status,
      email_address: capturedData.email || "",
      pricePaid: capturedData.amount.toString(),
    });

    // Redirect to order page
    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Payment approved successfully",
      redirectTo: `/order/${orderId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update order payment status in database
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentResult?: PaymentResult
) {
  // Get Order from Database
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.isPaid) throw new Error("Order is already paid");

  // Transaction to update order and account for product stock
  await prisma.$transaction(async (tx) => {
    // Update stock for each product
    for (const item of order.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: -item.quantity },
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentResult: paymentResult,
        },
      });
    }
  });

  // Get updated order after transaction
  const updatedOrder = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      orderItems: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!updatedOrder) throw new Error("Failed to retrieve updated order");

  sendPurchaseReceipt({
    order: {
      ...updatedOrder,
      shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
      paymentResult: updatedOrder.paymentResult as PaymentResult,
    } as any,
  });
}

// Get user's orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page = 1,
}: {
  limit?: number;
  page?: number;
}) {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  const data = await prisma.order.findMany({
    where: { userId: session.user?.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: { userId: session.user?.id },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Get sales data and order summary for admin dashboard
export async function getOrderSummary() {
  // Get count of each resource
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const usersCount = await prisma.user.count();

  // Calculate the total sales
  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });

  // Get monthly sales data
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT TO_CHAR("createdAt", 'MM/YYYY') AS month, SUM("totalPrice") AS "totalSales" 
  FROM "Order" GROUP BY month ORDER BY month ASC;`;
  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  // Get latest sales data
  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales: totalSales._sum.totalPrice || 0,
    salesData,
    latestSales,
  };
}

// Get All orders for admin with pagination
export async function getAllOrders({
  limit = PAGE_SIZE,
  page = 1,
  query,
}: {
  limit?: number;
  page?: number;
  query?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  const queryFilter: Prisma.OrderWhereInput =
    query && query !== "all"
      ? {
          user: {
            name: {
              contains: query,
              mode: "insensitive",
            } as Prisma.StringFilter,
          },
        }
      : {};

  const data = await prisma.order.findMany({
    where: { ...queryFilter },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const dataCount = await prisma.order.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete an order
export async function deleteOrder(orderId: string) {
  try {
    await prisma.order.delete({
      where: { id: orderId },
    });

    revalidatePath("/admin/orders");

    return { success: true, message: "Order deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update COD order to paid
export async function markOrderAsPaid(orderId: string) {
  try {
    await updateOrderPaymentStatus(orderId);
    revalidatePath(`/order/${orderId}`);

    return { success: true, message: "Order marked as paid successfully" };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update COD order to delivered
export async function markOrderAsDelivered(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.isPaid) {
      throw new Error("Order is not paid yet");
    }
    // if (order.isDelivered) {
    //   throw new Error("Order is already delivered");
    // }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    revalidatePath(`/order/${orderId}`);

    return { success: true, message: "Order marked as delivered successfully" };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
