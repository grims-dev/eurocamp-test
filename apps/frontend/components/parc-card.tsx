import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

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

  const remove = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${baseUrl}/parcs/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['parcs'] });

      const previous = queryClient.getQueryData<Parc[]>(['parcs']);

      // Optimistic as idempotent action. Update list
      queryClient.setQueryData<Parc[]>(['parcs'], (parcs) =>
        parcs?.filter((parc) => parc.id !== id)
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['parcs'], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['parcs'] }),
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
      <button onClick={() => remove.mutate()} disabled={remove.isPending}>
        {remove.isPending ? 'Deleting...' : 'Delete'}
      </button>
    </li>
  );
}
