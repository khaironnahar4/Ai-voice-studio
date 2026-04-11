import { NextResponse }  from "next/server"
import { z }             from "zod"
import { getSession }    from "@/lib/auth/session"
import prisma            from "@/lib/auth/prisma"

const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required.").max(80),
})

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = ProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input." },
      { status: 422 }
    )
  }

  const updated = await prisma.user.update({
    where:  { id: session.user.id },
    data:   { name: parsed.data.name },
    select: { id: true, name: true, email: true, emailVerified: true },
  })

  return NextResponse.json({ user: updated })
}