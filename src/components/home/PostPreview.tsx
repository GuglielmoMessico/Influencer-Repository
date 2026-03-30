import { Instagram, Facebook, Eye, Play, ExternalLink } from "lucide-react";
import { formatNumber, type BestPost } from "@/lib/data";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Platform gradient styles
const platformStyles = {
  instagram: {
    gradient: "bg-gradient-to-br from-[#E1306C] via-[#C13584] to-[#F77737]",
    icon: Instagram,
  },
  tiktok: {
    gradient: "bg-gradient-to-br from-[#000000] via-[#121212] to-[#00F2EA]",
    icon: TikTokIcon,
  },
  facebook: {
    gradient: "bg-gradient-to-br from-[#1877F2] to-[#42B72A]",
    icon: Facebook,
  },
};

interface PostPreviewProps {
  post: BestPost;
  className?: string;
}

const PostPreview = ({ post, className = "" }: PostPreviewProps) => {
  const hasCustomThumbnail = post.thumbnail && post.thumbnail.trim() !== "";
  const platformConfig = platformStyles[post.platform];
  const PlatformIcon = platformConfig.icon;

  // If has custom thumbnail, render image with overlay
  if (hasCustomThumbnail) {
    return (
      <a
        href={post.post_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative aspect-[4/5] rounded-lg overflow-hidden shadow-md hover:shadow-elegant transition-all block ${className}`}
      >
        <img
          src={post.thumbnail}
          alt={`Best post on ${post.platform}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // If image fails to load, hide it to show placeholder
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        
        {/* Play Icon - appears on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
            <div className="flex items-center justify-between text-primary-foreground">
              <span className="text-[10px] md:text-xs uppercase">{post.platform}</span>
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
            </div>
          </div>
        </div>
        
        {/* Views badge */}
        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-primary/90 text-primary-foreground px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1">
          <Eye className="w-2.5 h-2.5 md:w-3 md:h-3" />
          {formatNumber(post.views_count)}
        </div>
      </a>
    );
  }

  // Placeholder preview when no thumbnail
  return (
    <a
      href={post.post_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative aspect-[4/5] rounded-lg overflow-hidden shadow-md hover:shadow-elegant transition-all block ${className}`}
    >
      {/* Platform gradient background */}
      <div className={`absolute inset-0 ${platformConfig.gradient}`} />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {/* Platform icon */}
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <PlatformIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </div>
        
        {/* Play button */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium text-sm group-hover:bg-white/30 transition-colors">
          <Play className="w-4 h-4 fill-white" />
          <span>Ver Post</span>
        </div>
        
        {/* Platform name */}
        <p className="mt-3 text-white/80 text-xs uppercase tracking-wider">
          {post.platform}
        </p>
      </div>
      
      {/* Views badge */}
      <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 bg-black/50 backdrop-blur-sm text-white px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1">
        <Eye className="w-2.5 h-2.5 md:w-3 md:h-3" />
        {formatNumber(post.views_count)}
      </div>
      
      {/* External link indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink className="w-4 h-4 text-white/80" />
      </div>
    </a>
  );
};

export default PostPreview;
