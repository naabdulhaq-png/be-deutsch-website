import type { Question, Response } from './model';
export function answered(q: Question, response: Response | undefined): boolean {
  if (q.mode === 'matching') return !!response && !Array.isArray(response) && typeof response === 'object' && q.people.every(p => typeof response[p.id] === 'string' && !!response[p.id]);
  if (q.mode === 'sequence') return Array.isArray(response) && response.length === q.options.length;
  if (q.mode === 'order') return Array.isArray(response) && response.length === q.tokens.length;
  return typeof response === 'string' && response.trim().length > 0;
}
export function orderText(q: Question, response: string[]): string {
  // Persisted browser data can be valid JSON with the wrong response shape.
  if (!Array.isArray(response) || !response.every(id => typeof id === 'string')) return '';
  const text = response.map(id => q.tokens.find(t => t.id === id)?.label ?? '').join(' ');
  return text.charAt(0).toLocaleUpperCase('de-DE') + text.slice(1);
}
export function grade(q: Question, response: Response | undefined): boolean {
  if (!answered(q, response)) return false;
  if (q.mode === 'choice') return response === q.solution;
  if (q.mode === 'matching') {
    const map = response as Record<string, string>, solution = q.solution as Record<string, string>;
    return Object.keys(map).length === q.people.length && q.people.every(p => map[p.id] === solution[p.id]);
  }
  if (q.mode === 'sequence') return JSON.stringify(response) === JSON.stringify(q.solution);
  const value = q.mode === 'order' ? orderText(q, response as string[]) : String(response).trim();
  return [q.canonical, ...q.accepted].includes(value);
}
export function score(ids: string[], questions: Record<string, Question>, responses: Record<string, Response>) {
  return { correct: ids.filter(id => grade(questions[id], responses[id])).length, possible: ids.length, unanswered: ids.filter(id => !answered(questions[id], responses[id])).length };
}
