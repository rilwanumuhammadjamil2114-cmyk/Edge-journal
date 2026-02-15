const SUPABASE_URL = "https://jmdpzxynlqwsdimejlvs.supabase.co";
const SUPABASE_KEY = "sb_publishable_-hUbh3-m3z4aH459bNcdWA_WfTRSRRB";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function signUp(email, password) {
  await supabase.auth.signUp({ email, password });
}

async function login(email, password) {
  await supabase.auth.signInWithPassword({ email, password });
}

async function addTrade(trade) {
  const user = (await supabase.auth.getUser()).data.user;

  await supabase.from("trades").insert([
    { ...trade, user_id: user.id }
  ]);
}

async function getTrades() {
  const user = (await supabase.auth.getUser()).data.user;

  const { data } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id);

  return data;
}