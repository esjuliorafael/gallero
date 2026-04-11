export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME } = process.env;

  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
    throw new Error('Missing Evolution API environment variables');
  }

  const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;
  const number = `52${phone}@s.whatsapp.net`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      number,
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Evolution API error: ${response.status}`);
  }
}
