'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Lock, Moon, Sun, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner"
import { Loader2 } from 'lucide-react'; // Importe o ícone de carregamento
import { Checkbox } from "@/components/ui/checkbox";

interface Voice {
  id: number;
  name: string;
  voice_id: string;
  type: string;
  visibility: string;
  preview_url: string | null;
  user_id?: number;
}

function ThemeToggle({ theme, setTheme }: { theme: string; setTheme: (theme: string) => void }) {
  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
      <Moon className="h-4 w-4" />
    </div>
  )
}

function Pagination({ voicesPerPage, totalVoices, paginate, currentPage }: {
  voicesPerPage: number;
  totalVoices: number;
  paginate: (pageNumber: number) => void;
  currentPage: number;
}) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalVoices / voicesPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center mt-4">
      <ul className="flex space-x-2">
        {pageNumbers.map(number => (
          <li key={number}>
            <Button
              variant={currentPage === number ? "default" : "outline"}
              size="sm"
              onClick={() => paginate(number)}
            >
              {number}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminDashboardComponent() {
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null)
  const [voices, setVoices] = useState<Voice[]>([])
  const [theme, setTheme] = useState('light')
  const [currentPage, setCurrentPage] = useState(1);
  const voicesPerPage = 12;
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVoices, setSelectedVoices] = useState<number[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVoices()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const fetchVoices = async () => {
    try {
      console.log('Iniciando busca de vozes...');
      const response = await fetch('/api/voices')
      console.log('Resposta da API:', response);
      if (!response.ok) throw new Error('Falha ao buscar vozes')
      const data = await response.json()
      console.log('Dados recebidos da API:', data);
      setVoices(data.voices)
      console.log('Estado de voices atualizado:', data.voices);
    } catch (error) {
      console.error('Erro ao carregar vozes:', error)
      toast.error("Erro ao carregar vozes")
    }
  }

  const handleEditVoice = (voice: Voice) => {
    setEditingVoice({ ...voice })
  }

  const handleSaveVoice = async (updatedVoice: Voice, previewFile: File | null) => {
    setIsSaving(true);
    try {
      console.log('Iniciando atualização da voz:', updatedVoice);
      let preview_url = updatedVoice.preview_url;

      if (previewFile) {
        console.log('Fazendo upload do arquivo de prévia...');
        const formData = new FormData();
        formData.append('file', previewFile);
        formData.append('voiceId', updatedVoice.voice_id);

        const uploadResponse = await fetch('/api/upload-preview', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          console.error('Resposta de upload:', await uploadResponse.text());
          throw new Error('Falha ao fazer upload da prévia');
        }
        const uploadData = await uploadResponse.json();
        preview_url = uploadData.url;
        console.log('URL da prévia atualizada:', preview_url);
      }

      console.log('Enviando requisição para atualizar a voz...');
      const response = await fetch(`/api/voices/${updatedVoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedVoice, preview_url }),
      });

      console.log('Resposta da API:', response);
      if (!response.ok) {
        console.error('Resposta de erro:', await response.text());
        throw new Error('Falha ao atualizar a voz');
      }

      const savedVoice = await response.json();
      console.log('Voz atualizada:', savedVoice);
      setVoices(voices.map(v => v.id === savedVoice.id ? savedVoice : v));
      setEditingVoice(null);
      toast.success(`Voz "${savedVoice.name}" atualizada com sucesso.`);
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      toast.error("Erro ao salvar alterações: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVoice = async (voiceId: number) => {
    try {
      const response = await fetch(`/api/voices/${voiceId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao excluir a voz do banco de dados');
      setVoices(voices.filter(v => v.id !== voiceId));
      toast.success("Voz excluída", {
        description: "A voz foi removida do banco de dados.",
      });
    } catch (error) {
      console.error('Erro ao excluir voz:', error);
      toast.error("Erro ao excluir voz do banco de dados");
    }
  }

  const handleGeneratePreview = async (voiceId: string) => {
    try {
      const response = await fetch(`/api/voices/preview/${voiceId}`, { method: 'POST' })
      if (!response.ok) throw new Error('Falha ao gerar prévia')
      const data = await response.json()
      setVoices(voices.map(v => v.voice_id === voiceId ? { ...v, preview_url: data.preview_url } : v))
      toast.success("Prévia gerada com sucesso")
    } catch (error) {
      toast.error("Erro ao gerar prévia")
    }
  }

  const handleSyncVoices = async () => {
    try {
      const response = await fetch('/api/voices/sync', { method: 'GET' });
      if (!response.ok) throw new Error('Falha ao sincronizar vozes');
      await fetchVoices(); // Recarrega as vozes após a sincronização
      toast.success("Vozes sincronizadas com sucesso");
    } catch (error) {
      console.error('Erro ao sincronizar vozes:', error);
      toast.error("Erro ao sincronizar vozes");
    }
  };

  const filteredVoices = useMemo(() => {
    return voices.filter((voice) =>
      voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.voice_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [voices, searchTerm]);

  const indexOfLastVoice = currentPage * voicesPerPage;
  const indexOfFirstVoice = indexOfLastVoice - voicesPerPage;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSelectVoice = (voiceId: number) => {
    setSelectedVoices(prev => 
      prev.includes(voiceId) ? prev.filter(id => id !== voiceId) : [...prev, voiceId]
    );
  };

  const handleSelectAllVoices = () => {
    setSelectedVoices(selectedVoices.length === voices.length ? [] : voices.map(v => v.id));
  };

  const handleBulkVisibilityChange = async (visibility: 'public' | 'private') => {
    setIsBulkProcessing(true);
    try {
      const response = await fetch('/api/voices/bulk-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceIds: selectedVoices, visibility }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar vozes em massa');

      await fetchVoices(); // Recarrega as vozes após a atualização
      toast.success(`Visibilidade atualizada para ${selectedVoices.length} vozes`);
      setSelectedVoices([]);
    } catch (error) {
      console.error('Erro ao atualizar vozes em massa:', error);
      toast.error("Erro ao atualizar vozes em massa");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedVoices.length} vozes?`)) return;

    setIsBulkProcessing(true);
    try {
      const response = await fetch('/api/voices/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceIds: selectedVoices }),
      });

      if (!response.ok) throw new Error('Falha ao excluir vozes em massa');

      await fetchVoices(); // Recarrega as vozes após a exclusão
      toast.success(`${selectedVoices.length} vozes excluídas com sucesso`);
      setSelectedVoices([]);
    } catch (error) {
      console.error('Erro ao excluir vozes em massa:', error);
      toast.error("Erro ao excluir vozes em massa");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background text-foreground p-4 sm:p-6 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold">Biblioteca de Vozes</h2>
        <div className="flex items-center space-x-4">
          <Button onClick={handleSyncVoices}>Sincronizar Vozes</Button>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar vozes pelo nome ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Search className="h-4 w-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
        {selectedVoices.length > 0 && (
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleBulkVisibilityChange('public')} 
              disabled={isBulkProcessing}
            >
              Tornar Públicas
            </Button>
            <Button 
              onClick={() => handleBulkVisibilityChange('private')} 
              disabled={isBulkProcessing}
            >
              Tornar Privadas
            </Button>
            <Button 
              onClick={handleBulkDelete} 
              variant="destructive" 
              disabled={isBulkProcessing}
            >
              Excluir Selecionadas
            </Button>
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedVoices.length === voices.length}
                  onCheckedChange={handleSelectAllVoices}
                />
              </TableHead>
              <TableHead className="w-[200px]">Nome da Voz</TableHead>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[120px]">Visibilidade</TableHead>
              <TableHead className="w-[200px]">Prévia da Voz</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVoices.slice(indexOfFirstVoice, indexOfLastVoice).map((voice) => (
              <TableRow key={voice.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedVoices.includes(voice.id)}
                    onCheckedChange={() => handleSelectVoice(voice.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{voice.name}</TableCell>
                <TableCell>{voice.type}</TableCell>
                <TableCell>
                  {voice.visibility === 'public' ? (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-green-500" />
                      Pública
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-red-500" />
                      Privada
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {voice.preview_url ? (
                    <audio controls src={voice.preview_url} className="w-full max-w-xs">
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  ) : (
                    <Button onClick={() => handleGeneratePreview(voice.voice_id)} className="text-sm">Gerar Prévia</Button>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="variant-outline size-sm" onClick={() => handleEditVoice(voice)}>Editar</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Editar Voz</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                              Nome
                            </Label>
                            <Input 
                              id="name" 
                              value={editingVoice?.name} 
                              onChange={(e) => setEditingVoice(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="col-span-3" 
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="visibility" className="text-right">
                              Visibilidade
                            </Label>
                            <Select
                              onValueChange={(value: string) => setEditingVoice(prev => prev ? { ...prev, visibility: value } : null)}
                              defaultValue={editingVoice?.visibility}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecione a visibilidade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="public">Pública</SelectItem>
                                <SelectItem value="private">Privada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {editingVoice?.type === 'Cloned' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="user" className="text-right">
                                Usuário
                              </Label>
                              <Input id="user" value={editingVoice?.user_id} className="col-span-3" disabled />
                            </div>
                          )}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="preview" className="text-right">
                              Prévia
                            </Label>
                            <Input 
                              id="preview" 
                              type="file" 
                              accept="audio/*" 
                              className="col-span-3"
                              onChange={(e) => setPreviewFile(e.target.files ? e.target.files[0] : null)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            onClick={() => editingVoice && handleSaveVoice(editingVoice, previewFile)}
                            disabled={!editingVoice || isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              'Salvar alterações'
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" size="sm" onClick={() => handleDeleteVoice(voice.id)}>Excluir</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination
          voicesPerPage={voicesPerPage}
          totalVoices={filteredVoices.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>

      <div className="grid gap-6 sm:hidden">
        {filteredVoices.slice(indexOfFirstVoice, indexOfLastVoice).map((voice) => (
          <Card key={voice.id}>
            <CardHeader>
              <CardTitle>{voice.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Tipo:</span>
                  <span>{voice.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Visibilidade:</span>
                  {voice.visibility === 'public' ? (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-green-500" />
                      Pública
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-red-500" />
                      Privada
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium">Prévia:</span>
                  {voice.preview_url ? (
                    <audio controls src={voice.preview_url} className="w-full mt-2">
                      Seu navegador não suporta o elemento de áudio.
                    </audio>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleGeneratePreview(voice.voice_id)} className="mt-2">Gerar Prévia</Button>
                  )}
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEditVoice(voice)}>Editar</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full">
                      <DialogHeader>
                        <DialogTitle>Editar Voz</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="mobile-name">Nome</Label>
                          <Input 
                            id="mobile-name" 
                            value={editingVoice?.name} 
                            onChange={(e) => setEditingVoice(prev => prev ? {...prev, name: e.target.value} : null)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="mobile-visibility">Visibilidade</Label>
                          <Select
                            onValueChange={(value: any) => setEditingVoice(prev => prev ? { ...prev, visibility: value } : null)}
                            defaultValue={editingVoice?.visibility}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a visibilidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Pública</SelectItem>
                              <SelectItem value="private">Privada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {editingVoice?.type === 'Cloned' && (
                          <div className="grid gap-2">
                            <Label htmlFor="mobile-user">Usuário</Label>
                            <Input id="mobile-user" value={editingVoice?.user_id} disabled />
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="mobile-preview">Prévia</Label>
                          <Input 
                            id="mobile-preview" 
                            type="file" 
                            accept="audio/*" 
                            onChange={(e) => setPreviewFile(e.target.files ? e.target.files[0] : null)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          onClick={() => editingVoice && handleSaveVoice(editingVoice, previewFile)}
                          disabled={!editingVoice || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            'Salvar alterações'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteVoice(voice.id)}>Excluir</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Pagination
          voicesPerPage={voicesPerPage}
          totalVoices={filteredVoices.length}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>
    </div>
  )
}