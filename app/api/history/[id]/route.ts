import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/server";

const updateGeneratedCopySchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  benefits: z
    .array(z.string().trim().min(1))
    .min(1, "At least one benefit is required."),
  features: z
    .array(z.string().trim().min(1))
    .min(1, "At least one feature is required."),
  seo_title: z.string().trim().min(1, "SEO title is required."),
  meta_description: z.string().trim().min(1, "Meta description is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens.",
    ),
  social_caption: z.string().trim().min(1, "Social caption is required."),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    /*
     * Verify authenticated user.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /*
     * Validate request body.
     */
    const body = await request.json();

    const parsedBody = updateGeneratedCopySchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid product copy data.",
          details: parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    /*
     * Update only the generation that belongs to the
     * currently authenticated user.
     */
    const { data: updatedCopy, error: updateError } = await supabase
      .from("generated_copies")
      .update({
        title: parsedBody.data.title,
        description: parsedBody.data.description,
        benefits: parsedBody.data.benefits,
        features: parsedBody.data.features,
        seo_title: parsedBody.data.seo_title,
        meta_description: parsedBody.data.meta_description,
        slug: parsedBody.data.slug,
        social_caption: parsedBody.data.social_caption,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
          id,
          title,
          description,
          benefits,
          features,
          seo_title,
          meta_description,
          slug,
          social_caption,
          created_at
        `,
      )
      .maybeSingle();

    if (updateError) {
      console.error("Generated copy update error:", updateError);

      return NextResponse.json(
        {
          error: "Unable to save product copy changes.",
        },
        { status: 500 },
      );
    }

    if (!updatedCopy) {
      return NextResponse.json(
        {
          error: "Generated copy not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCopy,
    });
  } catch (error) {
    console.error("History update error:", error);

    return NextResponse.json(
      {
        error: "Failed to save product copy changes.",
      },
      { status: 500 },
    );
  }
}
