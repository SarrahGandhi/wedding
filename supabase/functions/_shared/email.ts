// Thin wrapper around the Resend REST API, shared by the edge functions.
// Dependency-free (fetch only) so any function can import it regardless of
// its own import map.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Murtaza & Sarrah Wedding <invitation@murtazasarrah.ca>";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data as { id?: string };
}
