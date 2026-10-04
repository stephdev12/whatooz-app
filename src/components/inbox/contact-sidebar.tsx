'use client'

import { useState, useEffect, useCallback } from 'react'
import { Phone, Check, Copy, Mail, Tag, StickyNote, Plus, User as UserIcon } from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import type { Contact, Tag as TagType } from '@/app/dashboard/inbox/page'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  note_text: string
  created_at: string
}

interface ContactSidebarProps {
  contact: Contact
}

export function ContactSidebar({ contact }: ContactSidebarProps) {
  const { activeOrganization } = useOrganization()
  const [copied, setCopied] = useState(false)
  
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  
  // Tags state
  const [orgTags, setOrgTags] = useState<TagType[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#4F46E5')
  const [creatingTag, setCreatingTag] = useState(false)

  const supabase = createClient()

  const loadData = useCallback(async () => {
    if (!activeOrganization || !contact) return
    
    // Load notes
    const { data: notesData } = await supabase
      .from('contact_notes')
      .select('id, note_text, created_at')
      .eq('contact_id', contact.id)
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false })
      
    if (notesData) setNotes(notesData)

    // Load available organization tags
    const { data: tagsData } = await supabase
      .from('tags')
      .select('id, name, color')
      .eq('organization_id', activeOrganization.id)
      .order('name', { ascending: true })
      
    if (tagsData) setOrgTags(tagsData)
    
    setLoadingTags(false)
  }, [activeOrganization, contact, supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleCopyPhone() {
    if (!contact?.phone) return
    navigator.clipboard.writeText(contact.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAddNote() {
    if (!activeOrganization || !contact || !newNote.trim()) return
    setAddingNote(true)

    const { data, error } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: contact.id,
        organization_id: activeOrganization.id,
        note_text: newNote.trim(),
      })
      .select('id, note_text, created_at')
      .single()

    if (!error && data) {
      setNotes((prev) => [data, ...prev])
      setNewNote('')
    }
    setAddingNote(false)
  }
  
  async function handleToggleTag(tagId: string) {
    if (!activeOrganization || !contact) return
    
    const hasTag = contact.tags?.some(t => t.id === tagId)
    
    if (hasTag) {
      // Remove tag
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact.id)
        .eq('tag_id', tagId)
        
      if (!error && contact.tags) {
        contact.tags = contact.tags.filter(t => t.id !== tagId)
      }
    } else {
      // Add tag
      const { error } = await supabase
        .from('contact_tags')
        .insert({
          contact_id: contact.id,
          tag_id: tagId
        })
        
      if (!error) {
        const addedTag = orgTags.find(t => t.id === tagId)
        if (addedTag) {
          contact.tags = [...(contact.tags || []), addedTag]
        }
      }
    }
    // simple way to trigger re-render if needed
    window.dispatchEvent(new Event('contact-tags-updated')) 
  }

  async function handleCreateTag() {
    if (!activeOrganization || !newTagName.trim()) return
    setCreatingTag(true)

    const { data, error } = await supabase
      .from('tags')
      .insert({
        organization_id: activeOrganization.id,
        name: newTagName.trim(),
        color: newTagColor,
      })
      .select('id, name, color')
      .single()

    if (!error && data) {
      setOrgTags((prev) => [...prev, data])
      setNewTagName('')
      setShowNewTagInput(false)
      // Automatically assign it to the current contact
      handleToggleTag(data.id)
    }
    setCreatingTag(false)
  }

  if (!contact) return null

  const displayName = contact.name || contact.phone
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-4 custom-scrollbar">
      {/* Contact Info */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fe5105]/10 text-[#fe5105] text-xl font-semibold">
          {initials}
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">
          {displayName}
        </h3>
      </div>

      {/* Phone */}
      <div className="mt-6 space-y-2">
        <button
          onClick={handleCopyPhone}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50"
        >
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-left truncate">{contact.phone}</span>
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground opacity-50" />
          )}
        </button>
      </div>

      <div className="my-5 border-t border-border" />

      {/* Tags */}
      <div>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" />
            Tags
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {!contact.tags || contact.tags.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">Aucun tag</p>
          ) : (
            contact.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 group cursor-pointer"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
                onClick={() => handleToggleTag(tag.id)}
              >
                {tag.name}
              </span>
            ))
          )}
        </div>
        
        {/* Available Tags list */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] text-muted-foreground">Ajouter un tag :</p>
            <button 
              onClick={() => setShowNewTagInput(!showNewTagInput)}
              className="text-[10px] text-[#fe5105] hover:underline"
            >
              {showNewTagInput ? 'Annuler' : '+ Créer'}
            </button>
          </div>
          
          {showNewTagInput && (
            <div className="mb-3 p-2 bg-secondary/30 rounded-lg border border-border/50 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nom du tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-input outline-none focus:border-[#fe5105]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-6 w-8 p-0 border-0 rounded-md cursor-pointer bg-transparent"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || creatingTag}
                  className="flex-1 bg-[#fe5105] text-white text-[10px] font-medium py-1 rounded hover:bg-[#fe5105]/90 disabled:opacity-50 transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {orgTags.filter(t => !contact.tags?.some(ct => ct.id === t.id)).map(tag => (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 border border-transparent hover:border-current opacity-70 hover:opacity-100 transition-all"
                style={{
                  color: tag.color,
                  backgroundColor: `${tag.color}10`
                }}
              >
                <Plus className="h-2.5 w-2.5" />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="my-5 border-t border-border" />

      {/* Notes */}
      <div>
        <div className="flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <StickyNote className="h-3 w-3" />
          Notes
        </div>
        <div className="mt-3">
          <div className="flex flex-col gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note..."
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || addingNote}
              className="self-end flex items-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg bg-secondary/50 px-3 py-2"
              >
                <p className="whitespace-pre-wrap text-xs text-foreground">
                  {note.note_text}
                </p>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {new Date(note.created_at).toLocaleString('fr-FR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
