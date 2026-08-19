import { useQuery } from '@tanstack/react-query';
import styles from './index.module.css';

interface Parc {
  id: string;
  name: string;
  description: string;
}

export function Index() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['parcs'],
    queryFn: async (): Promise<Parc[]> => {
      const response = await fetch('http://localhost:3001/api/1/parcs');

      const json = await response.json();
      // Handle array unwrap
      return Array.isArray(json) ? json : json.data;
    },
  });

  if (isPending) {
    return <p>Loading parcs...</p>;
  }

  if (isError) {
    return (
      <div>
        <p>Could not load parcs: {error.message}</p>
        <button onClick={() => refetch()}>Try again</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>Parcs</h1>
      {isFetching && <p>Refreshing...</p>}
      {data.length === 0 ? (
        <p>No parcs found.</p>
      ) : (
        <ul>
          {data.map((parc) => (
            <li key={parc.id}>
              <strong>{parc.name}</strong> - {parc.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Index;
