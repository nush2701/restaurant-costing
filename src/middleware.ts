import { withAuth } from "next-auth/middleware";

// Protect only the dashboard. The `authorized` callback is the source of
// truth for what requires a session — so even if the matcher below ever runs
// on extra routes, only /dashboard is gated and the /login page is never
// redirected (which previously caused an infinite redirect loop).
export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ req, token }) => {
      if (req.nextUrl.pathname.startsWith("/dashboard")) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
