window.RemoteApi = (() => {
  const cfg = window.DELIVERY_DEMO_CONFIG || {};
  const enabled = () => Boolean(cfg.USE_GOOGLE_SHEETS && cfg.GOOGLE_APPS_SCRIPT_URL);
  async function get(params={}){
    if(!enabled()) return null;
    const url = new URL(cfg.GOOGLE_APPS_SCRIPT_URL);
    Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    const r=await fetch(url.toString()); if(!r.ok) throw new Error('Google Sheet GET failed'); return r.json();
  }
  async function post(payload={}){
    if(!enabled()) return null;
    const body = new URLSearchParams({payload: JSON.stringify(payload)});
    const r=await fetch(cfg.GOOGLE_APPS_SCRIPT_URL,{method:'POST',body});
    if(!r.ok) throw new Error('Google Sheet POST failed'); return r.json();
  }
  return {enabled,get,post};
})();
