"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DEFAULT_COMPANY, PROJECT_TYPES } from "@/lib/defaults";
import { loadCompany, saveCompany } from "@/lib/storage";
import type { CompanyProfile, RateCard } from "@/lib/types";

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCompany(loadCompany());
  }, []);

  function updateRate(index: number, patch: Partial<RateCard>) {
    setCompany({
      ...company,
      rates: company.rates.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    });
  }

  function persist() {
    saveCompany(company);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-moss">Studio profile</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight">How you bid</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-soft">
          The agent uses this profile so estimates, stack, and positioning match your software
          house instead of a generic consultancy.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            persist();
          }}
        >
          <label className="block">
            <span className="text-sm text-ink-soft">Company name</span>
            <input
              value={company.name}
              onChange={(event) => setCompany({ ...company, name: event.target.value })}
              className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">Tagline</span>
            <input
              value={company.tagline}
              onChange={(event) => setCompany({ ...company, tagline: event.target.value })}
              className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">Differentiators</span>
            <textarea
              rows={4}
              value={company.differentiators}
              onChange={(event) =>
                setCompany({ ...company, differentiators: event.target.value })
              }
              className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 leading-relaxed"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">Delivery stack</span>
            <textarea
              rows={3}
              value={company.techStack}
              onChange={(event) => setCompany({ ...company, techStack: event.target.value })}
              className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 leading-relaxed"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm text-ink-soft">Currency</span>
              <input
                value={company.currency}
                onChange={(event) => setCompany({ ...company, currency: event.target.value })}
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-ink-soft">Hours / person / day</span>
              <input
                type="number"
                min={1}
                value={company.hoursPerDay}
                onChange={(event) =>
                  setCompany({ ...company, hoursPerDay: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-ink-soft">Default contingency %</span>
              <input
                type="number"
                min={0}
                value={company.defaultContingencyPct}
                onChange={(event) =>
                  setCompany({
                    ...company,
                    defaultContingencyPct: Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Rate card</span>
              <button
                type="button"
                onClick={() =>
                  setCompany({
                    ...company,
                    rates: [...company.rates, { role: "New role", hourlyRate: 100 }],
                  })
                }
                className="text-sm text-forest"
              >
                Add role
              </button>
            </div>
            <ul className="space-y-2">
              {company.rates.map((row, index) => (
                <li key={`${row.role}-${index}`} className="grid grid-cols-[1fr_8rem_auto] gap-2">
                  <input
                    value={row.role}
                    onChange={(event) => updateRate(index, { role: event.target.value })}
                    className="rounded-xl border border-rule bg-white/60 px-3 py-2"
                  />
                  <input
                    type="number"
                    min={0}
                    value={row.hourlyRate}
                    onChange={(event) =>
                      updateRate(index, { hourlyRate: Number(event.target.value) })
                    }
                    className="rounded-xl border border-rule bg-white/60 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCompany({
                        ...company,
                        rates: company.rates.filter((_, rowIndex) => rowIndex !== index),
                      })
                    }
                    className="rounded-xl px-3 text-sm text-ink-soft hover:text-copper"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-ink-soft">Rate presets by project type</p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              Generate uses your rate card, then layers specialist roles for the type you pick. Edit the
              base card here; extra roles inherit from the senior engineer rate.
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {PROJECT_TYPES.map((item) => (
                <li key={item.id} className="rounded-2xl border border-rule bg-white/50 px-4 py-3">
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">{item.mix}</p>
                  {item.extraRoles.length > 0 && (
                    <p className="mt-2 text-xs text-moss">
                      Adds {item.extraRoles.map((role) => role.role).join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-forest px-5 py-2.5 text-sm text-paper"
            >
              Save profile
            </button>
            {saved && <span className="text-sm text-moss">Saved in this browser.</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
