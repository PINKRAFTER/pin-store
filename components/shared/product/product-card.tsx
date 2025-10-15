import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import ProductPrice from "./product-price";
import { Product } from "@/types";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-0 items-center">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            width={400}
            height={400}
            priority={true}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        <div className="text-xs">{product.brand}</div>
        <Link href={`/product/${product.slug}`}>
          <h2 className="font-semibold text-lg hover:underline">
            {product.name}
          </h2>
        </Link>
        <div className="flex-between gap-4">
          <p>{product.rating} Starts</p>
          {product.stock > 0 ? (
            // <p className="text-green-600 font-bold">₹{product.price}</p>
            <ProductPrice
              price={Number(product.price)}
              styles="text-green-600 font-bold"
            />
          ) : (
            <p className="text-destructive">Out of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
