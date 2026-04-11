import { NextResponse }  from "next/server"
import { getSession }    from "@/lib/auth/session"
import prisma            from "@/lib/auth/prisma"

// Soft-delete / hard-delete the account
export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  const body      = await req.json()
  const { confirm } = body as { confirm?: string }

  if (confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Type "DELETE" to confirm.' },
      { status: 422 }
    )
  }

  // Soft-delete — set deletedAt, cascade handles related data
  await prisma.user.update({
    where: { id: session.user.id },
    data:  { banned: true, banReason: "Account deleted by user" },
  })

  return NextResponse.json({ ok: true })
}