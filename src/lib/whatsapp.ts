const WA_API_URL = process.env.WA_GATEWAY_URL || "";
const WA_API_KEY = process.env.WA_API_KEY || "";
const WA_SESSION_ID = process.env.WA_SESSION_ID || "2";

export function normalizeNoWa(input: string): string {
  let cleaned = input.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Kirim pesan WA via gateway Amtsilati Pusat
 * Format: POST /api/v1/sessions/{sessionId}/send
 * Headers: Authorization Bearer + x-api-key
 * To: 628xxx@s.whatsapp.net
 */
export async function sendWa(to: string, message: string): Promise<{ success: boolean; detail?: string }> {
  try {
    const normalizedTo = normalizeNoWa(to);
    const toJid = `${normalizedTo}@s.whatsapp.net`;
    const res = await fetch(`${WA_API_URL}/sessions/${WA_SESSION_ID}/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_API_KEY}`,
        "x-api-key": WA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: toJid,
        message: message,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true };
    }
    return { success: false, detail: data.message || data.error || `HTTP ${res.status}` };
  } catch (error: any) {
    return { success: false, detail: error.message || "Network error" };
  }
}

export function formatPesanPendaftaran(
  nama: string,
  programNama: string,
  periodeNama: string,
  totalBiaya: number,
  kodeUnik: number,
  username: string
): string {
  const totalFormatted = totalBiaya.toLocaleString("id-ID");
  const lines = [
    "Assalamu'alaikum warahmatullahi wabarakatuh,",
    "",
    "Jazakumullah khairan atas pendaftaran Anda di *E-Markaz*.",
    "",
    "Berikut detail pendaftaran Anda:",
    "",
    "Nama: " + nama,
    "Program: " + programNama,
    "Periode: " + periodeNama,
    "Username: " + username,
    "",
    "*Rincian Biaya:*",
    "Total yang harus dibayarkan: Rp " + totalFormatted,
    "(termasuk kode unik Rp " + kodeUnik + ")",
    "",
    "Silakan transfer ke rekening berikut:",
    "Bank BRI: 0555-0100-1126-567",
    "a.n. Markaz Arabiyah",
    "",
    "Setelah melakukan pembayaran, mohon konfirmasi ke admin: https://wa.me/628980837788",
    "",
    "Simpan username dan password Anda baik-baik untuk login di portal santri.",
    "",
    "Wassalamu'alaikum warahmatullahi wabarakatuh.",
    "Admin E-Markaz"
  ];
  return lines.join("\n");
}
