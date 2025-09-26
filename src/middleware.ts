import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // This function is called if the user is authenticated
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return token !== null;
        }

        // Allow all other routes
        return true;
      },
    },
    pages: {
      signIn: "/sign-in",
    },
  }
);

export const config = {
  matcher: [
    // Protect all dashboard routes
    "/dashboard/:path*",
    // Exclude static files and public routes
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)",
  ],
};