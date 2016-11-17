export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type ShortRarity = 'comn' | 'rare' | 'epic' | 'lgnd';

export namespace Rarity {
  export const COMMON : Rarity = 'COMMON';
  export const RARE : Rarity = 'RARE';
  export const EPIC : Rarity = 'EPIC';
  export const LEGENDARY : Rarity = 'LEGENDARY';

  const _short = {
    [COMMON]: <ShortRarity>'comn',
    [RARE]: <ShortRarity>'rare',
    [EPIC]: <ShortRarity>'epic',
    [LEGENDARY]: <ShortRarity>'lgnd'
  };
  const _shortBack = {
    'comn': COMMON,
    'rare': RARE,
    'epic': EPIC,
    'lgnd': LEGENDARY
  };

  export const short = (r : Rarity) => _short[r];
  export const shortBack = (r : ShortRarity) => _shortBack[r];
  export const list = () => _.keys(_short);
  export const shortList = () => _.keys(_shortBack);
}
