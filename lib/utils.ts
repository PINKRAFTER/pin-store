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
