import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X, ShieldCheck, UserCheck } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title: string;
  subtitle: string;
  signerName: string;
  signerRole: string;
  badgeNumber?: string;
  initialSignature?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  signerName,
  signerRole,
  badgeNumber,
  initialSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#1e272e');

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure DOM modal is mounted and layout computed
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = penColor;

        // Clear background to transparent/white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);

        if (initialSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
            setHasDrawn(true);
          };
          img.src = initialSignature;
        } else {
          setHasDrawn(false);
        }
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [isOpen, initialSignature]);

  if (!isOpen) return null;

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white border-2 border-slate-300 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Flat primary banner */}
        <div className="bg-[#00a8ff] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 flex items-center justify-center font-bold text-white">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide leading-tight">{title}</h3>
              <p className="text-xs text-white/90">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signer Identity Bar */}
        <div className="bg-[#f5f6fa] border-b border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#00a8ff]" />
            <div>
              <span className="font-bold text-slate-800">{signerName}</span>
              <span className="text-slate-500 ml-2">({signerRole})</span>
            </div>
          </div>
          {badgeNumber && (
            <span className="font-mono bg-white border border-slate-300 px-2 py-0.5 text-slate-700 font-semibold text-[11px]">
              {badgeNumber}
            </span>
          )}
        </div>

        {/* Signature Pad Area */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sign with finger, stylus, or mouse inside the box:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPenColor('#1e272e')}
                className={`w-5 h-5 border-2 ${penColor === '#1e272e' ? 'border-[#00a8ff] scale-110' : 'border-slate-300'} bg-[#1e272e]`}
                title="Black ink"
              />
              <button
                type="button"
                onClick={() => setPenColor('#0984e3')}
                className={`w-5 h-5 border-2 ${penColor === '#0984e3' ? 'border-[#00a8ff] scale-110' : 'border-slate-300'} bg-[#0984e3]`}
                title="Blue ink"
              />
            </div>
          </div>

          <div className="relative border-2 border-dashed border-slate-300 bg-white touch-none select-none">
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="w-full h-52 block cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
            />
            {/* Guide baseline line */}
            <div className="pointer-events-none absolute bottom-8 left-8 right-8 border-b border-slate-200 flex justify-between text-[10px] text-slate-300 font-mono select-none">
              <span>✕ SIGN HERE</span>
              <span>DIGITAL AUDIT SEAL</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Timestamp & biometric strokes will be locked upon confirmation</span>
            </div>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-slate-600 hover:text-[#e84118] px-2 py-1 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#f5f6fa] border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn}
            className={`px-5 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all ${
              hasDrawn
                ? 'bg-[#00a8ff] hover:bg-[#0090e0] shadow-sm cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <Check className="w-4 h-4" />
            Accept & Seal Signature
          </button>
        </div>
      </div>
    </div>
  );
};
