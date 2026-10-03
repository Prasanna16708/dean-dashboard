import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Custom logic if needed (e.g., logging unauthorized access attempts)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Only allow access if a token exists
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect all routes inside the dashboard, plus all API routes except auth
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/staff/:path*",
    "/notes/:path*",
    "/timetable/:path*",
    "/attendance/:path*",
    "/disciplinary/:path*",
    "/api/((?!auth).*)" 
  ],
};