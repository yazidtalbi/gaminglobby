'use client'

import { useEffect, useRef } from 'react'

interface YouTubeBackgroundProps {
  videoId: string
  startTime?: number
  endTime?: number
  className?: string
}

export function YouTubeBackground({
  videoId,
  startTime = 30,
  endTime = 90,
  className = '',
}: YouTubeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let isMounted = true

    // Load YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        if (isMounted && containerRef.current) {
          initializePlayer()
        }
      }
    } else if (window.YT.Player) {
      initializePlayer()
    }

    function initializePlayer() {
      if (!containerRef.current || !window.YT?.Player || !isMounted) return

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            rel: 0,
            modestbranding: 1,
            loop: 0, // We'll handle looping manually
            start: startTime,
            playlist: videoId, // Required for looping
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            iv_load_policy: 3, // Hide annotations
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return
              event.target.seekTo(startTime, true)
              event.target.playVideo()
              // Start monitoring for end time
              startMonitoring()
            },
            onStateChange: (event: any) => {
              if (!isMounted) return
              // YouTube state: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
              if (event.data === window.YT.PlayerState.ENDED) {
                // Loop back to start time
                event.target.seekTo(startTime, true)
                event.target.playVideo()
              }
            },
          },
        })
      } catch (error) {
        console.error('Error initializing YouTube player:', error)
      }
    }

    function startMonitoring() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      intervalRef.current = setInterval(() => {
        if (!isMounted || !playerRef.current) return

        try {
          const currentTime = playerRef.current.getCurrentTime()
          if (currentTime >= endTime) {
            // Seek back to start time to loop
            playerRef.current.seekTo(startTime, true)
          }
        } catch (e) {
          // Player might not be ready yet or destroyed
        }
      }, 100) // Check every 100ms
    }

    return () => {
      isMounted = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          // Ignore destroy errors
        }
        playerRef.current = null
      }
    }
  }, [videoId, startTime, endTime])

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      {/* YouTube iframe container */}
      <div
        ref={containerRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '177.77777778vh', // 16:9 ratio based on viewport height
          height: '56.25vw', // 16:9 ratio based on viewport width
          minWidth: '100%',
          minHeight: '100%',
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-none" />
    </div>
  )
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
