import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Volume2, VolumeX } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const videos = [
  {
    id: 1,
    thumbnail: '/products/tshirt-classic.jpg',
    title: 'T-Shirt Classic',
    description: 'Conforto e estilo em cada detalhe',
  },
  {
    id: 2,
    thumbnail: '/products/bone-americano.jpg',
    title: 'Boné Americano',
    description: 'Estilo geek para qualquer ocasião',
  },
  {
    id: 3,
    thumbnail: '/products/moletom-canguru.jpg',
    title: 'Moletom Canguru',
    description: 'Aquecimento para os dias frios',
  },
];

export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Expand animation on scroll
      gsap.to(
        containerRef.current,
        {
          width: '100%',
          borderRadius: '0px',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'top 20%',
            scrub: true,
          },
        }
      );

      // Cards stagger animation
      const cards = containerRef.current?.querySelectorAll('.video-card');
      if (cards) {
        gsap.to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 70%',
            },
          }
        );
      }
    }, sectionRef);

    const fallbackTimer = setTimeout(() => {
      if (!sectionRef?.current) return;
      const els = sectionRef.current.querySelectorAll('[data-animate]');
      els.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (parseFloat(getComputedStyle(htmlEl).opacity) < 0.5) {
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'none';
        }
      });
    }, 1500);

    return () => {
      ctx.revert();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-[#2563EB] via-[#1E40AF] to-[#7C3AED] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h2 className="font-display text-5xl md:text-6xl text-white mb-4">
            EM AÇÃO
          </h2>
          <p className="font-body text-lg text-white/80 max-w-2xl mx-auto">
            Veja nossos produtos em movimento. Qualidade que você pode ver e sentir.
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="mx-auto overflow-hidden"
        style={{ width: '70%' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="video-card relative aspect-video rounded-xl overflow-hidden group cursor-pointer"
              data-animate
              onClick={() => setActiveVideo(activeVideo === video.id ? null : video.id)}
            >
              {/* Thumbnail */}
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-ink/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-fire">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl text-white mb-1">
                  {video.title}
                </h3>
                <p className="font-body text-sm text-white/70">
                  {video.description}
                </p>
              </div>

              {/* Mute Button (if video playing) */}
              {activeVideo === video.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
