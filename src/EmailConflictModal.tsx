import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

export function EmailConflictModal({ 
  currentEmail, 
  onUpdate, 
  onCancel 
}: { 
  currentEmail: string; 
  onUpdate: (newEmail: string) => void; 
  onCancel: () => void; 
}) {
  const [newEmail, setNewEmail] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a1a2e]">Correo ya Registrado</h2>
              <p className="text-sm text-gray-400">Este correo existe en el sistema principal</p>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-xs text-red-500 font-black uppercase tracking-widest mb-1">Correo actual (duplicado)</p>
            <p className="text-sm font-bold text-red-700 break-all">{currentEmail}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">
            Este correo ya está vinculado a un cliente en YouBox GT. 
            Ingresa un correo alternativo para este socio y continúa con la activación.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-[.2em]">
              Nuevo Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="nuevo@correo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-400 transition-colors"
              autoFocus
            />
          </div>
        </div>

        <div className="p-8 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!newEmail || !newEmail.includes('@')) {
                alert('Por favor ingresa un correo electrónico válido.');
                return;
              }
              onUpdate(newEmail);
            }}
            className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition-colors shadow-lg"
          >
            Actualizar y Activar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
