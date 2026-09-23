import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Commande confirmée !</h1>
        <p className="text-slate-600 mb-8">
          Merci pour votre achat. Vous recevrez très prochainement un message de confirmation sur WhatsApp avec les détails de votre commande.
        </p>
        <Link 
          href={`/shop/${params.slug}`}
          className="inline-flex w-full items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          Retour à la boutique
        </Link>
      </div>
    </div>
  )
}
