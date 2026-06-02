import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Upload,
  FileText,
  Trash2,
  Search,
  Loader2,
  File,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface Document {
  id: string
  title: string
  content_preview: string
  status: 'processing' | 'indexed' | 'failed'
  created_at: string
}

// Mock documents for demonstration
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Returns Policy.pdf',
    content_preview: 'Our returns policy allows customers to return items within 30 days of purchase...',
    status: 'indexed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: '2',
    title: 'Shipping Guidelines.pdf',
    content_preview: 'Standard shipping takes 3-5 business days. Express shipping available for...',
    status: 'indexed',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '3',
    title: 'FAQ Document.txt',
    content_preview: 'Frequently asked questions about our products and services...',
    status: 'processing',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
]

function DocumentCard({
  document,
  onDelete,
}: {
  document: Document
  onDelete: (doc: Document) => void
}) {
  const getStatusBadge = () => {
    switch (document.status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Embedding...
          </Badge>
        )
      case 'indexed':
        return (
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
            <CheckCircle className="mr-1 h-3 w-3" />
            Indexed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-rose-500/20 text-rose-400">
            Failed
          </Badge>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-slate-700/30 bg-surface transition-colors hover:border-slate-600/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">
                  {document.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {document.content_preview}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {getStatusBadge()}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(document.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(document)}
              className="h-8 w-8 text-slate-400 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function UploadZone({ onUpload }: { onUpload: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      onUpload(files)
    },
    [onUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      onUpload(files)
    },
    [onUpload]
  )

  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-slate-700/30 hover:border-slate-600/30 hover:bg-slate-800/20'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.txt,.md,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        Drop files here or click to upload
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, TXT, Markdown, or DOCX files
      </p>
    </label>
  )
}

export function DocumentsPage() {
  const { id } = useParams()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [search, setSearch] = useState('')
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null)

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpload = (files: File[]) => {
    files.forEach((file) => {
      const newDoc: Document = {
        id: Date.now().toString() + Math.random(),
        title: file.name,
        content_preview: 'Processing document content...',
        status: 'processing',
        created_at: new Date().toISOString(),
      }
      setDocuments((prev) => [newDoc, ...prev])

      // Simulate processing
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDoc.id
              ? { ...doc, status: 'indexed' as const, content_preview: `Content from ${file.name} has been indexed and is ready for search.` }
              : doc
          )
        )
        toast.success(`${file.name} indexed successfully`)
      }, 3000)
    })

    toast.info(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`)
  }

  const handleDelete = () => {
    if (deleteDoc) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDoc.id))
      toast.success('Document deleted')
      setDeleteDoc(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload and manage documents for your AI agent
          </p>
        </div>

        {/* Upload Zone */}
        <UploadZone onUpload={handleUpload} />

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-slate-700/30 bg-surface pl-10 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={setDeleteDoc}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/30 py-12">
              <File className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search ? 'No documents found' : 'No documents yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                Upload PDFs or text files to give your agent knowledge.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent className="border-slate-700/30 bg-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium text-destructive">{deleteDoc?.title}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700/30 bg-transparent text-foreground hover:bg-slate-800/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
