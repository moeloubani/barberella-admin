import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Check against hardcoded admin credentials
        if (credentials?.username === 'admin' && credentials?.password === 'barberella2024') {
          return {
            id: '1',
            name: 'Admin',
            email: 'admin@barberella.com'
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Persist the user ID to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'default-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
};