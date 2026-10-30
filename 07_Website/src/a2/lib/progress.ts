import type { Response } from './model';
export const contentVersion = 'BD-A2-W01.1';
export const storageKey = `be-deutsch:a2-unit1:${contentVersion}:v1`;
export interface Draft { responses: Record<string, Response>; index: number; checked: Record<string, boolean>; aided: boolean; submitted: boolean }
export interface Attempt { id: string; date: string; correct: number; possible: number; unanswered: number; aided: boolean; version: string; responses?: Record<string, Response>; results?: Record<string, boolean>; questions?: string[] }
export interface Progress { schema: 1; contentVersion: string; reviewed: Record<string, boolean>; practice: Record<string, boolean>; drafts: Record<string, Draft>; attempts: Record<string, Attempt[]>; positions: Record<string, number>; revision: Record<string, { anchor: number; last: number; stage: number; due: number }>; resume: string }
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export const blankDraft = (): Draft => ({ responses: {}, index: 0, checked: {}, aided: false, submitted: false });
export const freshProgress = (): Progress => ({ schema: 1, contentVersion, reviewed: {}, practice: {}, drafts: {}, attempts: {}, positions: {}, revision: {}, resume: '/a2/unit-1/' });
let memory = freshProgress();
export let persistenceAvailable = true;
function object(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v); }
function booleans(v: unknown): Record<string, boolean> { return object(v) ? Object.fromEntries(Object.entries(v).filter(([k,x]) => k.length < 160 && typeof x === 'boolean')) as Record<string, boolean> : {}; }
export function parseProgress(raw: string | null): Progress {
  const fresh = freshProgress(); if (!raw || raw.length > 2_000_000) return fresh;
  try {
    const p = JSON.parse(raw); if (!object(p) || p.schema !== 1 || p.contentVersion !== contentVersion) return fresh;
    fresh.reviewed = booleans(p.reviewed); fresh.practice = booleans(p.practice);
    if (typeof p.resume === 'string') { if (/^\/a2\/unit-1\/(?:[a-z0-9-]+\/)*$/.test(p.resume)) fresh.resume = p.resume; else if (/^\/preview-a2\/(?:[a-z0-9-]+\/)*$/.test(p.resume)) fresh.resume = p.resume.replace('/preview-a2/', '/a2/unit-1/'); }
    if (object(p.positions)) for (const [k,v] of Object.entries(p.positions)) if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 10000) fresh.positions[k] = v;
    if (object(p.drafts)) for (const [k,v] of Object.entries(p.drafts)) if (object(v)) {
      const draft = blankDraft(); draft.index = typeof v.index === 'number' && Number.isInteger(v.index) ? Math.max(0,Math.min(v.index,202)) : 0;
      draft.aided = v.aided === true; draft.submitted = v.submitted === true; draft.checked = booleans(v.checked);
      if (object(v.responses)) for (const [id,response] of Object.entries(v.responses)) {
        if (typeof response === 'string' && response.length <= 10000) draft.responses[id] = response;
        else if (Array.isArray(response) && response.length <= 100 && response.every(x => typeof x === 'string' && x.length < 1000)) draft.responses[id] = response;
        else if (object(response) && Object.keys(response).length < 30 && Object.values(response).every(x => typeof x === 'string' && x.length < 1000)) draft.responses[id] = response as Record<string,string>;
      }
      fresh.drafts[k] = draft;
    }
    if (object(p.attempts)) for (const [k, v] of Object.entries(p.attempts)) if (Array.isArray(v)) fresh.attempts[k] = v.filter(a => object(a) && typeof a.id === 'string' && typeof a.date === 'string' && typeof a.correct === 'number' && typeof a.possible === 'number' && a.correct >= 0 && a.correct <= a.possible && a.possible <= 202 && a.version === contentVersion).slice(-100) as Attempt[];
    if (object(p.revision)) for (const [k,v] of Object.entries(p.revision)) if (object(v) && typeof v.stage === 'number' && typeof v.last === 'number' && typeof v.due === 'number' && Number.isFinite(v.due)) fresh.revision[k] = {anchor:typeof v.anchor==='number'?v.anchor:v.last,stage:Math.max(0,Math.min(5,v.stage)),last:v.last,due:v.due};
    return fresh;
  } catch { return fresh; }
}
export function loadProgress(storage?: StoragePort): Progress {
  if (!persistenceAvailable && !storage) return memory;
  try { const port = storage ?? localStorage; memory = parseProgress(port.getItem(storageKey)); return memory; }
  catch { persistenceAvailable = false; return memory; }
}
export function updateProgress(change: (state: Progress) => void, storage?: StoragePort): Progress {
  const state = loadProgress(storage); change(state); memory = state;
  try { (storage ?? localStorage).setItem(storageKey, JSON.stringify(state)); }
  catch { persistenceAvailable = false; }
  return state;
}
export function scheduleRevision(state: Progress, id: string, correct: boolean, now = Date.now()) {
  const old = state.revision[id]; const stage = correct ? Math.min((old?.stage ?? -1)+1,5) : 0;
  const anchor = correct && old ? old.anchor : now;
  // Approved calendar: Days 0, 1, 3, 7, 14 and 30; misses restart with a 24-hour retry.
  const target = stage < 5 ? anchor + [1,3,7,14,30][stage]*86400000 : now+30*86400000;
  state.revision[id] = { anchor, last: now, stage, due: Math.max(target,now+86400000) };
}
