'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Contact {
  id: string
  name: string | null
  phone: string
  email: string | null
  status: string
  created_at: string
}

export default function ContactsPage() {
  const { activeOrganization } = useOrganization()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit Modal State
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [updating, setUpdating] = useState(false)

  // VCF Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  useEffect(() => {
    if (activeOrganization) {
      loadContacts()
    }
  }, [activeOrganization])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', activeOrganization!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (err) {
      console.error('Error loading contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrganization || !newPhone) return

    setCreating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: activeOrganization.id,
          name: newName,
          phone: newPhone,
          email: newEmail,
          status: 'ACTIVE'
        })
        .select()
        .single()

      if (error) throw error

      setContacts([data, ...contacts])
      setIsModalOpen(false)
      setNewName('')
      setNewPhone('')
      setNewEmail('')
    } catch (err) {
      console.error('Error creating contact:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContact) return

    setUpdating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .update({
          name: editName,
          phone: editPhone,
          email: editEmail,
        })
        .eq('id', editingContact.id)
        .select()
        .single()

      if (error) throw error

      // Also update conversations that belong to this phone number
      await supabase
        .from('conversations')
        .update({ contact_name: editName })
        .eq('organization_id', activeOrganization?.id)
        .eq('contact_phone', editingContact.phone)

      setContacts(contacts.map(c => c.id === editingContact.id ? data : c))
      setEditingContact(null)
    } catch (err) {
      console.error('Error updating contact:', err)
    } finally {
      setUpdating(false)
    }
  }

  const parseVCF = (vcfData: string) => {
    const contactsToInsert: { name: string; phone: string; email: string }[] = []
    const lines = vcfData.split(/\r?\n/)
    
    let currentContact: any = null

    for (const line of lines) {
      if (line.startsWith('BEGIN:VCARD')) {
        currentContact = { name: '', phone: '', email: '' }
      } else if (line.startsWith('END:VCARD')) {
        if (currentContact && currentContact.phone) {
          // Only add if we have at least a phone number
          contactsToInsert.push(currentContact)
        }
        currentContact = null
      } else if (currentContact) {
        if (line.startsWith('FN:')) {
          currentContact.name = line.substring(3).trim()
        } else if (line.startsWith('TEL') || line.includes('TEL;')) {
          // Extract phone number - can be complex format like TEL;TYPE=CELL:+123456
          const parts = line.split(':')
          if (parts.length > 1) {
            // Basic cleanup to remove non-numeric characters (except leading +)
            const rawPhone = parts[1].trim()
            const cleanedPhone = rawPhone.replace(/[^\d+]/g, '')
            currentContact.phone = cleanedPhone
          }
        } else if (line.startsWith('EMAIL') || line.includes('EMAIL;')) {
          const parts = line.split(':')
          if (parts.length > 1) {
            currentContact.email = parts[1].trim()
          }
        }
      }
    }
    return contactsToInsert
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeOrganization) return

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const text = await file.text()
      const parsedContacts = parseVCF(text)

      if (parsedContacts.length === 0) {
        setUploadError('Aucun contact valide trouvé dans le fichier.')
        setUploading(false)
        return
      }

      // Deduplicate and format for insertion
      const uniquePhones = new Set()
      const toInsert = parsedContacts.filter(c => {
        if (uniquePhones.has(c.phone)) return false
        uniquePhones.add(c.phone)
        return true
      }).map(c => ({
        organization_id: activeOrganization.id,
        name: c.name || null,
        phone: c.phone,
        email: c.email || null,
        status: 'ACTIVE'
      }))

      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .insert(toInsert)
        .select()

      if (error) {
        // If there's a unique constraint violation or something
        console.error(error)
        setUploadError('Erreur lors de l\'import. Certains contacts existent peut-être déjà.')
      } else {
        setUploadSuccess(`${data.length} contacts importés avec succès !`)
        setContacts(prev => [...data, ...prev])
      }
    } catch (err) {
      console.error(err)
      setUploadError('Impossible de lire le fichier VCF.')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const filteredContacts = contacts.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">Gérez votre base de données clients et prospects.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".vcf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm border border-border hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importer VCF
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau Contact
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-5 h-5" />
          {uploadError}
        </div>
      )}
      
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 text-green-600 text-sm">
          <CheckCircle2 className="w-5 h-5" />
          {uploadSuccess}
        </div>
      )}

      <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou numéro..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Aucun contact trouvé</h3>
              <p className="text-muted-foreground max-w-sm">Vous n'avez pas encore de contacts, ou aucun ne correspond à votre recherche.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Coordonnées</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium">Date d'ajout</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-secondary/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                        </div>
                        <span className="font-semibold text-foreground">{contact.name || 'Inconnu'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        {contact.phone}
                      </div>
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          {contact.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {contact.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(contact.created_at), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setEditingContact(contact)
                          setEditName(contact.name || '')
                          setEditPhone(contact.phone)
                          setEditEmail(contact.email || '')
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-[#fe5105] bg-[#fe5105]/10 rounded-md hover:bg-[#fe5105]/20 transition-colors"
                      >
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Ajouter un contact</h2>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nom complet</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Numéro WhatsApp *</label>
                <input 
                  type="tel" 
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="+2250102030405"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Adresse email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="jean@exemple.com"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT MODAL */}
      {editingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Modifier le contact</h2>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nom complet</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-[#fe5105] focus:border-[#fe5105] text-sm text-foreground"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Numéro WhatsApp *</label>
                <input 
                  type="tel" 
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-[#fe5105] focus:border-[#fe5105] text-sm text-foreground"
                  placeholder="+2250102030405"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Adresse email</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-[#fe5105] focus:border-[#fe5105] text-sm text-foreground"
                  placeholder="jean@exemple.com"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingContact(null)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors border border-border"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#fe5105] hover:bg-[#fe5105]/90 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
