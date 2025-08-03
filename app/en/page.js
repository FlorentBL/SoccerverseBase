"use client";

import Navbar from "@/components/Navbar";
import {
  FaBookOpen, FaSearch, FaChartLine, FaDiscord, FaYoutube,
  FaUsers, FaCheckCircle, FaUserPlus, FaPuzzlePiece, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { useState } from "react";

const LOGO_MASCOTTE = "/logo.png";

const sections = [
  {
    key: "soccerverse",
    title: "What is Soccerverse?",
    icon: <FaBookOpen className="text-sky-400 text-2xl mr-2" />,
    content: (
      <>
        <p className="mb-3 text-gray-300">
          <b>Soccerverse</b> is a next-gen football management simulation game <b>connected to real-life football news</b>: real performances and transfers impact the game live.
        </p>
        <ul className="list-none mt-2 space-y-2">
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Shareholder</b>: Invest in clubs or players (influence shares). Earn SVC each week based on their results.
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Coach or Agent</b>: Get elected as coach by the community, manage transfers, salaries, lineups...
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Collective Decisions</b>: Everything is decided together (votes for coach, transfers, tactics...).
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Realistic Gameplay</b>: Squad management, finances, injuries, and real-time transfers...
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>Weekly Earnings</b>: Collect rewards every week, plus end-of-season bonuses based on club/player performance.
            </span>
          </li>
          <li className="flex gap-2 items-start">
            <FaCheckCircle className="text-sky-400 mt-1" />
            <span>
              <b>IRL Impact</b>: Real-life performances or transfers = evolution in the game!
            </span>
          </li>
        </ul>
        <p className="text-xs text-sky-200 mt-4">
          <b>Example:</b> Acting as an agent for a young player? If he shines IRL, his value skyrockets in-game.  
          You vote to sign, sell, or even replace the coach.
        </p>
      </>
    ),
  },
  {
    key: "roles",
    title: "Roles in Soccerverse",
    icon: <FaUsers className="text-emerald-400 text-2xl mr-2" />,
    content: (
      <div>
        <p className="mb-6 text-gray-300">
          <b>You can take on multiple roles</b> based on your style: strategist, investor, negotiator, or talent scout.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* COACH */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-emerald-700/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaBookOpen className="text-emerald-400" />
              <span className="font-bold text-emerald-200">Coach</span>
            </div>
            <span className="text-xs text-emerald-300 mb-1">The Strategist</span>
            <span className="text-gray-300 text-sm flex-1">Prepare matches, manage transfer market & squad, make sporting decisions. Diplomacy & vision required!</span>
          </div>
          {/* AGENT */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-yellow-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaUserPlus className="text-yellow-300" />
              <span className="font-bold text-yellow-100">Agent</span>
            </div>
            <span className="text-xs text-yellow-200 mb-1">The Negotiator</span>
            <span className="text-gray-300 text-sm flex-1">Handle transfers, contracts, player career and morale. A key middleman!</span>
          </div>
          {/* INFLUENCER */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-blue-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaUsers className="text-blue-400" />
              <span className="font-bold text-blue-100">Influencer</span>
            </div>
            <span className="text-xs text-blue-200 mb-1">The Shareholder</span>
            <span className="text-gray-300 text-sm flex-1">Vote on major decisions, aim for long-term profit. More shares = more power!</span>
          </div>
          {/* TRADER */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-pink-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaChartLine className="text-pink-400" />
              <span className="font-bold text-pink-100">Trader</span>
            </div>
            <span className="text-xs text-pink-200 mb-1">The Speculator</span>
            <span className="text-gray-300 text-sm flex-1">Profit from influence market fluctuations. Buy low, sell high!</span>
          </div>
          {/* SCOUT */}
          <div className="rounded-xl bg-gradient-to-b from-gray-900/95 to-gray-800/80 border border-purple-500/30 shadow p-5 flex flex-col min-h-[170px]">
            <div className="flex items-center gap-2 mb-1">
              <FaSearch className="text-purple-300" />
              <span className="font-bold text-purple-100">Scout</span>
            </div>
            <span className="text-xs text-purple-200 mb-1">The Talent Finder</span>
            <span className="text-gray-300 text-sm flex-1">Spot the next big things. Essential to win big!</span>
          </div>
        </div>
        <p className="text-gray-500 mt-8 text-xs italic text-center">
          <FaCheckCircle className="inline mr-1 text-emerald-400" />
          Mix roles freely for a unique experience.
        </p>
      </div>
    ),
  },
  {
    key: "links",
    title: "Key Links",
    icon: <FaSearch className="text-blue-400 text-2xl mr-2" />,
    content: (
      <ul className="pl-1 space-y-1 text-gray-200 text-base">
        <li><a href="https://guide.soccerverse.com/english" target="_blank" rel="noopener" className="underline hover:text-sky-300">Complete EN Guide</a></li>
        <li><a href="https://wiki.soccerverse.com/index.php/Main_Page" target="_blank" rel="noopener" className="underline hover:text-sky-300">Soccerverse Wiki (EN)</a></li>
        <li><a href="https://soccerratings.org/players" target="_blank" rel="noopener" className="underline hover:text-sky-300">Live Player Ratings</a></li>
        <li><a href="https://soccerverse.com/soccerverse-litepaper/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Litepaper (Game Vision)</a></li>
        <li><a href="https://www.svfootball.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Player/Club Search</a></li>
        <li><a href="https://hub.soccerverse.com/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Tech Hub & Docs</a></li>
        <li><a href="https://soccerversetool.vercel.app/" target="_blank" rel="noopener" className="underline hover:text-sky-300">Soccerverse Tools</a></li>
        <li><a href="https://elrincondeldt.com/soccerverse-prize-calculator.html" target="_blank" rel="noopener" className="underline hover:text-sky-300">Prize Calculator</a></li>
      </ul>
    ),
  },
  {
    key: "tips",
    title: "Pro Community Tips",
    icon: <FaChartLine className="text-pink-400 text-2xl mr-2" />,
    content: (
      <ul className="list-disc pl-5 text-gray-300 text-base space-y-2">
        <li><b>Rotation</b>: Real fatigue (lose 26–29 fitness per match, recover +7/day). Rotate your squad!</li>
        <li><b>Subs</b>: Max 2 planned, always keep 1 in case of injury.</li>
        <li><b>No injured/suspended players on the bench</b> (risk of random lineup!)</li>
        <li><b>Ratings updated every 6 months</b> (use Transfermarkt & soccerratings).</li>
        <li><b>Salary = OVR</b> (<a href="https://svbase.vercel.app/revenus" target="_blank" rel="noopener" className="underline text-yellow-300">see table</a>), not age!</li>
        <li><b>Transfers</b>: 7 in/out max per season/club, 2 loans.</li>
        <li><b>Bids</b>: First bid starts the auction (5 days), be patient.</li>
        <li><b>Influence</b>: Weekly + end-of-season rewards.</li>
        <li><b>Wallet in game</b>: Free transactions every day.</li>
      </ul>
    ),
  }
];

export default function StartPageEN() {
  const [openSections, setOpenSections] = useState(sections.map((_, idx) => idx === 0));

  const toggleSection = idx => {
    setOpenSections(openSections =>
      openSections.map((open, i) => (i === idx ? !open : open))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white">
      <Navbar />

      {/* Hero section */}
      <section className="relative w-full min-h-[420px] flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 via-gray-900 to-emerald-950 pb-14 pt-8 shadow-2xl">
        <img
          src={LOGO_MASCOTTE}
          alt="Logo"
          className="absolute right-6 top-10 w-28 md:w-40 opacity-20 pointer-events-none select-none hidden md:block"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-500 bg-clip-text text-transparent drop-shadow-lg mb-3 mt-8 text-center">
          SoccerverseBase
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 text-center max-w-2xl">
          Practical guide to start and improve your Soccerverse experience.<br />
          Fast access to resources, info, and the international community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg mt-2">
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none"
          >
            <FaUserPlus className="text-xl" /> Sign up to Soccerverse
          </a>
          <a
            href="https://play.soccerverse.com?ref=klo&pack=https://elrincondeldt.com/sv/rincon_v1.json"
            target="_blank" rel="noopener"
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-7 py-4 text-lg font-bold shadow transition w-full focus:outline-none"
          >
            <FaPuzzlePiece className="text-xl" /> Patch (logos, names)
          </a>
        </div>
      </section>

      {/* Separator */}
      <div className="w-full flex justify-center items-center my-0">
        <div className="h-1 w-1/2 bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 rounded-full opacity-40" />
      </div>

      {/* Discord Community */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-8 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-lg px-6 md:px-10 py-8 md:py-10 border border-emerald-600/20 max-w-3xl mx-auto mt-10 mb-10">
        <FaDiscord className="text-5xl text-sky-400 hidden md:block mr-6" />
        <div className="flex-1 flex flex-col items-center md:items-start">
          <h2 className="text-2xl font-bold mb-2 text-white">K-SOCIOS International Community</h2>
          <p className="text-base text-gray-200 mb-4">
            Place for support, discussion, and sharing info about Soccerverse.<br />
            Join our Discord to ask questions and connect with other players.
          </p>
          <a
            href="https://discord.gg/sd5aa8TW"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center bg-sky-700 hover:bg-sky-900 transition rounded-xl px-7 py-3 text-lg font-semibold shadow gap-2 text-white mb-1"
          >
            <FaDiscord className="text-xl" /> Join K-SOCIOS Discord
          </a>
        </div>
      </section>

      <main className="flex flex-col items-center px-2 sm:px-4 pt-4 pb-12 w-full">
        {/* Accordion sections */}
        <section className="w-full max-w-5xl mb-14 flex flex-col gap-7 mt-6">
          {sections.map((s, idx) => (
            <div key={s.key} className="rounded-2xl shadow-xl border border-gray-700 bg-gradient-to-tr from-gray-900/90 to-gray-800/70">
              <button
                className={`w-full flex items-center justify-between text-left px-7 py-5 focus:outline-none rounded-t-2xl transition
                  ${openSections[idx] ? "bg-gradient-to-r from-sky-950/60 to-emerald-950/50" : "bg-transparent hover:bg-gray-900/40"}`}
                onClick={() => toggleSection(idx)}
                aria-expanded={openSections[idx]}
              >
                <span className="flex items-center text-xl md:text-2xl font-bold">
                  {s.icon}
                  {s.title}
                </span>
                {openSections[idx] ? (
                  <FaChevronUp className="text-sky-300 text-xl" />
                ) : (
                  <FaChevronDown className="text-gray-400 text-xl" />
                )}
              </button>
              {openSections[idx] && (
                <div className="px-7 pb-6 pt-1 transition-all duration-300 text-base">
                  {s.content}
                </div>
              )}
            </div>
          ))}
        </section>
        <footer className="text-center text-gray-500 text-xs py-4 w-full"></footer>
      </main>
    </div>
  );
}
