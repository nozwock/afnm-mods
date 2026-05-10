import { GlobalConfig } from 'common/config';
import { MOD_ID } from './const';

const defaultConfig = {
  preventItemConsumption: {
    enabled: true,
  },
};

export type ModConfig = typeof defaultConfig;
export const modConfig = new GlobalConfig(`${MOD_ID}.config`, defaultConfig);
