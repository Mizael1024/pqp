'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/auth'
import { Mic2, Play, Download, Trash2, Plus } from 'lucide-react'

type Audio = {
  id: number;
  text: string;
  createdAt: Date;
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const [audios, setAudios] = useState<Audio[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
    } else {
      // Aqui você pode carregar os áudios do usuário
      setAudios([
        { id: 1, text: 'Áudio 1', createdAt: new Date() },
        { id: 2, text: 'Áudio 2', createdAt: new Date() },
        { id: 3, text: 'Áudio 3', createdAt: new Date() },
      ])
    }
  }, [user, router])

  if (!user) {
    return null // Não renderiza nada enquanto redireciona
  }

  const createNewAudio = () => {
    // Implementar lógica para criar novo áudio
    console.log('Criar novo áudio');
  };

  const playAudio = (id: number) => {
    // Implementar lógica para reproduzir áudio
    console.log('Reproduzir áudio', id);
  };

  const downloadAudio = (id: number) => {
    // Implementar lógica para baixar áudio
    console.log('Baixar áudio', id);
  };

  const deleteAudio = (id: number) => {
    // Implementar lógica para excluir áudio
    setAudios(audios.filter(audio => audio.id !== id));
  };

  const handleCreateNewAudio = () => {
    window.location.href = '/dashboard/tts';
  };

  console.log('Router:', router);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#1A414B]">Histórico de Áudios Gerados</h3>
        <button 
          onClick={handleCreateNewAudio} // Alterado de createNewAudio para handleCreateNewAudio
          className="px-4 py-2 bg-[#2c5a68] text-white rounded-lg hover:bg-[#1A414B] transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Criar novo áudio</span>
        </button>
      </div>
      <div className="space-y-4">
        {audios.map((audio) => (
          <div key={audio.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 sm:p-5 rounded-lg transition-all duration-200">
            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#e8f5e9] rounded-full flex items-center justify-center">
                <Mic2 className="text-[#1A414B]" size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-base sm:text-lg text-[#1A414B]">{audio.text}</h4>
                <p className="text-xs sm:text-sm text-gray-500 font-light">Gerado em: {audio.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-3 justify-end sm:justify-start mt-3 sm:mt-0">
              <button onClick={() => playAudio(audio.id)} className="p-2 text-gray-600 hover:text-[#1A414B] transition-colors duration-200 hover:bg-gray-200 rounded-full">
                <Play size={20} />
              </button>
              <button onClick={() => downloadAudio(audio.id)} className="p-2 text-gray-600 hover:text-[#1A414B] transition-colors duration-200 hover:bg-gray-200 rounded-full">
                <Download size={20} />
              </button>
              <button onClick={() => deleteAudio(audio.id)} className="p-2 text-gray-600 hover:text-red-500 transition-colors duration-200 hover:bg-gray-200 rounded-full">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}