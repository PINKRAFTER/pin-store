import ProductCard from "@/components/shared/product/product-card";
import { Button } from "@/components/ui/button";
import {
  getAllCategories,
  getAllProducts,
} from "@/lib/actions/product.actions";
import Link from "next/link";

const ratings = [4, 3, 2, 1];

const sortOrders = ["newest", "lowest", "highest", "toprated"];

const prices = [
  { name: "₹1 to ₹50", value: "1-50" },
  { name: "₹51 to ₹100", value: "51-100" },
  { name: "₹101 to ₹200", value: "101-200" },
  { name: "₹201 to ₹500", value: "201-500" },
  { name: "₹501 to ₹1000", value: "501-1000" },
];

export async function generateMetadata(props: {
  searchParams: Promise<{
    query: string;
    category: string;
    price: string;
    rating: string;
  }>;
}) {
  const {
    query = "all",
    category = "all",
    price = "all",
    rating = "all",
  } = await props.searchParams;

  const isQuerySet = query && query !== "all" && query.trim() !== "";
  const isCategorySet =
    category && category !== "all" && category.trim() !== "";
  const isPriceSet = price && price !== "all" && price.trim() !== "";
  const isRatingSet = rating && rating !== "all" && rating.trim() !== "";

  if (isQuerySet || isCategorySet || isPriceSet || isRatingSet) {
    return {
      title: `
      Search ${isQuerySet ? query : ""} 
      ${isCategorySet ? `: Category ${category}` : ""}
      ${isPriceSet ? `: Price ${price}` : ""}
      ${isRatingSet ? `: Rating ${rating}` : ""}`,
    };
  } else {
    return {
      title: "Search Products",
    };
  }
}

const SearchPage = async (props: {
  searchParams: Promise<{
    query?: string;
    category?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  }>;
}) => {
  const {
    query = "all",
    category = "all",
    price = "all",
    rating = "all",
    sort = "newest",
    page = "1",
  } = await props.searchParams;

  // Construct filter URL:
  const getFilterUrl = ({
    c,
    s,
    p,
    r,
    pg,
  }: {
    c?: string;
    s?: string;
    p?: string;
    r?: string;
    pg?: string;
  }) => {
    const params = {
      query,
      category: c || category,
      price: p || price,
      rating: r || rating,
      sort: s || sort,
      page: pg || page,
    };

    const queryString = new URLSearchParams(params).toString();
    return `/search?${queryString}`;
  };

  const products = await getAllProducts({
    query,
    category,
    price,
    rating,
    sort,
    page: Number(page),
  });

  const categories = await getAllCategories();

  return (
    <div className="grid md:grid-cols-5 md:gap-5">
      <div className="filter-links">
        {/* Category Links */}
        <div className="text-xl mb-2 mt-3">Department</div>
        <div>
          <ul className="space-y-1">
            <li>
              <Link
                className={`${
                  (category === "all" || category === "") && "font-bold"
                }`}
                href={getFilterUrl({ c: "all" })}>
                Any
              </Link>
            </li>
            {categories.map((x) => (
              <li key={x.category}>
                <Link
                  className={`${category === x.category && "font-bold"}`}
                  href={getFilterUrl({ c: x.category })}>
                  {x.category}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Price Links */}
        <div className="text-xl mb-2 mt-8">Price</div>
        <div>
          <ul className="space-y-1">
            <li>
              <Link
                className={`${price === "all" && "font-bold"}`}
                href={getFilterUrl({ p: "all" })}>
                Any
              </Link>
            </li>
            {prices.map((x) => (
              <li key={x.value}>
                <Link
                  className={`${price === x.value && "font-bold"}`}
                  href={getFilterUrl({ p: x.value })}>
                  {x.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {/* Rating Links */}
        <div className="text-xl mb-2 mt-8">Customer Rating</div>
        <div>
          <ul className="space-y-1">
            <li>
              <Link
                className={`${rating === "all" && "font-bold"}`}
                href={getFilterUrl({ r: "all" })}>
                Any
              </Link>
            </li>
            {ratings.map((x) => (
              <li key={x}>
                <Link
                  className={`${rating === x.toString() && "font-bold"}`}
                  href={getFilterUrl({ r: `${x}` })}>
                  {`${x} Stars & Up`}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="md:col-span-4 space-y-4">
        <div className="flex-between flex-col md:flex-row my-4">
          <div className="flex items-center text-sm">
            {query !== "all" && query !== "" && "Query: " + query}
            {category !== "all" && category !== "" && " Category: " + category}
            {price !== "all" && price !== "" && " Price: " + price}
            {rating !== "all" &&
              rating !== "" &&
              " Rating: " + rating + " Stars & Up"}
            &nbsp;
            {(query !== "all" && query !== "") ||
            (category !== "all" && category !== "") ||
            (price !== "all" && price !== "") ||
            (rating !== "all" && rating !== "") ? (
              <Button variant={"link"} asChild>
                <Link href="/search">Clear Filters</Link>
              </Button>
            ) : null}
          </div>
          <div>
            {/* Sorting */}
            Sort by{" "}
            {sortOrders.map((s) => (
              <Link
                key={s}
                className={`mx-2 text-sm ${sort == s && "font-bold"}`}
                href={getFilterUrl({ s })}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.data.length === 0 && <div>No products found.</div>}
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
