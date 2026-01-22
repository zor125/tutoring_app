// 1) 여기에 너의 Supabase 값 넣기
const SUPABASE_URL = "https://eduxobdkppnpeuoimnor.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdXhvYmRrcHBucGV1b2ltbm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTk5MTEsImV4cCI6MjA4NDUzNTkxMX0.zt00SOZO9sLfjsRxnb62-nbzkOGUmjf_ElbPK2uwUvo";

// 2) 사용자 식별용 anon_id 만들기 (로그인 없이도 같은 사람 추적)
function getAnonId() {
  const key = "anon_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// 3) 이벤트 전송 함수
export async function track(event_name, props = {}) {
  try {
    const anon_id = getAnonId();

    const payload = {
      anon_id,
      event_name,
      props,
      page_url: location.href,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("track failed:", res.status, text);
    }
  } catch (e) {
    console.error("track error:", e);
  }
}
