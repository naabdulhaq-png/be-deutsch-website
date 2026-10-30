export type Option = { id: string; label: string };
export type Response = string | string[] | Record<string, string>;
export type Question = {
  id: string; parent: string; mode: 'choice' | 'entry' | 'order' | 'matching' | 'sequence';
  instructions: string; prompt: string; canonical: string; accepted: string[];
  sourceType: string; objective: string; target: string; correctFeedback: string;
  incorrectFeedback: string; evidence: string[]; difficulty: string;
  options: Option[]; tokens: Option[]; people: Option[]; solution: Response;
  sourceHash: string; displayAlias?: string;
};
export type Assessment = { id: string; sourceId: string; title: string; questions: string[]; delayed: boolean };
export type AudioAsset = { id: string; contentId: string; section: string; url: string; sha256: string; duration: number; bytes: number; sampleRate: number; channels: number; bitrate: number; provenance: string; approval: string; voices: { speaker: string; voice: string; text: string; start: number }[] };
