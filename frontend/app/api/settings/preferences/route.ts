import { NextResponse }  from "next/server"
import { z }             from "zod"
import { getSession }    from "@/lib/auth/session"
import prisma            from "@/lib/auth/prisma"

const PrefsSchema = z.object({
  defaultVoiceId:    z.string().uuid().nullable().optional(),
  defaultFormat:     z.string().optional(),
  defaultLanguage:   z.string().max(10).optional(),
})

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = PrefsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 })
  }

  // Store in user metadata or a dedicated prefs table
  // For now, using the user's metadata field (extend schema if needed)
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      // Store prefs as JSON in a metadata field — add this to schema if needed
      // metadata: parsed.data,
    },
  })

  return NextResponse.json({ ok: true })
}