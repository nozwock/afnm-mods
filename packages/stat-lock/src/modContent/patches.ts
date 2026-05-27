import { definePatch, PatchManager } from 'common/patch';
import { produce } from 'immer';
import { modConfig } from './config';

export const patchManager = new PatchManager();
export const patches = {
  lockPhysicalStats: definePatch({
    name: 'lockPhysicalStats',
    onEnable() {
      window.modAPI.hooks.onNewGame((intent) => {
        return produce(intent, (intent) => {
          const stats = modConfig.value.lockedPhysicalStats;
          for (const [stat, n] of Object.entries(stats) as [
            keyof typeof stats,
            number,
          ][]) {
            intent.player.physicalStats[stat] = n;
          }
        });
      });
      window.modAPI.hooks.onGameLoad((state) => {
        return produce(state, (state) => {
          const stats = modConfig.value.lockedPhysicalStats;
          for (const [stat, n] of Object.entries(stats) as [
            keyof typeof stats,
            number,
          ][]) {
            state.player.player.physicalStats[stat] = n;
          }
        });
      });
      window.modAPI.hooks.onReduxAction((action, prevState, state) => {
        if (action === 'player/updatePlayer') {
          return produce(state, (state) => {
            const stats = modConfig.value.lockedPhysicalStats;
            for (const [stat, n] of Object.entries(stats) as [
              keyof typeof stats,
              number,
            ][]) {
              state.player.player.physicalStats[stat] = n;
            }
          });
        }
        return state;
      });
    },
  }),
};
