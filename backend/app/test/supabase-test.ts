import { supabase } from "../config/supabase.ts";

async function testSupabase() {
  const { data, error } = await supabase
    .from("test")
    .select("*");

  console.log("SUPABASE RESPONSE:");
  console.log(data);
  console.log(error);
}

testSupabase();