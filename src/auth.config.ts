import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db/client";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        console.log("SignIn callback - Provider:", account?.provider);
        console.log("SignIn callback - User email:", user.email);

        // For OAuth providers (Google), create user if doesn't exist
        if (account?.provider === "google") {
          if (!user.email) {
            console.error("No email provided by Google");
            return false;
          }

          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            console.log("Creating new user for:", user.email);
            await db.user.create({
              data: {
                email: user.email,
                name: user.name || "",
                role: "USER",
                // No passwordHash for OAuth users
              },
            });
            console.log("User created successfully");
          } else {
            console.log("User already exists:", user.email);
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      try {
        // On initial sign in (when user object is present)
        if (user) {
          console.log("JWT callback - User:", user.email);
          console.log("JWT callback - Provider:", account?.provider);

          // For credentials, user object already has id and role
          if (account?.provider === "credentials") {
            token.id = user.id;
            token.role = user.role;
          }
          // For OAuth (Google), fetch user from database
          else if (user.email) {
            const dbUser = await db.user.findUnique({
              where: { email: user.email },
            });
            if (dbUser) {
              console.log("Found user in DB:", dbUser.id);
              token.id = dbUser.id;
              token.role = dbUser.role;
            } else {
              console.error("User not found in database:", user.email);
            }
          }
        }
        return token;
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
