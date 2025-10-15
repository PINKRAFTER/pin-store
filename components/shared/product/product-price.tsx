import { cn } from "@/lib/utils";

const ProductPrice = ({
  price,
  styles,
}: {
  price: number;
  styles?: string;
}) => {
  // Ensure 2 decimal value:
  const formattedPrice = price.toFixed(2);
  const [intValue, decimalValue] = formattedPrice.split(".");

  return (
    <p className={cn("text-2xl", styles)}>
      ₹{intValue}
      <span>.{decimalValue}</span>
    </p>
  );
};

export default ProductPrice;
