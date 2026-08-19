import { ParcCard } from './parc-card';

interface ParcsPanelProps {
  title: string;
  baseUrl: string;
  ids: string[];
  retry: number | boolean;
}

export function ParcsPanel({ title, baseUrl, ids, retry }: ParcsPanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p>{baseUrl}/parcs/:id</p>

      <ul className="cards">
        {ids.map((id) => (
          <ParcCard key={id} id={id} baseUrl={baseUrl} retry={retry} />
        ))}
      </ul>
    </section>
  );
}
