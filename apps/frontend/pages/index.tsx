import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Parc } from '../components/parc-card';
import { ParcsPanel } from '../components/parcs-panel';
import styles from './index.module.css';

const CLIENT_URL = 'http://localhost:3333/api';
const DIRECT_URL = 'http://localhost:3001/api/1';

export function Index() {
  const queryClient = useQueryClient();

  const { data: parcs, isPending, isError, error } = useQuery({
    queryKey: ['parcs'],
    queryFn: async (): Promise<Parc[]> => {
      const response = await fetch(`${CLIENT_URL}/parcs`);

      // Handle fetch resolving but not ok
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return response.json();
    },
  });

  if (isPending) {
    return <p>Loading parcs...</p>;
  }

  if (isError) {
    return <p>Could not load parcs: {error.message}</p>;
  }

  const ids = parcs.map((parc) => parc.id);

  return (
    <div className={styles.page}>
      <h1>Parcs</h1>
      <p>A listing of parcs with each card making their own requests.</p>

      <button onClick={() => queryClient.invalidateQueries({ queryKey: ['parc'] })}>
        Refetch both
      </button>

      <div className={styles.panels}>
        <ParcsPanel
          title="Through the api-client"
          baseUrl={CLIENT_URL}
          ids={ids}
          retry={false}
        />
        <ParcsPanel
          title="Direct to the flaky API"
          baseUrl={DIRECT_URL}
          ids={ids}
          retry={false}
        />
      </div>
    </div>
  );
}

export default Index;
