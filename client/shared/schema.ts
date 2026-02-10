import { z } from "zod";

// Zod schema for creating a post
export const insertPostSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title cannot exceed 100 characters"),
  content: z.string()
    .min(10, "Content must be at least 10 characters"),
  categoryId: z.number().min(1, "Please select a category"),
  imageUrl: z.string().optional(),
});

// Type for post form values
export type PostFormValues = z.infer<typeof insertPostSchema>;

// Category type for dropdowns
export interface Category {
  id: number;
  name: string;
  slug: string;
}
