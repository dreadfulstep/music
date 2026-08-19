import type * as ToneModule from 'tone';

declare global {
  const Tone: typeof ToneModule;
}

export {};