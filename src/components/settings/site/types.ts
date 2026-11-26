import type { SiteAdminData, SiteDefaults } from '@/utils/api';

/** Props comunes de cada pestaña del ABM del sitio público. */
export interface SiteTabProps {
  data: SiteAdminData;
  defaults: SiteDefaults;
  reload: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}
