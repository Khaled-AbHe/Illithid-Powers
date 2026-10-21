import { describe, expect, it } from '@jest/globals';
import { computeRevoke, OwnedAbility, previewRevoke } from '../src/abilities/cascade';

const a = (key: string, vialCost: number, ...requires: string[]): OwnedAbility => ({ key, requires, vialCost });

describe('computeRevoke', () => {
  it('removes just the target when nothing depends on it', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('B', 2, 'Root')];
    expect(computeRevoke(owned, 'A')).toEqual({ removed: ['A'], refund: 1 });
  });

  it('cascades down a chain and sums the refund', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('B', 2, 'A'), a('C', 3, 'B')];
    expect(computeRevoke(owned, 'A')).toEqual({ removed: ['A', 'B', 'C'], refund: 6 });
  });

  it('keeps an ability that still has another owned prerequisite (any-of)', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('K', 1, 'Root'), a('D', 2, 'A', 'K')];
    expect(computeRevoke(owned, 'A')).toEqual({ removed: ['A'], refund: 1 });
    expect(computeRevoke(owned, 'K')).toEqual({ removed: ['K'], refund: 1 });
  });

  it('removes it once the last prerequisite goes', () => {
    // Revoking A leaves D (K still owned); the second revoke, of K, then takes D too.
    const owned = [a('Root', 0), a('K', 1, 'Root'), a('D', 2, 'A', 'K')];
    expect(computeRevoke(owned, 'K')).toEqual({ removed: ['K', 'D'], refund: 3 });
  });

  it('handles a diamond where both branches are removed in the same cascade', () => {
    // X -> A, X -> Y -> B, and C needs A or B: C must go, even though A is
    // discovered before B.
    const owned = [
      a('Root', 0), a('X', 1, 'Root'), a('A', 1, 'X'), a('Y', 1, 'X'), a('B', 1, 'Y'), a('C', 5, 'A', 'B'),
    ];
    const { removed, refund } = computeRevoke(owned, 'X');
    expect(new Set(removed)).toEqual(new Set(['X', 'A', 'Y', 'B', 'C']));
    expect(removed[0]).toBe('X');
    expect(refund).toBe(9);
  });

  it('keeps a diamond node that has a surviving branch', () => {
    const owned = [a('Root', 0), a('X', 1, 'Root'), a('Z', 1, 'Root'), a('A', 1, 'X'), a('B', 1, 'Z'), a('C', 5, 'A', 'B')];
    expect(computeRevoke(owned, 'X')).toEqual({ removed: ['X', 'A'], refund: 2 });
  });

  it('leaves unrelated, already-unsupported abilities alone (e.g. DM-granted)', () => {
    // O needs "Missing", which the player never owned; it must not be swept up.
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('O', 3, 'Missing')];
    expect(computeRevoke(owned, 'A')).toEqual({ removed: ['A'], refund: 1 });
  });

  it('is a no-op for something not owned', () => {
    expect(computeRevoke([a('Root', 0)], 'Nope')).toEqual({ removed: [], refund: 0 });
  });

  it('never removes abilities with no prerequisites', () => {
    const owned = [a('Root', 0), a('Free', 2), a('A', 1, 'Root')];
    expect(computeRevoke(owned, 'A').removed).toEqual(['A']);
  });
});

describe('previewRevoke', () => {
  it('matches computeRevoke for what is removed and refunded', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('B', 2, 'A'), a('C', 3, 'B')];
    const { removed, refund } = previewRevoke(owned, 'A');
    expect({ removed, refund }).toEqual(computeRevoke(owned, 'A'));
  });

  it('lists abilities spared by another prerequisite, with what keeps them', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('K', 1, 'Root'), a('D', 2, 'A', 'K')];
    expect(previewRevoke(owned, 'A')).toEqual({
      removed: ['A'],
      refund: 1,
      kept: [{ key: 'D', via: ['K'] }],
    });
  });

  it('does not list something once its last prerequisite goes with it', () => {
    const owned = [a('Root', 0), a('K', 1, 'Root'), a('D', 2, 'A', 'K')];
    expect(previewRevoke(owned, 'K')).toEqual({ removed: ['K', 'D'], refund: 3, kept: [] });
  });

  it('ignores prerequisites the player never owned when naming what keeps something', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('K', 1, 'Root'), a('D', 2, 'A', 'K', 'Never')];
    expect(previewRevoke(owned, 'A').kept).toEqual([{ key: 'D', via: ['K'] }]);
  });

  it('does not list unrelated abilities as kept', () => {
    const owned = [a('Root', 0), a('A', 1, 'Root'), a('B', 2, 'Root')];
    expect(previewRevoke(owned, 'A').kept).toEqual([]);
  });

  it('is empty for something not owned', () => {
    expect(previewRevoke([a('Root', 0)], 'Nope')).toEqual({ removed: [], refund: 0, kept: [] });
  });
});
