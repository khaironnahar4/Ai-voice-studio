'use server'

import { authSession } from "@/lib/auth/auth-utils";
import prisma from "@/lib/auth/prisma";


export async function userProfile() {
    const session = await authSession();

    if(!session) {
        throw new Error("Not authenticated");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            email: true,
            name: true,
            image: true,
            // twoFactorEnabled: true,
        }
    })
    return user;
}