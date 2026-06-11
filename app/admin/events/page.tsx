'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Title, Description } from '@/components/Typography';
import { Plus, Edit } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  speaker_name: string;
  scheduled_at: string;
  price: number;
}

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#0D0D0D] min-h-screen flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Title>Eventos en Vivo</Title>
          <Description>Gestiona tus ponencias y transmisiones.</Description>
        </div>
        <Link 
          href="/admin/events/create" 
          className="bg-[#A61717] text-[#E6E6E6] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#8C1212] transition-colors"
        >
          <Plus size={20} />
          Nuevo Evento
        </Link>
      </div>

      {loading ? (
        <Description>Cargando eventos...</Description>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-[#141414] border border-[#262626] p-5 rounded-2xl flex items-center justify-between group">
              <div>
                <h3 className="text-[#E6E6E6] font-bold text-lg">{event.title}</h3>
                <p className="text-[#888] text-sm">{event.speaker_name} • {new Date(event.scheduled_at).toLocaleDateString()}</p>
              </div>
              <Link 
                href={`/admin/events/create?id=${event.id}`}
                className="p-3 bg-[#1A1A1A] rounded-xl text-[#666] hover:text-[#A61717] hover:bg-[#A61717]/10 transition-all"
              >
                <Edit size={20} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
