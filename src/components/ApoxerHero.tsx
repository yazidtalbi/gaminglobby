'use client'

import { PurpleMatchmakingButton } from './PurpleMatchmakingButton'

export default function ApoxerHero({
  heroImageSrc = "https://i.ibb.co/Gf06Gb0Z/Frame-166.png", // replace with your character cutout later
}) {
  return (
    <div className="min-h-screen bg-[#0A0F20] flex items-center justify-center p-10">
      {/* Frame */}
      <section className="relative w-[1604px] h-[713px] bg-[#80FBFD] overflow-hidden">
        {/* Left content */}
        <div className="h-full pl-[160px] pt-[110px]">
          <div className="w-[640px]">
            <h1 className="text-[#090F1F] font-extrabold leading-none tracking-[0.10em] text-[92px]">
              APOXER
              <span className="align-top text-[28px] tracking-[0.02em]">™</span>
            </h1>

            <div className="mt-[18px] text-[#6423E5] font-extrabold tracking-[0.22em] text-[18px]">
              [ FIND NEW PLAYERS, THE EASY WAY ]
            </div>

            <ul className="mt-[44px] list-disc pl-[22px] space-y-[10px] text-[#090F1F] text-[20px] leading-[1.25]">
              <li>Find active lobbies for any game.</li>
              <li>Create or join in seconds.</li>
              <li>Match by skill, region, and playstyle.</li>
              <li>Skip dead queues.</li>
              <li>See who's online and ready to team up right now.</li>
              <li>Join events and tournaments.</li>
            </ul>

            <div className="mt-[56px]">
              <PurpleMatchmakingButton />
            </div>
          </div>
        </div>

        {/* Right character / artwork (positioned like the screenshot) */}
        <img
          src={heroImageSrc}
          alt=""
          className="pointer-events-none select-none absolute right-[-80px] top-[-170px] h-[980px] w-auto"
          draggable={false}
        />
      </section>
    </div>
  )
}

