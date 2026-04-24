// /pricing — alias to home page's #pricing anchor
import { redirect } from 'next/navigation'

export default function PricingPage() {
  redirect('/#pricing')
}
