"use server";

import z from "zod";
import { insertReviewSchema } from "../validators";
import { formatError } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

// Create or update a review
export async function createOrUpdateReview(
  data: z.infer<typeof insertReviewSchema>
) {
  try {
    const session = await auth();
    if (!session) throw new Error("User not authenticated");

    const review = insertReviewSchema.parse({
      ...data,
      userId: session.user.id as string,
    });

    // Get product being reviewed
    const product = await prisma.product.findFirst({
      where: { id: review.productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if user has already reviewed the product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: review.productId,
        userId: review.userId,
      },
    });

    await prisma.$transaction(async (tx) => {
      if (existingReview) {
        // Update existing review
        await tx.review.update({
          where: { id: existingReview.id },
          data: {
            title: review.title,
            description: review.description,
            rating: review.rating,
          },
        });
      } else {
        // Create new review
        await tx.review.create({
          data: review,
        });
      }
      // Recalculate product rating
      const averageRating = await tx.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
      });

      // get total number of reviews
      const totalReviews = await tx.review.count({
        where: { productId: review.productId },
      });

      // Update product with new rating and review count
      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: averageRating._avg.rating || 0,
          numReviews: totalReviews,
        },
      });
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: existingReview
        ? "Review updated successfully"
        : "Review created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Get all reviews for a product
export async function getReviewsByProductId({
  productId,
}: {
  productId: string;
}) {
  const data = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return { data };
}

// Get a review by current user for a product
export async function getReviewByUserForProduct({
  productId,
}: {
  productId: string;
}) {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  const data = await prisma.review.findFirst({
    where: {
      productId,
      userId: session?.user?.id as string,
    },
    include: { user: { select: { name: true } } },
  });

  return data;
}
