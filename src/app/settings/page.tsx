"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DEFAULT_COMPANY, PROJECT_TYPES } from "@/lib/defaults";
import { DEFAULT_MSA, DEFAULT_PAYMENT_TERMS } from "@/lib/legal";
import { canLockRates } from "@/lib/permissions";
import { fetchMe, hydrateStudio, loadCompany, persistCompany, setRatesLocked } from "@/lib/storage";
import { formatDateTime } from "@/lib/format";
import type { CompanyProfile, RateCard, SessionUser } from "@/lib/types";

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<SessionUser | null>(null);

  useEffect(() => {
    void (async () => {
      const user = await fetchMe();
      setMe(user);
      await hydrateStudio();
      setCompany(loadCompany());
    })();
  }, []);

  function updateRate(index: number, patch: Partial<RateCard>) {
    setCompany({
      ...company,
      rates: company.rates.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    });
  }

  async function persist() {
    setError(null);
    try {
      const savedCompany = await persistCompany(company);
      setCompany(savedCompany);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  const ratesFrozen = Boolean(company.ratesLocked) && !(me && canLockRates(me.role));

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
            void persist();
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
                disabled={ratesFrozen}
                onChange={(event) => setCompany({ ...company, currency: event.target.value })}
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-sm text-ink-soft">Hours / person / day</span>
              <input
                type="number"
                min={1}
                value={company.hoursPerDay}
                disabled={ratesFrozen}
                onChange={(event) =>
                  setCompany({ ...company, hoursPerDay: Number(event.target.value) })
                }
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="text-sm text-ink-soft">Default contingency %</span>
              <input
                type="number"
                min={0}
                value={company.defaultContingencyPct}
                disabled={ratesFrozen}
                onChange={(event) =>
                  setCompany({
                    ...company,
                    defaultContingencyPct: Number(event.target.value),
                  })
                }
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 disabled:opacity-60"
              />
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Rate card</span>
              <div className="flex items-center gap-3">
                {me && canLockRates(me.role) && (
                  <button
                    type="button"
                    onClick={() =>
                      void setRatesLocked(!company.ratesLocked).then((next) => {
                        if (next) setCompany(next);
                      })
                    }
                    className="text-sm text-forest"
                  >
                    {company.ratesLocked ? "Unlock rates" : "Lock rates"}
                  </button>
                )}
                {!company.ratesLocked && (
                  <button
                    type="button"
                    disabled={ratesFrozen}
                    onClick={() =>
                      setCompany({
                        ...company,
                        rates: [...company.rates, { role: "New role", hourlyRate: 100 }],
                      })
                    }
                    className="text-sm text-forest disabled:opacity-40"
                  >
                    Add role
                  </button>
                )}
              </div>
            </div>
            {company.ratesLocked && (
              <p className="mb-3 text-sm text-ink-soft">
                Finance locked the rate card
                {company.ratesLockedBy ? ` (${company.ratesLockedBy})` : ""}
                {company.ratesLockedAt ? ` ${formatDateTime(company.ratesLockedAt)}` : ""}.
                Sales can still draft against these rates.
              </p>
            )}
            <ul className="space-y-2">
              {company.rates.map((row, index) => (
                <li key={`${row.role}-${index}`} className="grid grid-cols-[1fr_8rem_auto] gap-2">
                  <input
                    value={row.role}
                    disabled={ratesFrozen}
                    onChange={(event) => updateRate(index, { role: event.target.value })}
                    className="rounded-xl border border-rule bg-white/60 px-3 py-2 disabled:opacity-60"
                  />
                  <input
                    type="number"
                    min={0}
                    disabled={ratesFrozen}
                    value={row.hourlyRate}
                    onChange={(event) =>
                      updateRate(index, { hourlyRate: Number(event.target.value) })
                    }
                    className="rounded-xl border border-rule bg-white/60 px-3 py-2 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={ratesFrozen}
                    onClick={() =>
                      setCompany({
                        ...company,
                        rates: company.rates.filter((_, rowIndex) => rowIndex !== index),
                      })
                    }
                    className="rounded-xl px-3 text-sm text-ink-soft hover:text-copper disabled:opacity-40"
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

          <div>
            <p className="text-sm text-ink-soft">Brand and legal</p>
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              Logo, letterhead, payment terms, and the MSA template fill branded PDFs and Word
              exports. Placeholders: {"{{clientName}}"}, {"{{projectTitle}}"}, {"{{vendorLegal}}"}, {"{{date}}"}, {"{{total}}"}, {"{{hours}}"}, {"{{address}}"}, {"{{paymentTerms}}"}.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-ink-soft">Legal name</span>
                <input
                  value={company.legalName ?? ""}
                  onChange={(event) =>
                    setCompany({ ...company, legalName: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
                  placeholder={company.name}
                />
              </label>
              <label className="block">
                <span className="text-sm text-ink-soft">Address / notices</span>
                <input
                  value={company.address ?? ""}
                  onChange={(event) => setCompany({ ...company, address: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-sm text-ink-soft">Logo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="mt-1 block w-full text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  if (file.size > 700_000) {
                    window.alert("Keep the logo under 700KB (PNG or JPEG).");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === "string" ? reader.result : "";
                    setCompany({ ...company, logoDataUrl: result });
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {company.logoDataUrl && (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={company.logoDataUrl}
                    alt="Studio logo"
                    className="h-10 max-w-[10rem] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setCompany({ ...company, logoDataUrl: "" })}
                    className="text-sm text-ink-soft hover:text-copper"
                  >
                    Remove
                  </button>
                </div>
              )}
            </label>
            <label className="mt-4 block">
              <span className="text-sm text-ink-soft">Payment terms</span>
              <textarea
                rows={3}
                value={company.paymentTerms ?? DEFAULT_PAYMENT_TERMS}
                onChange={(event) =>
                  setCompany({ ...company, paymentTerms: event.target.value })
                }
                placeholder="40% kickoff, 40% UAT, 20% go-live. Net 15."
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 leading-relaxed"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm text-ink-soft">MSA / legal terms template</span>
              <textarea
                rows={12}
                value={company.msaTemplate ?? DEFAULT_MSA}
                onChange={(event) =>
                  setCompany({ ...company, msaTemplate: event.target.value })
                }
                placeholder="Leave blank to use the Northline template. Placeholders fill on export."
                className="mt-1 w-full rounded-xl border border-rule bg-white/60 px-3 py-2 font-mono text-xs leading-5"
              />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-forest px-5 py-2.5 text-sm text-paper"
            >
              Save profile
            </button>
            {saved && <span className="text-sm text-moss">Saved to shared studio memory.</span>}
            {error && <span className="text-sm text-copper">{error}</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
