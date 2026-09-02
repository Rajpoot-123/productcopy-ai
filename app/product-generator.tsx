"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type GeneratedCopy = {
  title: string;
  description: string;
  benefits: string[];
  features: string[];
  seoTitle: string;
  metaDescription: string;
  slug: string;
  socialCaption: string;
};

export default function ProductGenerator() {
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [tone, setTone] = useState("Modern & Professional");
  const [keywords, setKeywords] = useState("");

  const [generatedCopy, setGeneratedCopy] =
    useState<GeneratedCopy | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsGenerating(true);
    setError("");
    setGeneratedCopy(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          productDetails,
          targetCustomer,
          tone,
          keywords,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to generate product copy."
        );
      }

      setGeneratedCopy(result.data);

      // Refresh server components so the new generation
      // appears immediately in the History section.
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating copy."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Product Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Product Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Only provide information that is actually known about the product.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="product-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Product Name
            </label>

            <input
              id="product-name"
              type="text"
              required
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              placeholder="e.g. Premium Oversized T-Shirt"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="product-details"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Product Details
            </label>

            <textarea
              id="product-details"
              required
              rows={7}
              value={productDetails}
              onChange={(event) => setProductDetails(event.target.value)}
              placeholder="Enter all known product information..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="target-customer"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Target Customer
            </label>

            <textarea
              id="target-customer"
              rows={3}
              value={targetCustomer}
              onChange={(event) => setTargetCustomer(event.target.value)}
              placeholder="e.g. People interested in casual streetwear"
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="tone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tone
            </label>

            <select
              id="tone"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            >
              <option>Modern & Professional</option>
              <option>Friendly & Conversational</option>
              <option>Premium & Elegant</option>
              <option>Bold & Energetic</option>
              <option>Minimal & Clean</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="keywords"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Keywords
            </label>

            <textarea
              id="keywords"
              rows={3}
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="e.g. oversized t-shirt, streetwear, casual wear"
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>✨</span>
            {isGenerating ? "Generating..." : "Generate Copy"}
          </button>
        </form>
      </section>

      {/* Generated Copy */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-950">
            AI Generated Copy
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your structured product copy will appear here.
          </p>
        </div>

        {!generatedCopy && !isGenerating && (
          <div className="flex min-h-[600px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                ✨
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                Ready to generate
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your product information and click Generate Copy.
              </p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex min-h-[600px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

              <p className="mt-4 text-sm font-medium text-slate-700">
                Creating your product copy...
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Analyzing the information you provided.
              </p>
            </div>
          </div>
        )}

        {generatedCopy && (
          <div className="space-y-6">
            <CopySection title="Product Title">
              <p className="text-base font-semibold text-slate-900">
                {generatedCopy.title}
              </p>
            </CopySection>

            <CopySection title="Description">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {generatedCopy.description}
              </p>
            </CopySection>

            <CopySection title="Benefits">
              <ul className="space-y-2">
                {generatedCopy.benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CopySection>

            <CopySection title="Features">
              <ul className="space-y-2">
                {generatedCopy.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CopySection>

            <CopySection title="SEO">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    SEO Title
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {generatedCopy.seoTitle}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Meta Description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {generatedCopy.metaDescription}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    URL Slug
                  </p>

                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
                    {generatedCopy.slug}
                  </p>
                </div>
              </div>
            </CopySection>

            <CopySection title="Social Media Caption">
              <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
                {generatedCopy.socialCaption}
              </p>
            </CopySection>
          </div>
        )}
      </section>
    </div>
  );
}

function CopySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}