import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";

import { generatedCopySchema, productInputSchema } from "@/lib/product-schema";
import { createClient } from "@/lib/server";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const FREE_GENERATION_LIMIT = 10;

const SYSTEM_PROMPT = `
You are ProductCopy AI, an expert ecommerce product copywriter.

Your job is to transform merchant-supplied product information into persuasive,
natural, Shopify-ready product copy.

STRICT PRODUCT TRUTH RULES:

1. Never invent product specifications.
2. Never invent materials, measurements, certifications, guarantees, medical
   claims, performance claims, durability claims, or other facts.
3. Only use information explicitly supplied by the merchant.
4. If a fact is missing, do not guess it.
5. Make the copy persuasive without making unsupported claims.
6. Write naturally. Avoid generic AI-sounding language.
7. Optimize the output for Shopify ecommerce product pages.
8. Keep SEO titles concise and useful.
9. Keep meta descriptions useful, readable, and natural.
10. Use supplied keywords naturally. Never keyword-stuff.
11. The output must be appropriate for a real online store.

IMPORTANT:
- Benefits must be based only on supplied product information.
- Features must be based only on supplied product information.
- Do not convert assumptions into facts.
- Do not add numbers, percentages, dimensions, materials, certifications,
  guarantees, or technical specifications unless supplied.
- Do not make medical or health claims.
- Do not make unsupported performance or durability claims.
- Do not mention information that was not provided by the merchant.
- If target customer information is missing, write generally without inventing
  a demographic.
- If keywords are supplied, use them naturally where appropriate.
- The URL slug must contain only lowercase letters, numbers, and hyphens.
- Do not include markdown in the generated fields unless specifically useful
  for the description.
`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const parsedInput = productInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: "Invalid product information.",
          details: parsedInput.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { productName, productDetails, targetCustomer, tone, keywords } =
      parsedInput.data;

    /*
     * Get usage record.
     */
    let { data: usage, error: usageError } = await supabase
      .from("usage")
      .select("user_id, generation_count, period_start, period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (usageError) {
      console.error("Usage lookup error:", usageError);

      return NextResponse.json(
        {
          error: "Unable to check generation usage.",
          details: usageError.message,
          code: usageError.code,
          hint: usageError.hint,
          details_from_supabase: usageError.details,
        },
        { status: 500 },
      );
    }
    /*
     * Create usage record if it does not exist.
     */
    if (!usage) {
      const { data: createdUsage, error: createUsageError } = await supabase
        .from("usage")
        .insert({
          user_id: user.id,
          generation_count: 0,
        })
        .select("user_id, generation_count, period_start, period_end")
        .single();

      if (createUsageError || !createdUsage) {
        console.error("Usage creation error:", createUsageError);

        return NextResponse.json(
          { error: "Unable to initialize generation usage." },
          { status: 500 },
        );
      }

      usage = createdUsage;
    }

    /*
     * Reset usage when the current 30-day period has expired.
     */
    const today = new Date();
    const periodEnd = new Date(`${usage.period_end}T00:00:00`);

    if (today > periodEnd) {
      const newPeriodStart = today.toISOString().split("T")[0];

      const newPeriodEndDate = new Date(today);
      newPeriodEndDate.setDate(newPeriodEndDate.getDate() + 30);

      const newPeriodEnd = newPeriodEndDate.toISOString().split("T")[0];

      const { data: resetUsage, error: resetError } = await supabase
        .from("usage")
        .update({
          generation_count: 0,
          period_start: newPeriodStart,
          period_end: newPeriodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select("user_id, generation_count, period_start, period_end")
        .single();

      if (resetError || !resetUsage) {
        console.error("Usage reset error:", resetError);

        return NextResponse.json(
          { error: "Unable to reset generation usage." },
          { status: 500 },
        );
      }

      usage = resetUsage;
    }

    /*
     * Check generation limit.
     */
    if (usage.generation_count >= FREE_GENERATION_LIMIT) {
      return NextResponse.json(
        {
          error:
            "You have reached your generation limit for the current period.",
          limit: FREE_GENERATION_LIMIT,
          used: usage.generation_count,
          remaining: 0,
        },
        { status: 429 },
      );
    }

    const merchantInformation = `
PRODUCT NAME:
${productName}

PRODUCT DETAILS:
${productDetails}

TARGET CUSTOMER:
${targetCustomer || "Not provided"}

TONE:
${tone || "Modern & Professional"}

KEYWORDS:
${keywords || "Not provided"}
`;

    /*
     * Generate AI copy.
     */
    const result = await generateText({
      model: openrouter("openai/gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      prompt: `
Create structured ecommerce product copy using ONLY the merchant information
below.

${merchantInformation}

Return the following fields:

- title
- description
- benefits: 3 to 6 items
- features: 3 to 8 items
- seoTitle
- metaDescription
- slug
- socialCaption

Before producing the result, internally verify that every factual statement
can be supported directly by the merchant information.
`,
      output: Output.object({
        schema: generatedCopySchema,
      }),
    });

    if (!result.output) {
      return NextResponse.json(
        { error: "AI did not return valid product copy." },
        { status: 502 },
      );
    }

    const generatedCopy = result.output;

    /*
     * Save product information.
     */
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        product_name: productName,
        product_details: productDetails,
        target_customer: targetCustomer || null,
        tone: tone || null,
        keywords: keywords || null,
      })
      .select("id")
      .single();

    if (productError || !product) {
      console.error("Product save error:", productError);

      return NextResponse.json(
        {
          error: "Copy was generated, but the product could not be saved.",
        },
        { status: 500 },
      );
    }

    /*
     * Save generated copy.
     */
    const { data: savedCopy, error: generatedCopyError } = await supabase
      .from("generated_copies")
      .insert({
        product_id: product.id,
        user_id: user.id,
        title: generatedCopy.title,
        description: generatedCopy.description,
        benefits: generatedCopy.benefits,
        features: generatedCopy.features,
        seo_title: generatedCopy.seoTitle,
        meta_description: generatedCopy.metaDescription,
        slug: generatedCopy.slug,
        social_caption: generatedCopy.socialCaption,
      })
      .select("id")
      .single();

    if (generatedCopyError || !savedCopy) {
      console.error("Generated copy save error:", generatedCopyError);

      /*
       * Remove the product if generated copy could not be saved,
       * preventing an orphan product record.
       */
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          error:
            "Copy was generated, but the generated copy could not be saved.",
        },
        { status: 500 },
      );
    }

    /*
     * Increment usage ONLY after successful database persistence.
     */
    const newGenerationCount = usage.generation_count + 1;

    const { error: usageUpdateError } = await supabase
      .from("usage")
      .update({
        generation_count: newGenerationCount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (usageUpdateError) {
      console.error("Usage increment error:", usageUpdateError);

      return NextResponse.json(
        {
          error: "Copy was saved, but usage could not be updated.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: generatedCopy,
      productId: product.id,
      generatedCopyId: savedCopy.id,
      usage: {
        limit: FREE_GENERATION_LIMIT,
        used: newGenerationCount,
        remaining: FREE_GENERATION_LIMIT - newGenerationCount,
      },
    });
  } catch (error) {
    console.error("Product copy generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate product copy.",
      },
      { status: 500 },
    );
  }
}
