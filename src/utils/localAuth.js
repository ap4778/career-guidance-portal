const encoder = new TextEncoder();

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Password hashing is unavailable in this browser. Try a current browser on localhost.");
  }
  const input = new Uint8Array(salt.length + encoder.encode(password).length);
  input.set(salt);
  input.set(encoder.encode(password), salt.length);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return toBase64(new Uint8Array(digest));
}

export async function createPasswordCredentials(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    salt: toBase64(salt),
    passwordHash: await hashPassword(password, salt),
  };
}

export async function verifyPassword(password, account) {
  const candidate = await hashPassword(password, fromBase64(account.salt));
  if (candidate.length !== account.passwordHash.length) return false;
  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ account.passwordHash.charCodeAt(index);
  }
  return difference === 0;
}

export function migrateGuestData(accountId, displayName) {
  const keys = ["profile", "guidance", "saved-jobs", "applications", "roadmap-progress", "resume", "dark-mode"];
  for (const key of keys) {
    const legacyValue = localStorage.getItem(`careerpath-${key}`);
    const scopedKey = `careerpath:${accountId}:${key}`;
    if (legacyValue === null || localStorage.getItem(scopedKey) !== null) continue;
    if (key === "profile") {
      const profile = JSON.parse(legacyValue);
      localStorage.setItem(scopedKey, JSON.stringify({ ...profile, name: displayName }));
    } else {
      localStorage.setItem(scopedKey, legacyValue);
    }
  }
}
