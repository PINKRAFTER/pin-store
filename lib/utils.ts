import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// Format numbers with decimal places
export function formatNumberWithDecimalPlaces(num: number): string {
  const [int, decimal] = num.toString().split(".");

  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : `${int}.00`;
}

// Format errors

export function formatError(error: any): string {
  if (error instanceof ZodError) {
    // Handle Zod validation errors
    const fieldErrors = Object.keys(error?.issues).map(
      (field, index) => error.issues[index].message
    );
    return fieldErrors.join(", ");
  } else if (
    error.name === "PrismaClientKnownRequestError" &&
    error.code === "P2002"
  ) {
    // Handle prisma errors
    const field = error.meta?.target ? error.meta.target[0] : "field";
    return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  } else {
    // Handle other errors
    return typeof error.message === "string"
      ? error.message
      : JSON.stringify(error.message);
  }
  return String(error);
}

// Round number to 2 decimal places
export function roundToTwoDecimalPlaces(value: number | string): number {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (isNaN(numericValue)) {
    throw new Error(
      "Value is not a number or string representation of a number"
    );
  }
  return Math.round((numericValue + Number.EPSILON) * 100) / 100;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string): string {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (isNaN(numericValue)) {
    throw new Error(
      "Value is not a number or string representation of a number"
    );
  }
  return CURRENCY_FORMATTER.format(numericValue);
}
