'use client';

import styles from './EventCard.module.css';
import { Calendar, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface EventCardProps {
  id: string;
  title: string;
  speakerName: string;
  speakerTitle?: string;
  price: number;
  scheduledAt: string;
  status: string;
  ticketStatus?: 'PENDING_PAYMENT' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED';
  onAction?: (eventId: string, actionType: string) => void;
}

export function EventCard({
  id,
  title,
  speakerName,
  speakerTitle,
  price,
  scheduledAt,
  status,
  ticketStatus,
  onAction
}: EventCardProps) {
  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const renderActionButton = () => {
    if (ticketStatus === 'APPROVED') {
      return (
        <Link href={`/live/${id}`} style={{ textDecoration: 'none' }}>
          <button className={styles.actionButton} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={18} />
            Ver Ponencia
          </button>
        </Link>
      );
    }

    if (ticketStatus === 'WAITING_APPROVAL') {
      return (
        <button className={styles.actionButtonSecondary} disabled>
          Validando Pago...
        </button>
      );
    }

    return (
      <button 
        className={styles.actionButton}
        onClick={() => onAction?.(id, 'PURCHASE')}
      >
        {price === 0 ? 'Registrarse' : 'Comprar Acceso'}
      </button>
    );
  };

  return (
    <Link href={`/live/${id}`} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {ticketStatus === 'APPROVED' ? (
          <div className={styles.statusApproved}>
            <CheckCircle2 size={16} />
            Pagado
          </div>
        ) : (
          <span className={styles.priceTag}>
            {price === 0 ? 'GRATIS' : `$${price}`}
          </span>
        )}
      </div>

      <div className={styles.speakerInfo}>
        <span className={styles.speakerName}>{speakerName}</span>
        {speakerTitle && <span className={styles.speakerTitle}>{speakerTitle}</span>}
      </div>

      <div className={styles.footer}>
        <div className={styles.dateInfo}>
          <span className={styles.date}>
            <Calendar size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {formattedDate}
          </span>
          <span className={styles.time}>
            <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {formattedTime}
          </span>
        </div>
        
        <div onClick={(e) => {
          if (ticketStatus !== 'APPROVED') {
            e.preventDefault();
            e.stopPropagation();
            onAction?.(id, 'PURCHASE');
          }
        }}>
          {renderActionButton()}
        </div>
      </div>
    </Link>
  );
}
