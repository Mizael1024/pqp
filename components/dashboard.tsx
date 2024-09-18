'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useUser } from '@/lib/auth'
import { Mic2, Play, Pause, Download, Trash2, Plus, Users, Settings, Shield, Activity, Menu, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from "@/hooks/use-toast"

interface HistoryItem {
  id: string;
  text: string;
  date: string;
  voice_name: string;
}

export function DashboardComponent() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (user) {
      fetchAudioHistory()
    } else {
      setHistoryItems([])
    }
  }, [user])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnded)
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded)
      }
    }
  }, [])

  const handleAudioEnded = () => {
    setPlayingAudioId(null)
  }

  const fetchAudioHistory = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/tts-history')
      if (!response.ok) {
        if (response.status === 401) {
          // Usuário não está autenticado, limpar o histórico
          setHistoryItems([])
          return
        }
        throw new Error('Falha ao buscar histórico de áudios')
      }
      const data = await response.json()
      setHistoryItems(data.history)
    } catch (error) {
      console.error('Erro ao carregar histórico de áudios:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar o histórico de áudios.",
        variant: "destructive",
      })
    }
  }

  const handlePlayPause = async (audioId: string) => {
    if (playingAudioId === audioId) {
      audioRef.current?.pause()
      setPlayingAudioId(null)
    } else {
      try {
        const response = await fetch(`/api/tts/play/${audioId}`)
        if (!response.ok) throw new Error('Falha ao buscar áudio')
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.play()
        }
        setPlayingAudioId(audioId)
      } catch (error) {
        console.error('Erro ao reproduzir áudio:', error)
        toast({
          title: "Erro",
          description: "Falha ao reproduzir o áudio.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownload = async (audioId: string) => {
    try {
      const response = await fetch(`/api/tts/download/${audioId}`)
      if (!response.ok) throw new Error('Falha ao baixar áudio')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `audio_${audioId}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      toast({
        title: "Sucesso",
        description: "Áudio baixado com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao baixar áudio:', error)
      toast({
        title: "Erro",
        description: "Falha ao baixar o áudio.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (audioId: string) => {
    try {
      const response = await fetch(`/api/tts/delete/${audioId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao excluir áudio')
      setHistoryItems(historyItems.filter(item => item.id !== audioId))
      toast({
        title: "Sucesso",
        description: "Áudio excluído com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao excluir áudio:', error)
      toast({
        title: "Erro",
        description: "Falha ao excluir o áudio.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return null // Não renderiza nada enquanto redireciona
  }

  const navItems = [
    { href: '/dashboard/tts', icon: Mic, label: 'Texto para Fala' },
  ]

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = historyItems.slice(indexOfFirstItem, indexOfLastItem)

  const totalPages = Math.ceil(historyItems.length / itemsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Cabeçalho móvel */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
        <div className="flex items-center">
          <span className="font-medium">Configurações</span>
        </div>
        <Button
          className="-mr-3"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Alternar barra lateral</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Barra lateral */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  className={`my-1 w-full justify-start ${
                    pathname === item.href ? 'bg-gray-100 hover:bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-y-auto p-0 lg:p-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#1A414B]">Histórico de Áudios Gerados</h3>
              <Link href="/dashboard/tts" passHref>
                <Button
                  className="px-4 py-2 bg-[#2c5a68] text-white rounded-lg hover:bg-[#1A414B] transition-all duration-200 flex items-center space-x-2"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Plus size={20} />
                  <span>Criar novo áudio</span>
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {currentItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 sm:p-5 rounded-lg transition-all duration-200">
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                      <Mic2 className="text-[#1A414B]" size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base sm:text-lg text-[#1A414B]">{item.text}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 font-light">Gerado em: {new Date(parseInt(item.date) * 1000).toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500 font-light">Voz: {item.voice_name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 sm:space-x-3 justify-end sm:justify-start mt-3 sm:mt-0">
                    <button onClick={() => handlePlayPause(item.id)} className="p-2 text-gray-600 hover:text-[#1A414B] transition-colors duration-200 hover:bg-gray-200 rounded-full">
                      {playingAudioId === item.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button onClick={() => handleDownload(item.id)} className="p-2 text-gray-600 hover:text-[#1A414B] transition-colors duration-200 hover:bg-gray-200 rounded-full">
                      <Download size={20} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors duration-200 hover:bg-gray-200 rounded-full">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button onClick={prevPage} disabled={currentPage === 1}>
                Anterior
              </Button>
              <span>Página {currentPage} de {totalPages}</span>
              <Button onClick={nextPage} disabled={currentPage === totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        </main>
      </div>
      <audio ref={audioRef} className="hidden" onEnded={handleAudioEnded} />
    </div>
  )
}