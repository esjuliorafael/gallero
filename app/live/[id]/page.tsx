'use client';

import { useEffect, useState, useRef, use } from 'react';
import styles from './event.module.css';
import { PrimaryButton } from '@/components/PrimaryButton';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  BookOpen, 
  ChevronRight, 
  X, 
  Image as ImageIcon,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  speaker_name: string;
  speaker_title?: string;
  price: number;
  scheduled_at: string;
  duration_minutes?: number;
  preview_video_url?: string;
  status: string;
  tickets?: any[];
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvent();
  }, [resolvedParams.id]);

  const fetchEvent = async () => {
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${resolvedParams.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handlePurchase = async () => {
    if (!file || !event) return;
    
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${event.id}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setShowPurchase(false);
          fetchEvent(); // Update status to WAITING_APPROVAL
        }, 3000);
      } else {
        alert('Error al subir el comprobante. Por favor intenta de nuevo.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className={styles.pageContainer}></div>;
  if (!event) return <div className={styles.pageContainer}>Evento no encontrado</div>;

  const subtotal = Number(event.price);
  const taxes = subtotal * 0.16;
  const total = subtotal + taxes;

  return (
    <main className={styles.pageContainer}>
      {/* Hero / Poster */}
      <div className={styles.hero}>
        <img 
          src={event.preview_video_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"} 
          className={styles.poster} 
          alt={event.title} 
        />
      </div>

      <div className={styles.content}>
        <span className={styles.badge}>Ponencia Premium</span>
        <h1 className={styles.title}>{event.title}</h1>

        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <UserIcon size={16} color="#A61717" />
            <span>Ponente: <span className={styles.metaValue}>{event.speaker_name}</span></span>
          </div>
          <div className={styles.metaItem}>
            <Calendar size={16} color="#A61717" />
            <span>Fecha: <span className={styles.metaValue}>{new Date(event.scheduled_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
          </div>
          <div className={styles.metaItem}>
            <Clock size={16} color="#A61717" />
            <span>Hora: <span className={styles.metaValue}>{new Date(event.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs</span></span>
          </div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><BookOpen size={18} /> Sinopsis</h2>
          <p className={styles.description}>{event.description}</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}><ChevronRight size={18} /> Temario de la Ponencia</h2>
          <ul className={styles.syllabusList}>
            <li className={styles.syllabusItem}>
              <span className={styles.itemNumber}>01.</span>
              <span className={styles.itemText}>Introducción y fundamentos del tema.</span>
            </li>
            <li className={styles.syllabusItem}>
              <span className={styles.itemNumber}>02.</span>
              <span className={styles.itemText}>Análisis de casos de éxito y estrategias aplicadas.</span>
            </li>
            <li className={styles.syllabusItem}>
              <span className={styles.itemNumber}>03.</span>
              <span className={styles.itemText}>Metodologías avanzadas y herramientas críticas.</span>
            </li>
            <li className={styles.syllabusItem}>
              <span className={styles.itemNumber}>04.</span>
              <span className={styles.itemText}>Sesión de preguntas y respuestas en tiempo real.</span>
            </li>
          </ul>
        </section>
      </div>

      {/* Fixed Button Mobile */}
      <PrimaryButton 
        isFixedMobile 
        onClick={() => setShowPurchase(true)}
      >
        Comprar Acceso - ${event.price}
      </PrimaryButton>

      {/* Purchase Sheet / Modal */}
      {showPurchase && (
        <div className={styles.sheetOverlay}>
          <div className={styles.sheetContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 900 }}>Resumen de Compra</h2>
              <button onClick={() => setShowPurchase(false)} style={{ background: 'none', border: 'none', color: '#888' }}>
                <X size={24} />
              </button>
            </div>

            {isSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={64} color="#A61717" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>¡Comprobante Enviado!</h3>
                <p style={{ color: '#888', fontSize: '14px' }}>Estamos validando tu pago. Recibirás una notificación por WhatsApp en breve.</p>
              </div>
            ) : (
              <>
                <div className={styles.summarySection}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>IVA (16%)</span>
                    <span>${taxes.toFixed(2)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Total a Pagar</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.bankDetailsBox}>
                  <span className={styles.bankTitle}>TRANSFERENCIA BANCARIA</span>
                  <div className={styles.bankRow}>
                    <span className={styles.bankKey}>BANCO</span>
                    <span className={styles.bankVal}>SANTANDER</span>
                  </div>
                  <div className={styles.bankRow}>
                    <span className={styles.bankKey}>CLABE</span>
                    <span className={styles.bankVal}>0123 4567 8901 2345 67</span>
                  </div>
                  <div className={styles.bankRow}>
                    <span className={styles.bankKey}>CONCEPTO</span>
                    <span className={styles.bankVal}>{event.id.split('-')[0].toUpperCase()}</span>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleFileSelect}
                />

                {!preview ? (
                  <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className={styles.uploadIcon} size={32} />
                    <h4 className={styles.uploadTitle}>Subir foto del comprobante</h4>
                    <p className={styles.uploadHint}>Formatos: JPG, PNG o WEBP (Máx. 5MB)</p>
                  </div>
                ) : (
                  <div className={styles.previewContainer}>
                    <img src={preview} className={styles.previewImage} alt="Preview" />
                    <button className={styles.removePreview} onClick={() => { setPreview(null); setFile(null); }}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                <PrimaryButton 
                  onClick={handlePurchase} 
                  isLoading={uploading}
                  disabled={!file}
                >
                  Confirmar Pago
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
