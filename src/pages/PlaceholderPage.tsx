import { ArrowUpRight } from "lucide-react";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page placeholder-page">
      <div className="eyebrow">Coming next</div>
      <h1>{title}</h1>
      <p>This workspace is ready for the next implementation milestone.</p>
      <div className="placeholder-card">
        <ArrowUpRight size={24} />
        <span>The data layer and feature workflow will be connected here.</span>
      </div>
    </section>
  );
}
