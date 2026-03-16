import { auth } from "@/lib/auth/auth";

export const middleware = auth((req) => {
  // You can add custom middleware logic here
  // For example, protect specific routes based on authentication
  return undefined; // Returns undefined to pass through to the next handler
});

export const config = {
  matcher: [
    // Protect API routes
    "/api/:path*",
    // You can add more protected routes here
  ],
};
