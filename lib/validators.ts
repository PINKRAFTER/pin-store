import { z } from "zod";
import { formatNumberWithDecimalPlaces } from "./utils";
import { PAYMENT_METHODS } from "./constants";

const currency = z
  .string()
  .refine(
    (value) =>
      /^\d+(\.\d{2})?$/.test(formatNumberWithDecimalPlaces(Number(value))),
    "Price must be a valid number with up to two decimal places"
  );

// Schema for inserting products
export const insertProductSchema = z.object({
  name: z.string().min(3, "Name is required with minimum 3 characters"),
  slug: z.string().min(3, "Slug is required with minimum 3 characters"),
  category: z.string().min(3, "Category is required with minimum 3 characters"),
  brand: z.string().min(3, "Brand is required with minimum 3 characters"),
  description: z
    .string()
    .min(3, "Description is required with minimum 3 characters"),
  stock: z.coerce.number(),
  images: z.array(z.string()).min(1, "Product must have at least one image"),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});

// Schema for updating products
export const updateProductSchema = insertProductSchema.extend({
  id: z.string().min(1, "Product ID is required"),
});

// Schema for Sigin in user
export const signInFormSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Schema for Sigin up user
export const signUpFormSchema = z
  .object({
    name: z.string().min(3, "Name is required with minimum 3 characters"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Cart schemas
export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  quantity: z
    .number()
    .int()
    .nonnegative("Quantity must be a non-negative integer"),
  image: z.string().min(1, "Image is required"),
  price: currency,
});

export const insertCartItemsSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Cart must have at least one item"),
  itemsPrice: currency,
  taxPrice: currency,
  shippingPrice: currency,
  totalPrice: currency,
  sessionCartId: z.string().min(1, "Session Cart ID is required"),
  userId: z.string().optional().nullable(),
});

// Schema for Shipping Address
export const shippingAddressSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full Name is required with minimum 3 characters"),
  streetAddress: z
    .string()
    .min(5, "Address is required with minimum 5 characters"),
  city: z.string().min(2, "City is required with minimum 2 characters"),
  postalCode: z
    .string()
    .min(3, "Postal Code is required with minimum 3 characters"),
  country: z.string().min(2, "Country is required with minimum 2 characters"),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// Schema for Order Payment Method
export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, "Payment method is required"),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    message: "Invalid payment method",
    path: ["type"],
  });

// Schema for inserting order
export const insertOrderSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  itemsPrice: currency,
  taxPrice: currency,
  shippingPrice: currency,
  totalPrice: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: "Invalid payment method",
    path: ["paymentMethod"],
  }),
  shippingAddress: shippingAddressSchema,
});

// Schema for inserting order item:
export const insertOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  price: currency,
});

// Schema for Payment Result
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  pricePaid: z.string(),
});

// Schema for updating user profile
export const updateUserProfileSchema = z.object({
  name: z.string().min(3, "Name is required with minimum 3 characters"),
  email: z.email("Invalid email address"),
});

// Schema for updating user
export const updateUserSchema = updateUserProfileSchema.extend({
  id: z.string().min(1, "User ID is required"),
  role: z.string().min(1, "Role is required"),
});
