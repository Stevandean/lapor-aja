import { auth } from "@/src/lib/auth/auth";

export async function getUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
  };
}
