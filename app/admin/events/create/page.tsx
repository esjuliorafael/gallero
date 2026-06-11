'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextInput } from '@/components/TextInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Title, Description } from '@/components/Typography';
import { Copy, Check } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const isEditing = !!eventId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    speaker_name: '',
    speaker_title: '',
    price: '',
    scheduled_at: '',
    duration_minutes: '',
    stream_key: '',
    playback_id: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`);
      const data = await response.json();
      setFormData({
        title: data.title,
        description: data.description,
        speaker_name: data.speaker_name,
        speaker_title: data.speaker_title || '',
        price: data.price.toString(),
        scheduled_at: new Date(data.scheduled_at).toISOString().slice(0, 16),
        duration_minutes: data.duration_minutes?.toString() || '',
        stream_key: data.stream_key || '',
        playback_id: data.playback_id || '',
      });
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
    };

    try {
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/events`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        router.push('/admin/events');
      }
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-8 text-[#888]">Cargando evento...</div>;

  return (
    <main className="p-6 bg-[#0D0D0D] min-h-screen flex flex-col gap-8">
      <div>
        <Title>{isEditing ? 'Editar Evento' : 'Crear Nuevo Evento'}</Title>
        <Description>Configura los detalles comerciales y la señal de streaming.</Description>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
        <div className="flex flex-col gap-4">
          <label className="text-[12px] font-bold uppercase tracking-widest text-[#666]">Información General</label>
          <TextInput 
            placeholder="Título del Evento"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea 
            placeholder="Descripción"
            className="w-full min-h-[120px] bg-transparent border-2 border-[#535353] focus:border-[#A61717] rounded-[12px] p-[16px] text-[#E6E6E6] font-semibold text-[16px] outline-none placeholder:text-[#535353] transition-colors"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <label className="text-[12px] font-bold uppercase tracking-widest text-[#666]">Ponente</label>
            <TextInput 
              placeholder="Nombre del Ponente"
              value={formData.speaker_name}
              onChange={(e) => setFormData({...formData, speaker_name: e.target.value})}
              required
            />
            <TextInput 
              placeholder="Título/Cargo (Opcional)"
              value={formData.speaker_title}
              onChange={(e) => setFormData({...formData, speaker_title: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-4">
            <label className="text-[12px] font-bold uppercase tracking-widest text-[#666]">Venta y Horario</label>
            <TextInput 
              type="number"
              placeholder="Precio (MXN)"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
            />
            <TextInput 
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Cloudflare Config Section */}
        <div className="border-2 border-[#A61717]/30 rounded-2xl p-6 bg-[#1A0A0A]/50 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#A61717] animate-pulse"></div>
            <h2 className="text-[#A61717] font-bold uppercase tracking-widest text-[10px]">Configuración de Señal (Cloudflare)</h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[#888]">Stream Key</label>
              {isEditing && formData.stream_key ? (
                <div className="bg-black border border-[#333] p-4 rounded-xl font-mono text-sm flex items-center justify-between group">
                  <span className="text-[#A61717] truncate mr-4">{formData.stream_key}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(formData.stream_key, 'stream_key')}
                    className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedField === 'stream_key' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[#666]" />}
                  </button>
                </div>
              ) : (
                <TextInput 
                  placeholder="Paste Stream Key"
                  value={formData.stream_key}
                  onChange={(e) => setFormData({...formData, stream_key: e.target.value})}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[#888]">Playback ID</label>
              {isEditing && formData.playback_id ? (
                <div className="bg-black border border-[#333] p-4 rounded-xl font-mono text-sm flex items-center justify-between group">
                  <span className="text-[#A61717] truncate mr-4">{formData.playback_id}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(formData.playback_id, 'playback_id')}
                    className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors flex-shrink-0"
                  >
                    {copiedField === 'playback_id' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-[#666]" />}
                  </button>
                </div>
              ) : (
                <TextInput 
                  placeholder="Paste Playback ID"
                  value={formData.playback_id}
                  onChange={(e) => setFormData({...formData, playback_id: e.target.value})}
                />
              )}
            </div>
          </div>
        </div>

        <PrimaryButton type="submit" isLoading={isLoading} className="mt-4">
          {isEditing ? 'Guardar Cambios' : 'Publicar Evento'}
        </PrimaryButton>
      </form>
    </main>
  );
}
