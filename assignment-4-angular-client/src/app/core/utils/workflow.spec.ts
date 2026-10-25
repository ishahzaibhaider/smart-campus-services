import { nextStatus, statusSlug } from './workflow';

describe('workflow', () => {
  it('only allows one step forward', () => {
    expect(nextStatus('Submitted')).toBe('Assigned');
    expect(nextStatus('Assigned')).toBe('In Progress');
    expect(nextStatus('In Progress')).toBe('Resolved');
    expect(nextStatus('Resolved')).toBe('Closed');
    expect(nextStatus('Closed')).toBeNull();
  });

  it('builds css slugs', () => {
    expect(statusSlug('In Progress')).toBe('in-progress');
  });
});
