import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FrontPage, FrontPageSkeleton } from "@/components/FrontPage";
import { SECTIONS, sectionBySlug } from "@/lib/sections";

export function generateStaticParams() {
  return SECTIONS.map((s) => ({ section: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/section/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: sectionBySlug(section)?.label ?? "Section" };
}

async function SectionContent({ params }: Pick<PageProps<"/section/[section]">, "params">) {
  const section = sectionBySlug((await params).section);
  if (!section) notFound();
  return <FrontPage feed={section.feed} heading={section.label} />;
}

export default function SectionPage({ params }: PageProps<"/section/[section]">) {
  return (
    <Suspense fallback={<FrontPageSkeleton />}>
      <SectionContent params={params} />
    </Suspense>
  );
}
