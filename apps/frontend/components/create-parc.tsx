import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

interface CreateParcProps {
  baseUrl: string;
}

export function CreateParc({ baseUrl }: CreateParcProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const create = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${baseUrl}/parcs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      return response.json();
    },
    // Not optimistic - refetch
    onSuccess: () => {
      setName('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['parcs'] });
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="createForm">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        required
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        required
      />
      <button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Creating...' : 'Add parc'}
      </button>
      {create.isError && (
        <span className="error">{create.error.message}</span>
      )}
    </form>
  );
}
