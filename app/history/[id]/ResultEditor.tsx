"use client";

import { useState } from "react";

type ResultEditorProps = {
  id: string;
  initialData: {
    title: string;
    description: string;
    benefits: string[];
    features: string[];
    seo_title: string;
    meta_description: string;
    slug: string;
    social_caption: string;
  };
};

export default function ResultEditor({ id, initialData }: ResultEditorProps) {
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(field: keyof typeof formData, value: string | string[]) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  function updateArrayItem(
    field: "benefits" | "features",
    index: number,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));

    setMessage("");
    setError("");
  }

  function addArrayItem(field: "benefits" | "features") {
    setFormData((current) => ({
      ...current,
      [field]: [...current[field], ""],
    }));

    setMessage("");
    setError("");
  }

  function removeArrayItem(field: "benefits" | "features", index: number) {
    setFormData((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));

    setMessage("");
    setError("");
  }

  async function handleSave() {
    setMessage("");
    setError("");

    const cleanedBenefits = formData.benefits
      .map((benefit) => benefit.trim())
      .filter(Boolean);

    const cleanedFeatures = formData.features
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (cleanedBenefits.length === 0) {
      setError("At least one benefit is required.");
      return;
    }

    if (cleanedFeatures.length === 0) {
      setError("At least one feature is required.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!formData.seo_title.trim()) {
      setError("SEO title is required.");
      return;
    }

    if (!formData.meta_description.trim()) {
      setError("Meta description is required.");
      return;
    }

    if (!formData.slug.trim()) {
      setError("Slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug.trim())) {
      setError(
        "Slug can only contain lowercase letters, numbers, and hyphens.",
      );
      return;
    }

    if (!formData.social_caption.trim()) {
      setError("Social caption is required.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
          benefits: cleanedBenefits,
          features: cleanedFeatures,
          seo_title: formData.seo_title.trim(),
          meta_description: formData.meta_description.trim(),
          slug: formData.slug.trim(),
          social_caption: formData.social_caption.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to save product copy changes.",
        );
      }

      setFormData({
        title: result.data.title,
        description: result.data.description,
        benefits: Array.isArray(result.data.benefits)
          ? result.data.benefits.map(String)
          : [],
        features: Array.isArray(result.data.features)
          ? result.data.features.map(String)
          : [],
        seo_title: result.data.seo_title,
        meta_description: result.data.meta_description,
        slug: result.data.slug,
        social_caption: result.data.social_caption,
      });

      setMessage("Changes saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product copy changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <EditorSection title="Product Title">
        <textarea
          value={formData.title}
          onChange={(event) => updateField("title", event.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </EditorSection>

      <EditorSection title="Description">
        <textarea
          value={formData.description}
          onChange={(event) => updateField("description", event.target.value)}
          rows={8}
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </EditorSection>

      <EditorSection title="Benefits">
        <div className="space-y-3">
          {formData.benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                value={benefit}
                onChange={(event) =>
                  updateArrayItem("benefits", index, event.target.value)
                }
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder={`Benefit ${index + 1}`}
              />

              <button
                type="button"
                onClick={() => removeArrayItem("benefits", index)}
                className="h-11 shrink-0 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                aria-label={`Remove benefit ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addArrayItem("benefits")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            + Add Benefit
          </button>
        </div>
      </EditorSection>

      <EditorSection title="Features">
        <div className="space-y-3">
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                value={feature}
                onChange={(event) =>
                  updateArrayItem("features", index, event.target.value)
                }
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder={`Feature ${index + 1}`}
              />

              <button
                type="button"
                onClick={() => removeArrayItem("features", index)}
                className="h-11 shrink-0 rounded-xl border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                aria-label={`Remove feature ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addArrayItem("features")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            + Add Feature
          </button>
        </div>
      </EditorSection>

      <EditorSection title="SEO">
        <div className="space-y-5">
          <div>
            <label
              htmlFor="seo-title"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              SEO Title
            </label>

            <textarea
              id="seo-title"
              value={formData.seo_title}
              onChange={(event) => updateField("seo_title", event.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="meta-description"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Meta Description
            </label>

            <textarea
              id="meta-description"
              value={formData.meta_description}
              onChange={(event) =>
                updateField("meta_description", event.target.value)
              }
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              URL Slug
            </label>

            <input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>
        </div>
      </EditorSection>

      <EditorSection title="Social Media Caption">
        <textarea
          value={formData.social_caption}
          onChange={(event) =>
            updateField("social_caption", event.target.value)
          }
          rows={6}
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </EditorSection>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {message && <p className="text-emerald-600">{message}</p>}

          {error && <p className="text-red-600">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function EditorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>

      {children}
    </section>
  );
}
