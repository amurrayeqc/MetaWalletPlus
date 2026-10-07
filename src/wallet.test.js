import { describe, it } from 'node:test'; import assert from 'node:assert/strict';
import { addWatchedToken, networkInfo, validateTransfer } from './wallet.js';
const a = '0x000000000000000000000000000000000000dEaD';
describe('wallet model', () => {
  it('validates and converts native transfers', () => { const tx = validateTransfer({ to: a, amount: '1.25' }); assert.equal(tx.value, 1250000000000000000n); });
  it('rejects unsafe transfer input', () => { assert.throws(() => validateTransfer({ to: 'bad', amount: '1' }), /valid EVM/); assert.throws(() => validateTransfer({ to: a, amount: '0' }), /greater than zero/); assert.throws(() => validateTransfer({ to: a, amount: 'abc' }), /valid native/); });
  it('deduplicates watched tokens by chain and normalized address', () => { const first = addWatchedToken([], a, 1); assert.equal(addWatchedToken(first, a.toLowerCase(), 1).length, 1); assert.equal(addWatchedToken(first, a, 137).length, 2); });
  it('describes known and unknown networks', () => { assert.equal(networkInfo(1).symbol, 'ETH'); assert.equal(networkInfo(999).name, 'Chain 999'); });
});
