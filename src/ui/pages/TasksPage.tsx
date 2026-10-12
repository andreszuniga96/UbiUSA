import { useCriticalTasks } from '../../hooks/useTripData';
import { TripRepository } from '../../data/repository';
import { CheckCircle2, Circle, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TasksPage() {
  const tasks = useCriticalTasks();

  const toggleTask = async (id: string, currentStatus: string) => {
    try {
      await TripRepository.updateTaskStatus(id, currentStatus === 'DONE' ? 'PENDING' : 'DONE');
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const pending = tasks.filter(t => t.status !== 'DONE');
  const done = tasks.filter(t => t.status === 'DONE');

  const getTaskActionLink = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('lynne') || t.includes('cambridge') || t.includes('alojamiento') || t.includes('vuelo') || t.includes('orlando')) {
      return '/reservas';
    }
    if (t.includes('autobús') || t.includes('bus')) {
      return '/reservas';
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-slate-900 text-white pt-6 pb-6 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Pendientes del Viaje</h1>
            <p className="text-xs text-slate-400 font-medium">
              Iván & Gloria · Estados Unidos 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold px-3 py-1 rounded-full">
              {pending.length} pendientes
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">
              {done.length} listos
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-2">
        {/* Banner de Integridad */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              Control Canónico de Preparativos
            </h3>
            <p className="text-xs text-indigo-800 font-medium leading-relaxed">
              Las tareas críticas provienen del itinerario oficial y se sincronizan localmente en tu dispositivo.
            </p>
          </div>
        </div>

        {/* Tareas Pendientes */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Tareas Críticas por Resolver ({pending.length})
            </h2>
            <div className="space-y-2.5">
              {pending.map(task => {
                const actionLink = getTaskActionLink(task.title);
                return (
                  <div 
                    key={task.id} 
                    className={`bg-white p-4 rounded-3xl shadow-xs border transition-all ${
                      task.priority === 'CRITICO' 
                        ? 'border-rose-100 hover:border-rose-300' 
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <button 
                        onClick={() => toggleTask(task.id, task.status)}
                        className="text-slate-300 hover:text-indigo-600 shrink-0 mt-0.5 transition-colors"
                      >
                        <Circle size={22} className="text-rose-400" />
                      </button>
                      <div className="flex-1">
                        <p className="text-slate-900 font-bold text-sm leading-snug">{task.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                            <AlertCircle size={10} /> Crítico
                          </span>
                          {actionLink && (
                            <Link 
                              to={actionLink} 
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 ml-auto"
                            >
                              Resolver en Reservas <ChevronRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tareas Completadas */}
        {done.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1">
              Completadas ({done.length})
            </h2>
            <div className="space-y-2">
              {done.map(task => (
                <div 
                  key={task.id} 
                  className="bg-slate-100/70 p-4 rounded-3xl flex gap-3 items-start border border-slate-200/50"
                >
                  <button 
                    onClick={() => toggleTask(task.id, task.status)}
                    className="text-emerald-500 shrink-0 mt-0.5"
                  >
                    <CheckCircle2 size={22} />
                  </button>
                  <div className="flex-1">
                    <p className="text-slate-500 font-medium text-xs leading-snug line-through">{task.title}</p>
                    <span className="text-[9px] font-extrabold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                      Completada
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
