import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodError } from "zod";
import qs from "query-string";

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

// Format Number
const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatNumber(value: number | string): string {
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (isNaN(numericValue)) {
    throw new Error(
      "Value is not a number or string representation of a number"
    );
  }
  return NUMBER_FORMATTER.format(numericValue);
}

// Shorten UUID:
export function formatId(id: string) {
  return `..${id.substring(id.length - 6)}`;
}

// Format Date and Time:
export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions
  );
  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions
  );
  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions
  );
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

// Form url for pagination link
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value: string | null;
}) {
  const query = qs.parse(params);
  if (value === null) {
    delete query[key];
  } else {
    query[key] = value;
  }
  return qs.stringifyUrl(
    { url: window.location.pathname, query },
    { skipNull: true }
  );
}
