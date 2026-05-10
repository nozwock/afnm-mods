import { GlobalConfig } from 'common/config';
import { MOD_ID } from './const';

export type ModConfig = typeof modConfig.value;
export const modConfig = new GlobalConfig(`${MOD_ID}.config`, {
  preventItemConsumption: {
    enabled: true,
  },
});
