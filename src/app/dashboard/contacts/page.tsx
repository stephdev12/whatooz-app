'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
  AlertCircle,
  Tag as TagIcon,
  Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TagItem {
  id: string
  name: string
  color: string
}

interface Contact {
  id: string
  name: string | null
  phone: string
  email: string | null
  status: string
  created_at: string
  tags?: TagItem[]
}

export default function ContactsPage() {
  const { activeOrganization } = useOrganization()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [availableTags, setAvailableTags] = useState<TagItem[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newSelectedTags, setNewSelectedTags] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  // Edit Modal State
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([])
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

      // 1. Load organization tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('organization_id', activeOrganization!.id)
        .order('name', { ascending: true })

      if (tagsData) {
        setAvailableTags(tagsData)
      }

      // 2. Load contacts with tags
      const { data, error } = await supabase
        .from('contacts')
        .select('*, contact_tags(tag_id, tags(id, name, color))')
        .eq('organization_id', activeOrganization!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const normalized: Contact[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        status: c.status || 'ACTIVE',
        created_at: c.created_at,
        tags: (c.contact_tags || [])
          .map((ct: any) => ct.tags)
          .filter(Boolean),
      }))

      setContacts(normalized)
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

      let assignedTags: TagItem[] = []
      if (newSelectedTags.length > 0) {
        await supabase
          .from('contact_tags')
          .insert(newSelectedTags.map((tid) => ({ contact_id: data.id, tag_id: tid })))
        assignedTags = availableTags.filter((t) => newSelectedTags.includes(t.id))
      }

      setContacts([{ ...data, tags: assignedTags }, ...contacts])
      setIsModalOpen(false)
      setNewName('')
      setNewPhone('')
      setNewEmail('')
      setNewSelectedTags([])
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

      // Synchronize contact_tags
      await supabase.from('contact_tags').delete().eq('contact_id', editingContact.id)
      if (editSelectedTags.length > 0) {
        await supabase
          .from('contact_tags')
          .insert(editSelectedTags.map((tid) => ({ contact_id: editingContact.id, tag_id: tid })))
      }
      const assignedTags = availableTags.filter((t) => editSelectedTags.includes(t.id))

      // Also update conversations that belong to this phone number
      await supabase
        .from('conversations')
        .update({ contact_name: editName })
        .eq('organization_id', activeOrganization?.id)
        .eq('contact_phone', editingContact.phone)

      setContacts(contacts.map(c => c.id === editingContact.id ? { ...data, tags: assignedTags } : c))
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

  // Calculate count of contacts per tag
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>()
    contacts.forEach((c) => {
      c.tags?.forEach((t) => {
        map.set(t.id, (map.get(t.id) || 0) + 1)
      })
    })
    return map
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const s = searchTerm.trim().toLowerCase()
    return contacts.filter((c) => {
      const matchesSearch =
        !s ||
        (c.name?.toLowerCase() || '').includes(s) ||
        c.phone.includes(s) ||
        (c.email?.toLowerCase() || '').includes(s) ||
        Boolean(c.tags && c.tags.some((t) => t.name.toLowerCase().includes(s)))

      const matchesTag =
        !selectedTagId ||
        Boolean(c.tags && c.tags.some((t) => t.id === selectedTagId))

      return matchesSearch && matchesTag
    })
  }, [contacts, searchTerm, selectedTagId])

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">Contacts</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gérez votre base de données clients et prospects.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
            className="flex items-center gap-2 rounded-xl bg-card px-3.5 py-2 text-xs sm:text-sm font-medium text-foreground shadow-xs border border-border hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>Importer VCF</span>
          </button>

          <button 
            onClick={() => {
              setNewName('')
              setNewPhone('')
              setNewEmail('')
              setNewSelectedTags([])
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Contact</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-xs flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Rechercher par nom, numéro, email ou tag..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-xs sm:text-sm focus:outline-none focus:border-primary transition-shadow"
              />
            </div>
            <div className="text-xs text-muted-foreground self-end sm:self-auto flex items-center gap-2">
              <span>{filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}</span>
              {selectedTagId && (
                <button
                  type="button"
                  onClick={() => setSelectedTagId(null)}
                  className="text-primary hover:underline font-semibold"
                >
                  (Effacer filtre)
                </button>
              )}
            </div>
          </div>

          {/* Tag filters strip */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
              <button
                type="button"
                onClick={() => setSelectedTagId(null)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0',
                  !selectedTagId
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span>Tous les contacts</span>
                <span className="text-[10px] opacity-70">({contacts.length})</span>
              </button>
              {availableTags.map((tag) => {
                const isSelected = selectedTagId === tag.id
                const count = tagCounts.get(tag.id) || 0
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setSelectedTagId(isSelected ? null : tag.id)}
                    style={{
                      backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                      color: isSelected ? '#ffffff' : tag.color,
                      borderColor: `${tag.color}35`,
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border',
                      isSelected && 'shadow-xs font-semibold'
                    )}
                    title={`Filtrer par le tag ${tag.name}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#ffffff' : tag.color }}
                    />
                    <span>{tag.name}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12">
              <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Aucun contact trouvé</h3>
              <p className="text-xs text-muted-foreground max-w-sm">Vous n'avez pas encore de contacts, ou aucun ne correspond à vos filtres.</p>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm text-muted-foreground">
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
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground block truncate">{contact.name || 'Inconnu'}</span>
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contact.tags.map(tag => (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedTagId(selectedTagId === tag.id ? null : tag.id)
                                  }}
                                  style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}35` }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium hover:opacity-80 transition-opacity"
                                  title={`Filtrer par le tag ${tag.name}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                  <span>{tag.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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
                          setEditSelectedTags(contact.tags ? contact.tags.map(t => t.id) : [])
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

              {availableTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tags du contact</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-muted/20">
                    {availableTags.map((tag) => {
                      const isSelected = newSelectedTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setNewSelectedTags(prev => 
                              isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                            )
                          }}
                          style={{
                            backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                            color: isSelected ? '#ffffff' : tag.color,
                            borderColor: `${tag.color}35`,
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                            isSelected && 'font-semibold shadow-xs'
                          )}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: isSelected ? '#ffffff' : tag.color }}
                          />
                          <span>{tag.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              
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

              {availableTags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tags du contact</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-muted/20">
                    {availableTags.map((tag) => {
                      const isSelected = editSelectedTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setEditSelectedTags(prev => 
                              isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                            )
                          }}
                          style={{
                            backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                            color: isSelected ? '#ffffff' : tag.color,
                            borderColor: `${tag.color}35`,
                          }}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                            isSelected && 'font-semibold shadow-xs'
                          )}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: isSelected ? '#ffffff' : tag.color }}
                          />
                          <span>{tag.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              
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
