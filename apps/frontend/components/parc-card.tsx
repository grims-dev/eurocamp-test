import { useQuery } from '@tanstack/react-query';

export interface Parc {
  id: string;
  name: string;
  description: string;
}

interface ParcCardProps {
  id: string;
  baseUrl: string;
  retry: number | boolean;
}

/** Each card owns its own request */
export function ParcCard({ id, baseUrl, retry }: ParcCardProps) {
  const { data, isPending, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['parc', baseUrl, id],
    retry,
    queryFn: async (): Promise<Parc> => {
      const response = await fetch(`${baseUrl}/parcs/${id}`);

      // Handle fetch resolving but not ok
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return response.json();
    },
  });

  if (isPending) {
    return <li className="card">Loading...</li>;
  }

  if (isError) {
    return (
      <li className="card cardError">
        <span>{error.message}</span>
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Retrying...' : 'Retry'}
        </button>
      </li>
    );
  }

  return (
    <li className="card">
      <strong>{data.name}</strong>
      <>{data.description}</>
    </li>
  );
}
