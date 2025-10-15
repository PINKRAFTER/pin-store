import { Product } from "@/types";
import ProductCard from "./product-card";

const ProductList = ({
  data,
  title,
  limit,
}: {
  data: Product[];
  title?: string;
  limit?: number;
}) => {
  const limitedData = limit ? data.slice(0, limit) : data;
  return (
    <div className="my-10">
      <h2 className="h2-bold mb-4">{title || "Products"}</h2>
      {data.length === 0 ? (
        <div>
          <p className="text-muted-foreground">No products available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {limitedData.map((product: Product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
