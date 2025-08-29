export type Theme = {
  name: string;
  colors: {
    bg: string;
    baseDark: string;
    baseMid: string;
    text: string;
    orange: string;
    orangeDeep: string;
    accentCyan: string;
    accentGreen: string;
  };
  strings: {
    title: string;
    subtitle: string;
    doorLocked: string;
    winTitle: string;
    winSubtitle: string;
  };
};

export type GameConfig = {
  theme: Theme;
  timerSeconds: number; // soft cap; we show elapsed anyway
  puzzleOrder: Array<'power' | 'keypad' | 'cabling' | 'thermal'>;
  powerSequence: number[]; // e.g., [2,4,1,3]
  keypadCode: string;      // "4269" etc.
  cableMap: { [cable: string]: number }; // A->2, B->4...
  thermalTarget: { min: number; max: number }; // inclusive band
  assets: {
    // Optional .glb names in /public/models
    door?: string;
    rack?: string;
    panel?: string;
  };
  easterEgg: { sequence: number[]; windowSeconds: number };
};

export const defaultConfig: GameConfig = {
  theme: {
    name: 'Data-Center Lockdown',
    colors: {
      bg: '#0E0E10',
      baseDark: '#0E0E10',
      baseMid: '#1A1A1D',
      text: '#FFFFFF',
      orange: '#FF6A00',
      orangeDeep: '#FF7F2A',
      accentCyan: '#00FFF0',
      accentGreen: '#00FF90',
    },
    strings: {
      title: 'DATA-CENTER LOCKDOWN',
      subtitle: 'Restore systems • Unlock the door',
      doorLocked: 'Door is locked. Solve all 4 puzzles.',
      winTitle: 'SYSTEM RESTORED',
      winSubtitle: 'You escaped the server room.',
    },
  },
  timerSeconds: 600,
  puzzleOrder: ['power','keypad','cabling','thermal'],
  powerSequence: [2,4,1,3],
  keypadCode: '4269',
  cableMap: { A: 2, B: 4, C: 1, D: 3 },
  thermalTarget: { min: 22, max: 24 },
  assets: {
    door: 'door.glb',
    rack: 'rack.glb',
    panel: 'panel.glb',
  },
  easterEgg: { sequence: [3,1,4,2], windowSeconds: 10 },
};
