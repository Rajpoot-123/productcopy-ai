import { z } from "zod";

export const productInputSchema = z.object({
  productName: z.string().trim().min(1).max(200),
  productDetails: z.string().trim().min(1).max(10000),
  targetCustomer: z.string().trim().max(2000).optional(),
  tone: z.string().trim().max(100).optional(),
  keywords: z.string().trim().max(2000).optional(),
});

export const generatedCopySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  benefits: z.array(z.string()).min(3).max(6),
  features: z.array(z.string()).min(3).max(8),
  seoTitle: z.string().min(1).max(70),
  metaDescription: z.string().min(1).max(160),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  socialCaption: z.string().min(1),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type GeneratedCopy = z.infer<typeof generatedCopySchema>;