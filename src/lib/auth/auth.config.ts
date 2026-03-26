import type { NextAuthConfig } from "next-auth";

// This is the edge-compatible configuration
export const authConfig = {
  providers: [], // Providers will be added in auth.ts or individually
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
