// Verifier SSO Bawwabah -> e-markaz (pola yang sama dengan SSO Bawwabah ->
// PPDB: token sekali pakai HMAC-SHA256, berlaku 120 detik, anti-replay).
// Alur: Bawwabah /api/sso/e-markaz mengalihkan ke sini dengan ?token=...
// Setelah verifikasi, dibuat sesi NextAuth (strategi JWT, seperti login
// biasa) lewat encode() dari next-auth/jwt, lalu halaman sukses
// mengarahkan relatif ke /admin.
//
// Pemetaan akun: lewat USERNAME (opsi 1). e-markaz tidak punya kolom
// tautan Siakad; irisan username e-markaz∩Siakad HANYA 'admin' (temuan
// 25 Okt: 19 pengajar e-markaz bukan pengguna Siakad — mereka staf kursus
// yang berbeda orang, dan santri e-markaz bukan pengguna Bawwabah).
// Karena itu SSO ini praktis hanya untuk owner; tile e-markaz di Bawwabah
// hanya diberikan ke super admin. Username yang tidak ditemukan di
// e-markaz ditolak dengan pesan jelas, tanpa sesi.
//
// Anti-replay: jti dikonsumsi atomik di tabel SsoConsumedToken (dibuat
// via psql; modelnya ada di schema.prisma sebagai dokumentasi).
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 hari, sama dengan authOptions

function errorPage(judul: string, pesan: string, status = 401) {
  return new NextResponse(
    `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>E-Markaz</title></head><body style="font-family:system-ui,sans-serif;background:#F3F4F6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:24px;max-width:420px"><h2 style="color:#B91C1C;margin:0 0 8px">${judul}</h2><p style="color:#374151;font-size:14px;line-height:1.6;margin:0">${pesan}</p><p style="margin:16px 0 0"><a href="/login">Kembali ke login E-Markaz</a></p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function successPage(cookie: string) {
  const res = new NextResponse(
    `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/admin"><title>E-Markaz</title></head><body style="font-family:system-ui,sans-serif;background:#F3F4F6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:24px;max-width:420px"><h2 style="color:#1D4ED8;margin:0 0 8px">Login berhasil</h2><p style="color:#374151;font-size:14px;line-height:1.6;margin:0">Anda masuk lewat Bawwabah. Mengalihkan ke E-Markaz…</p><p style="margin:16px 0 0"><a href="/admin">Lanjut ke E-Markaz</a></p></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
  res.headers.append("Set-Cookie", cookie);
  return res;
}

export async function GET(req: Request) {
  const secret = process.env.BAWWABAH_EMARKAZ_SSO_SECRET;
  if (!secret)
    return errorPage(
      "SSO belum dikonfigurasi",
      "Secret SSO belum dipasang di server E-Markaz. Hubungi admin.",
      500
    );

  const token = new URL(req.url).searchParams.get("token");
  if (!token) return errorPage("Token tidak ada", "Tautan SSO tidak membawa token.");

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig)
    return errorPage("Token SSO tidak valid", "Format token tidak dikenali.");

  // Verifikasi HMAC (timing-safe; panjang berbeda = tidak valid).
  const expected = createHmac("sha256", secret).update(payloadB64).digest("hex");
  let valid = false;
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(sig, "utf8");
    valid = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    valid = false;
  }
  if (!valid)
    return errorPage("Token SSO tidak valid", "Tanda tangan token tidak cocok.");

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return errorPage("Token SSO tidak valid", "Payload token tidak bisa dibaca.");
  }

  if (payload.aud !== "emarkaz")
    return errorPage("Token SSO tidak valid", "Token ini bukan untuk E-Markaz.");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now())
    return errorPage("Token kedaluwarsa", "Token SSO hanya berlaku 120 detik. Silakan klik tile lagi dari Bawwabah.");
  if (typeof payload.jti !== "string" || !payload.jti)
    return errorPage("Token SSO tidak valid", "Token tidak memiliki id pemakaian.");
  if (typeof payload.username !== "string" || !payload.username)
    return errorPage(
      "Akun belum tertaut",
      "Token tidak membawa username. Hubungi super admin."
    );

  // Konsumsi jti atomik: INSERT gagal bila jti sudah ada (unique) = replay.
  try {
    await prisma.$executeRaw`INSERT INTO "SsoConsumedToken" ("jti", "consumedAt") VALUES (${payload.jti}, NOW())`;
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("duplicate key") || msg.includes("23505"))
      return errorPage("Token sudah dipakai", "Token SSO hanya bisa dipakai sekali. Silakan klik tile lagi dari Bawwabah.");
    console.error("Gagal konsumsi jti SSO:", e);
    return errorPage("Terjadi kesalahan sistem", "Gagal memverifikasi token. Coba lagi.", 500);
  }

  // Pemetaan username -> user e-markaz (beserta role + permissions, sama
  // seperti authorize() di lib/auth.ts).
  const user = await prisma.user.findUnique({
    where: { username: payload.username },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });
  if (!user)
    return errorPage(
      "Akun E-Markaz belum tertaut",
      `Username "${payload.username}" tidak ditemukan di E-Markaz. Minta super admin membuatkan akun E-Markaz dengan username yang sama.`
    );

  const permissions = user.role.permissions.map((rp: any) => ({
    module: rp.permission.module,
    action: rp.permission.action,
  }));

  // Buat sesi NextAuth (JWT) yang bentuknya sama dengan hasil login biasa.
  const nextauthSecret = process.env.NEXTAUTH_SECRET;
  if (!nextauthSecret)
    return errorPage("SSO belum dikonfigurasi", "NEXTAUTH_SECRET belum dipasang. Hubungi admin.", 500);

  const sessionToken = await encode({
    secret: nextauthSecret,
    token: {
      id: user.id,
      sub: user.id,
      name: user.username,
      role: user.role.name,
      permissions,
    },
    maxAge: COOKIE_MAX_AGE,
  });

  const useSecure = (process.env.NEXTAUTH_URL || "").startsWith("https://");
  const cookieName = useSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
  const cookie =
    `${cookieName}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; ` +
    `Max-Age=${COOKIE_MAX_AGE}` +
    (useSecure ? "; Secure" : "");

  return successPage(cookie);
}
