import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths - tidak perlu proteksi
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/santri/login" ||
    pathname === "/pendaftaran" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/pendaftaran") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Proteksi /admin/* - hanya untuk non-Santri (admin/staff)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const role = (token as any).role;
    if (role === "Santri") {
      // Santri tidak boleh akses admin, arahkan ke portal
      return NextResponse.redirect(new URL("/portal", req.url));
    }
    return NextResponse.next();
  }

  // Proteksi /portal/* - hanya untuk Santri
  if (pathname.startsWith("/portal")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const role = (token as any).role;
    if (role !== "Santri") {
      // Admin/staff tidak perlu ke portal, arahkan ke admin
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
