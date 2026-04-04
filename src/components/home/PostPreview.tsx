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

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.16 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Threads icon component
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 1.763-.012 3.229-.384 4.382-1.105a6.07 6.07 0 0 0 2.24-3.237l2.04.57c-.65 2.33-1.83 4.17-3.504 5.458-1.783 1.375-4.083 2.08-6.832 2.1l-.326.333zm5.952-9.08c-.76 0-1.438-.14-2.022-.417-.57-.273-1.035-.673-1.383-1.192l1.675-1.166c.23.32.518.568.856.735.35.172.762.258 1.227.258.596 0 1.129-.148 1.585-.44.455-.291.703-.7.703-1.18 0-.497-.248-.911-.737-1.23-.474-.31-1.15-.47-2.007-.478l-.024-.001v-1.694l.024-.001c.75-.005 1.35-.154 1.786-.443.42-.28.625-.665.625-1.175 0-.442-.204-.793-.623-1.074-.434-.29-.98-.438-1.625-.438-.428 0-.81.077-1.136.228a2.01 2.01 0 0 0-.81.672l-1.675-1.166a3.957 3.957 0 0 1 1.561-1.309c.653-.31 1.398-.468 2.22-.468 1.144 0 2.126.265 2.92.788.801.528 1.2 1.276 1.2 2.224 0 .554-.155 1.043-.46 1.455-.277.378-.644.659-1.095.837.545.18.993.472 1.333.873.355.418.537.916.537 1.481 0 .994-.418 1.77-1.246 2.31-.815.531-1.85.8-3.08.8l-.326-.367z"/>
  </svg>
);
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
  x: {
    gradient: "bg-gradient-to-br from-[#000000] to-[#1D9BF0]",
    icon: XIcon,
  },
  threads: {
    gradient: "bg-gradient-to-br from-[#1C1C1C] to-[#5C5C5C]",
    icon: ThreadsIcon,
  },
};

interface PostPreviewProps {
  post: BestPost;
  className?: string;
}

const PostPreview = ({ post, className = "" }: PostPreviewProps) => {
  const hasCustomThumbnail = post.thumbnail && post.thumbnail.trim() !== "";
  const platformConfig = platformStyles[post.platform] ?? platformStyles["instagram"];
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
