"use server";

import { CartItem } from "@/types";
import {
  convertToObject,
  formatError,
  roundToTwoDecimalPlaces,
} from "../utils";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartItemsSchema } from "../validators";
import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { Prisma } from "../generated/prisma/client";
import { success } from "zod";

// Calculate cart prices:
const calculateCartPrices = (items: CartItem[]) => {
  const itemsPrice = roundToTwoDecimalPlaces(
      items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0)
    ),
    taxPrice = roundToTwoDecimalPlaces(itemsPrice * 0.1), // Assuming 10% tax
    shippingPrice = roundToTwoDecimalPlaces(itemsPrice > 100 ? 0 : 10), // Free shipping for orders over $100
    totalPrice = roundToTwoDecimalPlaces(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addToCart(data: CartItem) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    console.log("Session Cart ID:", sessionCartId);
    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    // Get session and user id
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get Cart items:
    const cart = await getMyCart();

    console.log("Current cart:", cart);

    // Parse and validate item
    const item = cartItemSchema.parse(data);

    // Find product in the database
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!cart) {
      // Create a new cart
      const newCart = insertCartItemsSchema.parse({
        sessionCartId: sessionCartId,
        userId: userId,
        items: [item],
        ...calculateCartPrices([item]),
      });

      // Add to database
      await prisma.cart.create({
        data: newCart,
      });

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      // Update existing cart
      console.log("Existing cart found:", cart);
      const existingItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId
      );

      if (existingItem) {
        // check if the new quantity exceeds stock
        if (existingItem.quantity + 1 > product.stock) {
          throw new Error("Cannot add more items than available in stock");
        }

        // Update quantity
        existingItem.quantity += 1;
      } else {
        // Check if adding new item exceeds stock
        if (product.stock < 1) {
          throw new Error("Product is out of stock");
        }

        // Add item to the cart.items
        cart.items.push(item);
      }

      // Save the cart in the database
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items,
          ...calculateCartPrices(cart.items as CartItem[]),
        },
      });

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${
          existingItem ? "updated in" : "added to"
        } cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;
  if (!sessionCartId) {
    throw new Error("Cart session not found");
  }

  // Get session and user id
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Get user cart from database
  const query = userId ? { userId: userId } : { sessionCartId: sessionCartId };

  const cart = await prisma.cart.findFirst({
    where: query,
  });

  if (!cart) {
    return undefined;
  }

  return convertToObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
  });
}

export async function removeItemFromCart(productId: string) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    const product = await prisma.product.findFirst({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Get Cart
    const cart = await getMyCart();
    if (!cart) {
      throw new Error("Cart not found");
    }

    // Get cart item:
    const itemExist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId
    );

    if (!itemExist) {
      throw new Error("Item not found in cart");
    }

    // If item quantity is more than 1 decrease quantity, otherwise remove item
    if (itemExist.quantity > 1) {
      (cart.items as CartItem[]).find(
        (x) => x.productId === productId
      )!.quantity = itemExist.quantity - 1;
    } else {
      cart.items = (cart.items as CartItem[]).filter(
        (x) => x.productId !== productId
      );
    }

    // Update cart in database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items,
        ...calculateCartPrices(cart.items as CartItem[]),
      },
    });

    // Revalidate product page
    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} removed from cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
