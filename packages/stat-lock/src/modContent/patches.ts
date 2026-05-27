import { definePatch, PatchManager } from 'common/patch';

export const patchManager = new PatchManager();
export const patches = {
  lockPhysicalStats: definePatch({
    name: 'lockPhysicalStats',
    onEnable() {
      window.modAPI.hooks.onNewGame((intent) => {
        return {
          ...intent,
          player: {
            ...intent.player,
            physicalStats: {
              ...intent.player.physicalStats,
              eyes: 1,
              meridians: 1,
              dantian: 1,
              muscles: 1,
              digestion: 1,
              flesh: 1,
            },
          },
        };
      });
      window.modAPI.hooks.onGameLoad((state) => {
        return {
          ...state,
          player: {
            ...state.player,
            player: {
              ...state.player.player,
              physicalStats: {
                ...state.player.player.physicalStats,
                eyes: 1,
                meridians: 1,
                dantian: 1,
                muscles: 1,
                digestion: 1,
                flesh: 1,
              },
            },
          },
        };
      });
      window.modAPI.hooks.onReduxAction((action, prevState, state) => {
        if (action === 'player/updatePlayer') {
          return {
            ...state,
            player: {
              ...state.player,
              player: {
                ...state.player.player,
                physicalStats: {
                  ...state.player.player.physicalStats,
                  // Always keep physical stats to 1
                  eyes: 1,
                  meridians: 1,
                  dantian: 1,
                  muscles: 1,
                  digestion: 1,
                  flesh: 1,
                },
              },
            },
          };
        }
        return state;
      });
    },
  }),
};
