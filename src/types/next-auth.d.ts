import type { UserRole } from "@/src/types/profile";

declare module "next-auth" {
  interface User {
    role: UserRole;
    dusunId: string | null;
    sectionId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      dusunId: string | null;
      sectionId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    dusunId: string | null;
    sectionId: string | null;
  }
}
