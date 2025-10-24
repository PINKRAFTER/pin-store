import { Metadata } from "next";
import CartTable from "./cart-table";
import { getMyCart } from "@/lib/actions/cart.actions";

export const metadata: Metadata = {
  title: "Shopping Cart - FabStore",
  description: "View and manage the items in your shopping cart.",
};

const CartPage = async () => {
  const cart = await getMyCart();

  return (
    <>
      <div>CartPage</div>
      <CartTable cart={cart} />
    </>
  );
};

export default CartPage;
