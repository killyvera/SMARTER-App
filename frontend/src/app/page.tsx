import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Smarter App</h1>
        <p className="text-muted-foreground">
          Gestión de metas basada en el método SMARTER
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button asChild>
            <Link href="/goals">Ver Metas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/goals/new">Nueva Meta</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}


