'use client';
import React from 'react';
import IconTileGrid from '../common/IconTileGrid';
import { PORTAL_MENU_ITEMS } from './portalMenuItems';

export default function PortalHomeGrid() {
  const items = PORTAL_MENU_ITEMS.filter((item) => !item.hidden).map((item) => ({
    key: item.key,
    label: item.label,
    path: item.mobilePath || item.path,
    icon: item.icon,
  }));

  return <IconTileGrid items={items} />;
}
