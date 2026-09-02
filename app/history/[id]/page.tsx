import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/server";
import ResultEditor from "./ResultEditor";

type HistoryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HistoryDetailPage({
  params,
}: HistoryDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: generatedCopy, error } = await supabase
    .from("generated_copies")
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
        created_at,
        products (
          product_name,
          product_details,
          target_customer,
          tone,
          keywords
        )
      `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !generatedCopy) {
    notFound();
  }

  const product = Array.isArray(generatedCopy.products)
    ? generatedCopy.products[0]
    : generatedCopy.products;

  const benefits = Array.isArray(generatedCopy.benefits)
    ? generatedCopy.benefits.map(String)
    : [];

  const features = Array.isArray(generatedCopy.features)
    ? generatedCopy.features.map(String)
    : [];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            ProductCopy AI
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden max-w-[240px] truncate text-sm text-slate-500 sm:block">
              {user.email}
            </span>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <span>←</span>
            Back to Dashboard
          </Link>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-500">
              Generated Product Copy
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {product?.product_name ?? "Untitled Product"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Generated on{" "}
              {new Date(generatedCopy.created_at).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>
          </div>
        </div>

        <ResultEditor
          id={generatedCopy.id}
          initialData={{
            title: generatedCopy.title,
            description: generatedCopy.description,
            benefits,
            features,
            seo_title: generatedCopy.seo_title,
            meta_description: generatedCopy.meta_description,
            slug: generatedCopy.slug,
            social_caption: generatedCopy.social_caption,
          }}
        />
      </section>
    </main>
  );
}