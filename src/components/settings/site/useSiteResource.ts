'use client';
import { SiteContentService, type SiteResource } from '@/utils/api';

interface Options {
  resource: SiteResource;
  reload: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const message = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

/**
 * Acciones comunes de una lista del sitio (servicios, clientes, enlaces). Ninguna tira: los errores van al
 * FeedbackModal de la página, salvo `reorder`, que rechaza para que el modal de orden muestre el mensaje.
 */
export function useSiteResource<T extends { id: number; is_active: boolean }>({ resource, reload, onSuccess, onError }: Options) {
  return {
    toggle: async (item: T) => {
      try {
        await SiteContentService.update(resource, item.id, { is_active: !item.is_active });
        await reload();
      } catch (err) {
        onError(message(err, 'Error al guardar'));
      }
    },
    remove: async (item: T) => {
      try {
        await SiteContentService.remove(resource, item.id);
        onSuccess('Eliminado correctamente.');
        await reload();
      } catch (err) {
        onError(message(err, 'Error al eliminar'));
      }
    },
    reorder: async (orderedIds: number[]) => {
      await SiteContentService.reorder(resource, orderedIds);
      onSuccess('Orden actualizado.');
      await reload();
    },
    /** Da de alta, en orden, los valores originales del manifiesto para poder editarlos. */
    importAll: async (bodies: unknown[]) => {
      try {
        for (const body of bodies) await SiteContentService.create(resource, body);
        onSuccess('Se cargaron los valores originales. Ya podés editarlos.');
      } catch (err) {
        onError(message(err, 'Error al cargar los valores originales'));
      }
      await reload();
    },
  };
}
