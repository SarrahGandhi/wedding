import "@supabase/functions-js/edge-runtime.d.ts";
import { sendEmail } from "../_shared/email.ts";

console.log("Hello from Email Functions!");

Deno.serve(async (req) => {
  const { to, subject, html } = await req.json();

  try {
    const data = await sendEmail({ to, subject, html });
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
