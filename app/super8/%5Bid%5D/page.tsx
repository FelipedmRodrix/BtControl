import { Super8IndividualStandingsModule } from '@/components/Super8IndividualStandingsModule';

interface PublicSuper8PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ atleta?: string }>;
}

export default async function PublicSuper8StandingsPage({ params, searchParams }: PublicSuper8PageProps) {
  const { id } = await params;
  const { atleta } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Super8IndividualStandingsModule
          mode="public"
          initialEventId={id}
          initialAthleteId={atleta || null}
        />
      </div>
    </main>
  );
}
