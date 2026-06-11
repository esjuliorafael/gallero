'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Title, Description } from '@/components/Typography';
import styles from './admin.module.css';

interface Ticket {
  id: string;
  payment_proof_url: string;
  user: {
    full_name: string;
    phone: string;
  };
  event: {
    title: string;
    scheduled_at: string;
  };
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/tickets/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        console.error('API did not return an array:', data);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const approveTicket = async (ticketId: string) => {
    setApprovingId(ticketId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/tickets/${ticketId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Simplificado para el ejemplo
        },
        body: JSON.stringify({ status: 'APPROVED' })
      });

      if (response.ok) {
        // Optimistic update: Remover de la lista
        setTickets(tickets.filter(t => t.id !== ticketId));
      }
    } catch (error) {
      console.error('Error approving ticket:', error);
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <div className={styles.container}><Description>Cargando tickets...</Description></div>;
  }

  return (
    <main className={styles.container}>
      <div className={styles.titleWrapper}>
        <Title>Revisión de Pagos</Title>
        <Description>Aprueba los comprobantes de los usuarios para darles acceso a los eventos.</Description>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <Description>No hay tickets pendientes de aprobación.</Description>
        </div>
      ) : (
        <div className={styles.grid}>
          {tickets.map((ticket) => (
            <div key={ticket.id} className={styles.card}>
              <div className={styles.eventTitle}>{ticket.event.title}</div>
              <div className={styles.userName}>
                <strong>Usuario:</strong> {ticket.user.full_name || 'N/A'}<br />
                <strong>WhatsApp:</strong> {ticket.user.phone}
              </div>
              
              <div className={styles.buttonGroup}>
                <button 
                  className={styles.viewProofBtn}
                  onClick={() => setSelectedProof(ticket.payment_proof_url)}
                >
                  Ver Comprobante
                </button>
                
                <PrimaryButton 
                  onClick={() => approveTicket(ticket.id)}
                  isLoading={approvingId === ticket.id}
                >
                  Aprobar
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Fullscreen para Comprobante */}
      {selectedProof && (
        <div className={styles.modal}>
          <button className={styles.closeModal} onClick={() => setSelectedProof(null)}>
            CERRAR
          </button>
          <img 
            src={selectedProof} 
            alt="Comprobante de pago" 
            className={styles.proofImage} 
          />
        </div>
      )}
    </main>
  );
}
