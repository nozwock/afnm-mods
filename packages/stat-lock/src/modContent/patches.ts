import { PhysicalStatistic } from 'afnm-types';
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
          for (const [stat, it] of Object.entries(stats)) {
            if (it.locked)
              intent.player.physicalStats[stat as PhysicalStatistic] = it.value;
          }
        });
      });
      window.modAPI.hooks.onGameLoad((state) => {
        return produce(state, (state) => {
          const stats = modConfig.value.lockedPhysicalStats;
          for (const [stat, it] of Object.entries(stats)) {
            if (it.locked)
              state.player.player.physicalStats[stat as PhysicalStatistic] =
                it.value;
          }
        });
      });
      window.modAPI.hooks.onReduxAction((action, prevState, state) => {
        if (action === 'player/updatePlayer') {
          return produce(state, (state) => {
            const stats = modConfig.value.lockedPhysicalStats;
            for (const [stat, it] of Object.entries(stats)) {
              if (it.locked)
                state.player.player.physicalStats[stat as PhysicalStatistic] =
                  it.value;
            }
          });
        }
        return state;
      });
    },
  }),
};
