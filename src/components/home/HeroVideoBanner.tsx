import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroVideo } from "@/lib/data";

interface HeroVideoBannerProps {
  videos: HeroVideo[];
  maxVideos?: number;
  className?: string;
}

const HeroVideoBanner = ({ videos, maxVideos = 3, className = "" }: HeroVideoBannerProps) => {
  const activeVideos = videos
    .filter(v => v.is_active)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    .slice(0, maxVideos);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Cycle through videos
  const handleVideoEnd = () => {
    if (activeVideos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeVideos.length);
    }
  };

  useEffect(() => {
    // If only one video, ensure it loops manually if the loop attribute isn't enough
    // But HTML5 video 'loop' usually works fine. 
    // Here we handle the sequence if more than one.
  }, [activeVideos.length]);

  if (activeVideos.length === 0) return null;

  const currentVideo = activeVideos[currentIndex];

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* Dynamic Overlays */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background z-10" />
      
      {/* Video Transition Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVideo.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnd}
            className="w-full h-full object-cover"
            src={currentVideo.video_url}
            // If it's the only one, loop it
            loop={activeVideos.length === 1}
          />
        </motion.div>
      </AnimatePresence>

      {/* Audio Toggle Control */}
      <div className="absolute bottom-10 right-10 z-30 flex flex-col items-center gap-3">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-background/20 backdrop-blur-md border border-white/10 p-1.5 rounded-full shadow-2xl"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full hover:bg-white/10 text-white w-12 h-12"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 animate-pulse" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>
        </motion.div>
        
        {/* Playback Indicator (dots) */}
        {activeVideos.length > 1 && (
          <div className="flex gap-1.5">
            {activeVideos.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 rounded-full transition-all duration-500 ${
                  idx === currentIndex ? "w-6 bg-primary" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroVideoBanner;
