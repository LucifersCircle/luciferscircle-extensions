// vrf.ts — Paperback-safe reimplementation of MangaFire's window._vrf

export enum VrfEncoding {
  Url = "url",
  Base64 = "base64",
}

/* -------------------------- Pure helpers (no globals) -------------------------- */

// Manual Base64 decoder
function decodeBase64(b64: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < b64.length; i++) {
    const c = b64[i];
    if (c === "=") break;
    const val = chars.indexOf(c);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

// Manual Base64 encoder (correctly handles tail bytes; no NaN→0 masking)
function encodeBase64(bin: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  let i = 0;

  while (i < bin.length) {
    const r1 = bin.charCodeAt(i++);              // may be NaN if past end
    const r2 = bin.charCodeAt(i++);              // may be NaN
    const r3 = bin.charCodeAt(i++);              // may be NaN

    const c1 = (r1 & 0xff);
    const has2 = !Number.isNaN(r2);
    const has3 = !Number.isNaN(r3);
    const c2 = has2 ? (r2 & 0xff) : 0;
    const c3 = has3 ? (r3 & 0xff) : 0;

    const e1 = c1 >> 2;
    const e2 = ((c1 & 0x03) << 4) | (c2 >> 4);
    const e3 = ((c2 & 0x0f) << 2) | (c3 >> 6);
    const e4 = c3 & 0x3f;

    if (!has2) {
      out += chars[e1] + chars[e2] + "==";
    } else if (!has3) {
      out += chars[e1] + chars[e2] + chars[e3] + "=";
    } else {
      out += chars[e1] + chars[e2] + chars[e3] + chars[e4];
    }
  }
  return out;
}

const atobSafe = decodeBase64;

const toBytes = (str: string): number[] => Array.from(str, c => c.charCodeAt(0) & 0xff);
const fromBytes = (bytes: number[]): string => bytes.map(b => String.fromCharCode(b & 0xff)).join("");

/* ----------------------------------- RC4 ----------------------------------- */
function rc4Bytes(key: string, input: number[]): number[] {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
  }

  const out: number[] = [];
  let i = 0;
  j = 0;
  for (const val of input) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    [s[i], s[j]] = [s[j], s[i]];
    const k = s[(s[i] + s[j]) & 0xff];
    out.push((val ^ k) & 0xff);
  }
  return out;
}

/* ------------------------------- Transform ops ------------------------------ */
type Op = (c: number) => number;
const add8  = (n: number): Op => (c) => (c + n) & 0xff;
const sub8  = (n: number): Op => (c) => (c - n + 256) & 0xff;
const xor8  = (n: number): Op => (c) => (c ^ n) & 0xff;
const rotl8 = (n: number): Op => (c) => ((c << n) | (c >>> (8 - n))) & 0xff;

function transform(
  input: number[],
  initSeedBytes: number[],
  prefixKeyString: string,
  prefixLen: number,
  schedule: Op[],
): number[] {
  const out: number[] = [];
  for (let i = 0; i < input.length; i++) {
    if (i < prefixLen) out.push(prefixKeyString.charCodeAt(i) & 0xff);
    out.push(schedule[i % 10]((input[i] ^ initSeedBytes[i % 32]) & 0xff) & 0xff);
  }
  return out;
}

/* -------------------------------- Constants -------------------------------- */
const CONST = {
  rc4Keys: {
    l: "u8cBwTi1CM4XE3BkwG5Ble3AxWgnhKiXD9Cr279yNW0=",
    g: "t00NOJ/Fl3wZtez1xU6/YvcWDoXzjrDHJLL2r/IWgcY=",
    B: "S7I+968ZY4Fo3sLVNH/ExCNq7gjuOHjSRgSqh6SsPJc=",
    m: "7D4Q8i8dApRj6UWxXbIBEa1UqvjI+8W0UvPH9talJK8=",
    F: "0JsmfWZA1kwZeWLk5gfV5g41lwLL72wHbam5ZPfnOVE=",
  },
  seeds32: {
    A: "pGjzSCtS4izckNAOhrY5unJnO2E1VbrU+tXRYG24vTo=",
    V: "dFcKX9Qpu7mt/AD6mb1QF4w+KqHTKmdiqp7penubAKI=",
    N: "owp1QIY/kBiRWrRn9TLN2CdZsLeejzHhfJwdiQMjg3w=",
    P: "H1XbRvXOvZAhyyPaO68vgIUgdAHn68Y6mrwkpIpEue8=",
    k: "2Nmobf/mpQ7+Dxq1/olPSDj3xV8PZkPbKaucJvVckL0=",
  },
  prefixKeys: {
    O: "Rowe+rg/0g==",
    v: "8cULcnOMJVY8AA==",
    L: "n2+Og2Gth8Hh",
    p: "aRpvzH+yoA==",
    W: "ZB4oBi0=",
  },
};

/* -------------------------------- Schedules -------------------------------- */
const scheduleC: Op[] = [sub8(48), sub8(19), xor8(241), sub8(19), add8(223), sub8(19), sub8(170), sub8(19), sub8(48), xor8(8)];
const scheduleY: Op[] = [rotl8(4), add8(223), rotl8(4), xor8(163), sub8(48), add8(82), add8(223), sub8(48), xor8(83), rotl8(4)];
const scheduleB: Op[] = [sub8(19), add8(82), sub8(48), sub8(170), rotl8(4), sub8(48), sub8(170), xor8(8), add8(82), xor8(163)];
const scheduleJ: Op[] = [add8(223), rotl8(4), add8(223), xor8(83), sub8(19), add8(223), sub8(170), add8(223), sub8(170), xor8(83)];
const scheduleE: Op[] = [add8(82), xor8(83), xor8(163), add8(82), sub8(170), xor8(8), xor8(241), add8(82), add8(176), rotl8(4)];

/* ----------------------------------- Main ---------------------------------- */
export function crcVrf(input: string, encoding: VrfEncoding = VrfEncoding.Url): string {
  let bytes = toBytes(encodeURIComponent(input));

  bytes = rc4Bytes(atobSafe(CONST.rc4Keys.l), bytes);
  bytes = transform(bytes, toBytes(atobSafe(CONST.seeds32.A)), atobSafe(CONST.prefixKeys.O), 7, scheduleC);

  bytes = rc4Bytes(atobSafe(CONST.rc4Keys.g), bytes);
  bytes = transform(bytes, toBytes(atobSafe(CONST.seeds32.V)), atobSafe(CONST.prefixKeys.v), 10, scheduleY);

  bytes = rc4Bytes(atobSafe(CONST.rc4Keys.B), bytes);
  bytes = transform(bytes, toBytes(atobSafe(CONST.seeds32.N)), atobSafe(CONST.prefixKeys.L), 9, scheduleB);

  bytes = rc4Bytes(atobSafe(CONST.rc4Keys.m), bytes);
  bytes = transform(bytes, toBytes(atobSafe(CONST.seeds32.P)), atobSafe(CONST.prefixKeys.p), 7, scheduleJ);

  bytes = rc4Bytes(atobSafe(CONST.rc4Keys.F), bytes);
  bytes = transform(bytes, toBytes(atobSafe(CONST.seeds32.k)), atobSafe(CONST.prefixKeys.W), 5, scheduleE);

  let b64 = encodeBase64(fromBytes(bytes));
  if (encoding === VrfEncoding.Url) {
    b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return b64;
}