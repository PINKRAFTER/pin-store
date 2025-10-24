"use client";

import { Button } from "@/components/ui/button";
import { addToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import { Cart, CartItem } from "@/types";
import { Loader, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const result = await addToCart(item);

      if (!result?.success) {
        toast.error("Failed to add item to cart: " + result?.message);
        return;
      }

      toast.success(`${item.name} added to cart!`, {
        description: result?.message,
        action: {
          label: "Go To Cart",
          onClick: () => router.push("/cart"),
        },
      });
    });
  };

  const handleRemoveItem = async () => {
    startTransition(async () => {
      const result = await removeItemFromCart(item.productId);

      if (!result?.success) {
        toast.error("Failed to remove item from cart: " + result?.message);
        return;
      }

      toast.success(`${item.name} removed from cart!`, {
        description: result?.message,
        action: {
          label: "Go To Cart",
          onClick: () => router.push("/cart"),
        },
      });
    });
  };

  // Check if item is already in cart
  const itemExists = cart?.items?.find((x) => x.productId === item.productId);

  return itemExists ? (
    <div>
      <Button type="button" variant="outline" onClick={handleRemoveItem}>
        {isPending ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </Button>
      <span className="px-2">{itemExists.quantity}</span>
      <Button type="button" variant="outline" onClick={handleAddToCart}>
        {isPending ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      {isPending ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}{" "}
      Add To Cart
    </Button>
  );
};

export default AddToCart;
