import { PrismaClient } from "@/lib/generated/prisma";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { WebSocket } from "ws";
// import dotenv from "dotenv";

// dotenv.config();
neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL as string;
const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({ adapter }).$extends({
  result: {
    product: {
      price: {
        compute(product) {
          return product.price.toString();
        },
      },
      rating: {
        compute(product) {
          return product.rating.toString();
        },
      },
    },
  },
});
