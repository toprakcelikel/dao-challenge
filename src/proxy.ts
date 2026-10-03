import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "dao_session";

async function getRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await getRole(req);

  const isAdminArea = pathname.startsWith("/admin");
  const isStudentArea =
    pathname.startsWith("/dashboard") || pathname.startsWith("/challenge");

  if (isAdminArea) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL(role ? "/dashboard" : "/login", req.url));
    }
  }
  if (isStudentArea) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/challenge/:path*"],
};
