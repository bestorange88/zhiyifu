import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PosterPopup() {
  const [open, setOpen] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const res = await fetch("/api/settings/poster");
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setPosterUrl(data.url);
            setOpen(true);
            // 5秒后自动关闭
            const timer = setTimeout(() => {
              setOpen(false);
            }, 5000);
            return () => clearTimeout(timer);
          } else {
             // Fallback to local if no setting, or just don't show
             setPosterUrl("/poster.png");
             setOpen(true);
             const timer = setTimeout(() => { setOpen(false); }, 5000);
             return () => clearTimeout(timer);
          }
        }
      } catch (e) {
        console.error("Failed to fetch poster setting", e);
        // Fallback
        setPosterUrl("/poster.png");
        setOpen(true);
      }
    };

    fetchPoster();
  }, []);

  if (!open || !posterUrl) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="max-w-md w-[90vw] h-auto bg-transparent border-none shadow-none p-0 flex flex-col items-center justify-center outline-none"
        hideCloseButton={true}
      >
        <div className="relative w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-300">
           {/* Poster Image Container - Max Height constraint for full screen feel */}
           <div className="relative rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] w-auto">
             <img 
               src={posterUrl} 
               alt="Welcome Poster" 
               className="w-full h-full object-contain max-h-[85vh]"
               onError={(e) => {
                 // Fallback if image not found
                 e.currentTarget.src = "https://placehold.co/600x900/4F46E5/FFFFFF?text=Welcome+to+Smart+Medical";
               }}
             />
             
             {/* Close Button - Overlaid on top right or below? 
                 User asked for manual close. Usually X on top right is good.
             */}
             <button 
               onClick={() => setOpen(false)}
               className="absolute top-2 right-2 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors z-50"
             >
               <X className="w-6 h-6" />
             </button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}