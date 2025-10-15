"use server";

import { prisma } from "@/db/prisma";
import { convertToObject } from "../utils";
import { LATEST_PRODUCT_LIMIT } from "../constants";

export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: Number(LATEST_PRODUCT_LIMIT),
    orderBy: { createdAt: "desc" },
  });

  return convertToObject(data);
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findFirst({
    where: { slug },
  });
}
