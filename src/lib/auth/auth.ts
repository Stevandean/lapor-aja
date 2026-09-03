import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/src/lib/prisma";
import { ROUTES } from "@/src/lib/constants/routes";
import type { UserRole } from "@/src/types/profile";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: ROUTES.LOGIN,
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim();
        const password = String(credentials?.password || "");

        if (!email || !password) {
          return null;
        }

        const profile = await prisma.profile.findUnique({
          where: { email },
        });

        if (!profile) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          profile.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        if (!profile.isActive) {
          return null;
        }

        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          dusunId: profile.dusunId,
          sectionId: profile.sectionId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.dusunId = user.dusunId;
        token.sectionId = user.sectionId;
      }

      return token;
    },
    session({ session, token }) {
      const claims = token as unknown as {
        id: string;
        role: UserRole;
        dusunId: string | null;
        sectionId: string | null;
      };

      if (session.user) {
        session.user.id = claims.id;
        session.user.role = claims.role;
        session.user.dusunId = claims.dusunId;
        session.user.sectionId = claims.sectionId;
      }

      return session;
    },
  },
});
