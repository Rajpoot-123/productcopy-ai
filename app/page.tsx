import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import ProductGenerator from "./product-generator";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: history, error: historyError } = await supabase
    .from("generated_copies")
    .select(
      `
        id,
        title,
        created_at,
        product_id,
        products (
          product_name
        )
      `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const historyItems =
    !historyError && history
      ? history.map((item) => {
          const product = Array.isArray(item.products)
            ? item.products[0]
            : item.products;

          return {
            id: item.id,
            title: item.title,
            productName: product?.product_name ?? "Untitled Product",
            createdAt: item.created_at,
          };
        })
      : [];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            ProductCopy AI
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/api/shopify/install"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Connect Shopify
            </Link>

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

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            AI Product Copy Generator
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Turn product information into high-converting copy
          </h1>

          <p className="mt-3 max-w-2xl text-slate-500">
            Provide the facts about your product and let ProductCopy AI turn
            them into structured ecommerce copy.
          </p>
        </div>

        <ProductGenerator />

        {/* History */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Generation History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your previously generated product copies.
              </p>
            </div>

            {historyItems.length > 0 && (
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {historyItems.length}{" "}
                {historyItems.length === 1 ? "generation" : "generations"}
              </span>
            )}
          </div>

          {historyItems.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div>
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                  📝
                </div>

                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  No generation history yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Generate your first product copy and it will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {historyItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/history/${item.id}`}
                  className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.productName}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-600">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <time
                      dateTime={item.createdAt}
                      className="text-xs text-slate-400"
                    >
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>

                    <span
                      aria-hidden="true"
                      className="text-slate-300 transition group-hover:text-slate-500"
                    >
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
