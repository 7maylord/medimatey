// Expo Push — no SDK, just fetch (built into Node 22). Delivers to the caregiver's
// device via Expo's service, which fans out to APNs/FCM. Tokens look like
// "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]".

export async function sendExpoPush(tokens: string[], title: string, body: string): Promise<void> {
  const messages = tokens
    .filter((t) => t.startsWith("ExponentPushToken") || t.startsWith("ExpoPushToken"))
    .map((to) => ({ to, title, body, sound: "default", priority: "high" }));
  if (messages.length === 0) return;

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!res.ok) console.error(`push: Expo responded ${res.status}`);
  } catch (e) {
    console.error("push: send failed", e);
  }
}
