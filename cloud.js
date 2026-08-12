let client = null;
let currentUser = null;
let saveTimer = null;

function announce(status, message = '') {
  window.dispatchEvent(new CustomEvent('rientro-cloud-status', { detail: { status, message } }));
}

export async function initializeCloud() {
  try {
    const response = await fetch('/api/supabase-config', { cache: 'no-store' });
    if (!response.ok) return { available: false, user: null };
    const config = await response.json();
    if (!config.url || !config.publishableKey) return { available: false, user: null };
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    client = createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentUser = data.session?.user || null;
    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      announce(currentUser ? 'synced' : 'local');
    });
    return { available: true, user: currentUser };
  } catch (error) {
    console.warn('Cloud non disponibile:', error.message);
    return { available: false, user: null };
  }
}

export function cloudUser() { return currentUser; }

export async function signInCloud(email, password) {
  if (!client) return { ok: false, error: 'Il collegamento cloud non è ancora configurato.' };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  currentUser = data.user;
  return { ok: true, user: currentUser };
}

export async function signUpCloud(email, password) {
  if (!client) return { ok: false, error: 'Il collegamento cloud non è ancora configurato.' };
  const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
  if (error) return { ok: false, error: error.message };
  currentUser = data.user && data.session ? data.user : null;
  return { ok: true, user: currentUser, needsConfirmation: !data.session };
}

export async function signOutCloud() {
  if (client) await client.auth.signOut({ scope: 'local' });
  currentUser = null;
  announce('local');
}

export async function loadCloudWallet() {
  if (!client || !currentUser) return null;
  const { data, error } = await client.from('wallets').select('data, updated_at').eq('user_id', currentUser.id).maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

export async function saveCloudWallet(wallet) {
  if (!client || !currentUser) return false;
  announce('syncing');
  const { error } = await client.from('wallets').upsert({ user_id: currentUser.id, data: wallet, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) { announce('error', error.message); throw error; }
  announce('synced');
  return true;
}

export function queueCloudWalletSave(wallet) {
  if (!client || !currentUser) return;
  clearTimeout(saveTimer);
  const snapshot = structuredClone(wallet);
  saveTimer = setTimeout(() => saveCloudWallet(snapshot).catch(() => {}), 500);
}
