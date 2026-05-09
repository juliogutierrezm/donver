import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi, getAuthSession, isAuthenticated, subscribeAuthSession } from "@/services/api";
import type { Space } from "@/types";

function getFavoritesQueryKey(userId?: string) {
  return ["favorites", userId ?? "guest"];
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => getAuthSession()?.user ?? null);
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const canUseFavorites = authenticated && Boolean(user?.roles.includes("owner"));
  const queryKey = getFavoritesQueryKey(user?.id);

  useEffect(() => {
    const syncSession = () => {
      const session = getAuthSession();
      setUser(session?.user ?? null);
      setAuthenticated(isAuthenticated());
    };

    syncSession();
    return subscribeAuthSession(syncSession);
  }, []);

  const favoritesQuery = useQuery({
    queryKey,
    queryFn: () => favoritesApi.list(),
    enabled: canUseFavorites,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: ({ spaceId }: { spaceId: string; space: Space }) => favoritesApi.add(spaceId),
    onMutate: async ({ space }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFavorites = queryClient.getQueryData<Space[]>(queryKey);
      queryClient.setQueryData<Space[]>(queryKey, (current = []) =>
        current.some((favorite) => favorite.id === space.id) ? current : [space, ...current]
      );
      return { previousFavorites };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previousFavorites);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: ({ spaceId }: { spaceId: string }) => favoritesApi.remove(spaceId),
    onMutate: async ({ spaceId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFavorites = queryClient.getQueryData<Space[]>(queryKey);
      queryClient.setQueryData<Space[]>(queryKey, (current = []) =>
        current.filter((favorite) => favorite.id !== spaceId)
      );
      return { previousFavorites };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKey, context.previousFavorites);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const favorites = favoritesQuery.data ?? [];
  const favoriteIds = new Set(favorites.map((favorite) => favorite.id));

  return {
    favorites,
    isLoading: favoritesQuery.isLoading,
    isError: favoritesQuery.isError,
    error: favoritesQuery.error,
    canUseFavorites,
    isFavorite: (spaceId: string) => favoriteIds.has(spaceId),
    isUpdatingFavorite: (spaceId: string) =>
      (addFavoriteMutation.isPending && addFavoriteMutation.variables?.spaceId === spaceId) ||
      (removeFavoriteMutation.isPending && removeFavoriteMutation.variables?.spaceId === spaceId),
    addFavorite: (space: Space) => addFavoriteMutation.mutateAsync({ spaceId: space.id, space }),
    removeFavorite: (spaceId: string) => removeFavoriteMutation.mutateAsync({ spaceId }),
    toggleFavorite: (space: Space) =>
      favoriteIds.has(space.id)
        ? removeFavoriteMutation.mutateAsync({ spaceId: space.id })
        : addFavoriteMutation.mutateAsync({ spaceId: space.id, space }),
  };
}
