import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-height-screen bg-[#0D0D0D] text-[#E6E6E6] flex flex-col md:flex-row">
      {/* Sidebar / Nav */}
      <nav className="w-full md:w-64 bg-[#141414] border-b md:border-b-0 md:border-r border-[#262626] p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#A61717] rounded-lg"></div>
          <span className="font-bold text-xl tracking-tight">GALLERO ADMIN</span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold mb-2">Gestión</p>
          
          <Link 
            href="/admin/tickets" 
            className="flex items-center gap-3 p-3 rounded-xl bg-[#A61717]/10 text-[#A61717] border border-[#A61717]/20 transition-all font-semibold"
          >
            <div className="w-2 h-2 rounded-full bg-[#A61717]"></div>
            Tickets Pendientes
          </Link>

          <Link 
            href="/admin/events" 
            className="flex items-center gap-3 p-3 rounded-xl text-[#888888] hover:text-[#E6E6E6] hover:bg-[#1A1A1A] transition-all"
          >
            <div className="w-2 h-2 rounded-full bg-[#333333]"></div>
            Eventos
          </Link>
        </div>

        <div className="mt-auto pt-6 border-t border-[#262626]">
          <Link 
            href="/logout" 
            className="text-sm text-[#666666] hover:text-red-500 transition-colors"
          >
            Cerrar Sesión
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
