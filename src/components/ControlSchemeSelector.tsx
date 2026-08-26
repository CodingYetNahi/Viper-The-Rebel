import type { GameSettings } from '../types';

export function ControlSchemeSelector({settings,onUpdateSettings}:{settings:GameSettings;onUpdateSettings:(settings:GameSettings)=>void}) {
  return <section aria-label="Mobile movement controls" className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
    <div className="mb-2 text-xs font-bold tracking-wider text-slate-300">MOBILE MOVEMENT</div>
    <div className="grid grid-cols-2 gap-2">
      {(['JOYSTICK','TOUCH'] as const).map(scheme=><button key={scheme} onClick={()=>onUpdateSettings({...settings,controlScheme:scheme})} aria-pressed={settings.controlScheme===scheme} className={`min-h-11 rounded-lg border px-2 text-xs font-bold ${settings.controlScheme===scheme?'border-emerald-400 bg-emerald-500/20 text-emerald-200':'border-slate-700 text-slate-300'}`}>{scheme==='JOYSTICK'?'JOYSTICK':'TOUCH STEERING'}</button>)}
    </div>
    <p className="mt-2 text-[11px] text-slate-400">Joystick uses the fixed lower-left control. Touch Steering follows your drag direction anywhere outside the HUD.</p>
  </section>;
}
