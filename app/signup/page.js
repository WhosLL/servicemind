// /signup — alias to /onboard
import { redirect } from 'next/navigation'

export default function SignupPage() {
  redirect('/onboard')
}
