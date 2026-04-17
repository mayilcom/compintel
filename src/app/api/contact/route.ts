import { NextRequest, NextResponse } from 'next/server'

interface ContactFormBody {
  name:    string
  email:   string
  company: string
  role?:   string
  message?: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const portalId  = process.env.HUBSPOT_PORTAL_ID
  const formGuid  = process.env.HUBSPOT_FORM_GUID

  if (!portalId || !formGuid) {
    return NextResponse.json({ error: 'Contact form not configured' }, { status: 503 })
  }

  let body: ContactFormBody
  try {
    body = await req.json() as ContactFormBody
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, email, company, role, message } = body

  if (!name?.trim() || !email?.trim() || !company?.trim()) {
    return NextResponse.json({ error: 'Name, email, and company are required' }, { status: 400 })
  }

  // Split name into first/last for HubSpot contact fields
  const [firstname, ...rest] = name.trim().split(' ')
  const lastname = rest.join(' ') || '-'

  const fields = [
    { objectTypeId: '0-1', name: 'firstname', value: firstname },
    { objectTypeId: '0-1', name: 'lastname',  value: lastname  },
    { objectTypeId: '0-1', name: 'email',     value: email.trim() },
    { objectTypeId: '0-1', name: 'company',   value: company.trim() },
    ...(role    ? [{ objectTypeId: '0-1', name: 'jobtitle', value: role.trim()    }] : []),
    ...(message ? [{ objectTypeId: '0-1', name: 'message',  value: message.trim() }] : []),
  ]

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        context: {
          pageUri:  'https://emayil.com/contact',
          pageName: 'Contact — Request a demo',
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    console.error('[contact] HubSpot submission failed:', res.status, text)
    return NextResponse.json({ error: 'Submission failed, please try again' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
