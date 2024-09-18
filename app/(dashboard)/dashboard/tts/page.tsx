'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Download, Trash2, ChevronDown, Loader2 } from 'lucide-react';

const CHARACTER_LIMIT = 800;

export default function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isGeneratedAudioPlaying, setIsGeneratedAudioPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('/api/voices');
        const data = await response.json();
        setVoices(data.voices.map((voice: any) => ({
          id: voice.voice_id,
          name: voice.name,
          style: voice.type || 'default',
          image: '/placeholder.svg?height=40&width=40&text=' + voice.name[0],
          preview: voice.preview_url,
          visibility: voice.visibility
        })));
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar vozes:', err);
        setError('Erro ao carregar vozes. Por favor, tente novamente mais tarde.');
      }
    };
    fetchVoices();
  }, []);

  const toggleVoicePreview = (voiceId: string, previewUrl: string) => {
    if (playingPreviewId === voiceId) {
      setPlayingPreviewId(null);
      audioRef.current?.pause();
    } else {
      setPlayingPreviewId(voiceId);
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play().catch(error => console.error('Erro ao reproduzir áudio:', error));
      }
    }
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => setPlayingPreviewId(null);
      audioElement.addEventListener('ended', handleEnded);
      return () => audioElement.removeEventListener('ended', handleEnded);
    }
  }, []);

  const toggleGeneratedAudio = () => {
    if (audioRef.current) {
      if (isGeneratedAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsGeneratedAudioPlaying(!isGeneratedAudioPlaying);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleGenerateAudio = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice_id: selectedVoice.id }),
      });

      if (!response.ok) {
        throw new Error('Erro ao converter texto em fala');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioSrc(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsGeneratedAudioPlaying(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao gerar áudio');
    } finally {
      setIsGenerating(false);
    }
  };

  const isGenerateButtonDisabled = text.length === 0 || text.length > CHARACTER_LIMIT || isGenerating;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const updateProgress = () => {
        setAudioProgress(audioElement.currentTime);
        setAudioDuration(audioElement.duration);
      };

      audioElement.addEventListener('timeupdate', updateProgress);
      audioElement.addEventListener('loadedmetadata', updateProgress);
      audioElement.addEventListener('ended', () => setIsGeneratedAudioPlaying(false));

      return () => {
        audioElement.removeEventListener('timeupdate', updateProgress);
        audioElement.removeEventListener('loadedmetadata', updateProgress);
        audioElement.removeEventListener('ended', () => setIsGeneratedAudioPlaying(false));
      };
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (audioSrc) {
      const link = document.createElement('a');
      link.href = audioSrc;
      link.download = 'audio_gerado.mp3'; // Nome do arquivo para download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = () => {
    if (audioSrc) {
      URL.revokeObjectURL(audioSrc);
      setAudioSrc(null);
      setIsGeneratedAudioPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-[#1A414B]">Texto para Fala</h1>
      </header>
      
      <main className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <textarea
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dffdc7] resize-none"
              placeholder="Digite seu texto aqui..."
              value={text}
              onChange={handleTextChange}
              aria-label="Texto para converter em fala"
            ></textarea>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <div className="group flex items-center space-x-2 px-3 py-2 bg-[#f0f9e8] border border-[#d1e7c5] rounded-full transition-all duration-200 hover:border-[#a3d68f] hover:shadow-[0_0_0_1px_#a3d68f,0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
                {selectedVoice && (
                  <button
                    onClick={() => toggleVoicePreview(selectedVoice.id, selectedVoice.preview)}
                    className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[#19414c] text-white hover:bg-[#245a68] transition-colors duration-200"
                    aria-label={`Ouvir prévia da voz ${selectedVoice.name}`}
                  >
                    {playingPreviewId === selectedVoice.id ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                )}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="font-medium truncate max-w-[150px]">
                    {selectedVoice ? selectedVoice.name : 'Selecione uma voz'}
                  </span>
                  <ChevronDown size={20} className="text-gray-500" />
                </button>
              </div>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" role="listbox">
                  {voices.filter(voice => voice.visibility === 'public').map((voice) => (
                    <div
                      key={voice.id}
                      className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedVoice(voice);
                        setIsDropdownOpen(false);
                      }}
                      role="option"
                      aria-selected={selectedVoice?.id === voice.id}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVoicePreview(voice.id, voice.preview);
                        }}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-[#19414c] text-white hover:bg-[#245a68] transition-colors duration-200 mr-3"
                        aria-label={`Ouvir prévia da voz ${voice.name}`}
                      >
                        {playingPreviewId === voice.id ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <div className="flex-grow">
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-sm text-gray-500">Voicefy</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className={`text-sm ${text.length > CHARACTER_LIMIT ? 'text-red-500' : 'text-gray-500'}`} aria-live="polite">
                {text.length} / {CHARACTER_LIMIT}
              </span>
              <button
                className={`px-4 py-2 bg-[#1A414B] text-white rounded-lg transition-colors duration-200 flex items-center justify-center w-full sm:w-auto ${
                  isGenerateButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#2c5a68]'
                }`}
                disabled={isGenerateButtonDisabled}
                onClick={handleGenerateAudio}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Gerando...
                  </>
                ) : (
                  'Gerar áudio'
                )}
              </button>
            </div>
          </div>
          {text.length > CHARACTER_LIMIT && (
            <div className="mt-2 text-red-500 text-sm" role="alert">
              <span>O texto excede o limite de {CHARACTER_LIMIT} caracteres. Remova {text.length - CHARACTER_LIMIT} caracteres para gerar o áudio.</span>
            </div>
          )}
        </div>
        
        {/* Audio Player */}
        {audioSrc && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#1A414B]">Áudio Gerado</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-[#1A414B] transition-colors duration-200" 
                  aria-label="Baixar áudio"
                >
                  <Download size={20} />
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors duration-200" 
                  aria-label="Excluir áudio"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleGeneratedAudio}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-[#dffdc7] text-[#1A414B] hover:bg-[#c5e6a6] transition-colors duration-200"
                aria-label={isGeneratedAudioPlaying ? "Pausar áudio" : "Reproduzir áudio"}
              >
                {isGeneratedAudioPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-[#1A414B] rounded-full" 
                  style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-500 w-20 text-right">
                {formatTime(audioProgress)} / {formatTime(audioDuration)}
              </span>
            </div>
          </div>
        )}
      </main>
      <audio 
        ref={audioRef} 
        className="hidden" 
        onEnded={() => setIsGeneratedAudioPlaying(false)}
      />
    </div>
  );
}