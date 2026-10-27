import { createHash, createPrivateKey, sign } from 'crypto';

// DER prefix for an Ed25519 PKCS#8 private key; the 32-byte seed is appended.
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

function privateKeyFromBase64(raw: string) {
  const bytes = Buffer.from(raw.trim(), 'base64');
  // ONDC tooling exports either the 32-byte seed or seed+public (64 bytes).
  if (bytes.length !== 32 && bytes.length !== 64) {
    throw new Error('BECKN_SIGNING_PRIVATE_KEY must be a base64 Ed25519 seed (32 or 64 bytes).');
  }
  return createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, bytes.subarray(0, 32)]),
    format: 'der',
    type: 'pkcs8',
  });
}

/** Builds the Beckn `Authorization` header (BLAKE-512 digest, Ed25519 signature). */
export function becknAuthHeader(args: {
  body: string;
  subscriberId: string;
  uniqueKeyId: string;
  privateKeyBase64: string;
  now?: number;
  ttlSeconds?: number;
}): string {
  const created = Math.floor((args.now ?? Date.now()) / 1000);
  const expires = created + (args.ttlSeconds ?? 300);
  const digest = createHash('blake2b512').update(args.body).digest('base64');
  const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digest}`;
  const signature = sign(null, Buffer.from(signingString), privateKeyFromBase64(args.privateKeyBase64)).toString(
    'base64'
  );
  return (
    `Signature keyId="${args.subscriberId}|${args.uniqueKeyId}|ed25519",algorithm="ed25519",` +
    `created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`
  );
}
