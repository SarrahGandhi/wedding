import Link from "next/link";
import { PageHeader } from "@/app/shared/PageHeader";
import { getLogisticsData } from "./data";
import { LogisticsWorkspace } from "./LogisticsWorkspace";

export default async function LogisticsPage({ searchParams }: {
  searchParams: Promise<{ family?: string }>;
}) {
  const [{ families, accommodations }, params] = await Promise.all([getLogisticsData(), searchParams]);
  return (
    <div>
      <PageHeader chapter="Chapter V" title="Logistics." />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Plan travel and stays for families with at least one accepted RSVP.
          Guest counts include each confirmed person once, across all events.
        </p>
        <Link href="/admin/accommodation" className="text-sm text-accent hover:text-foreground">
          View accommodation &rarr;
        </Link>
      </div>
      <LogisticsWorkspace families={families} accommodations={accommodations} initialFamilyId={Number(params.family) || null} />
    </div>
  );
}
