import { redirect } from 'next/navigation'

export function GET() {
  redirect(process.env.NEXT_PUBLIC_REGATTA_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/GJnmwjNCylf6BtRlyTtyaw')
}
