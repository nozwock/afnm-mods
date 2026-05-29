import { Box, FormControlLabel, Switch } from '@mui/material';
import { globalState } from './state';

const t = window.modAPI.utils.t;

export function registerUI() {
  window.modAPI.injectUI('new-game-character-creation', (api, inject) => {
    const GameTooltip = api.components.GameTooltip;
    const GameTooltipBox = api.components.GameTooltipBox;

    globalState.enableModOnNewGame = false;

    inject(
      '#new-game-character-creation > .MuiBox-root > .MuiBox-root:last-of-type .MuiButtonBase-root:last-of-type',
      <Box
        id="nozwock-stat-lock-toggle"
        marginRight={2}
        sx={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
        }}
      >
        <GameTooltip provider={() => <GameTooltipBox></GameTooltipBox>}>
          <FormControlLabel
            label={t('Stat Lock')}
            control={
              <Switch
                onChange={(_, value) => {
                  globalState.enableModOnNewGame = value;
                }}
              ></Switch>
            }
          ></FormControlLabel>
        </GameTooltip>
      </Box>,
      'before',
    );
  });
}
