import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ================= Root redirect ================= */
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", req.url));
  }

  /* ================= Portal redirect ================= */
  // Fix route ambiguity: /portal/* → /en/portal/*
  if (pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL(`/en${pathname}`, req.url));
  }

  /* ================= Language headers ================= */
  const lang = pathname.startsWith("/ar") ? "ar" : "en";

  const res = NextResponse.next();
  res.headers.set("x-lang", lang);
  res.headers.set("x-dir", lang === "ar" ? "rtl" : "ltr");

  return res;
}

