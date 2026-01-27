"use client";

import React from "react";
import { Globe, Mail, Phone } from "lucide-react";
import { NexgeglLogo } from "./Logo";
import { Dictionary } from "../../../dictionaries/types";
import Link from "next/link";

export default function Footer({
  lang,
  dict,
}: {
  lang: "en" | "ar";
  dict: Dictionary;
}) {
  const f = dict.Landing.footer;

  return (
    <footer className="bg-navy-950 pt-24 pb-12 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-6">
        {/* ================= Top Grid ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* ================= Brand ================= */}
          <div className="animate-fade-in-up">
            <div className="mb-8">
              <NexgeglLogo className="h-8" />
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-8 font-light">
              {f.brandDescription}
            </p>
          </div>

          {/* ================= Contact ================= */}
          {f.contact && (
            <div className="animate-fade-in-up delay-100">
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">
                {f.contact.title}
              </h4>

              <ul className="space-y-6 text-gray-400 text-sm">
                <li className="flex items-start gap-4">
                  <Mail className="text-gold-500 w-5 h-5 mt-0.5" />
                  <a
                    href={`mailto:${f.contact.email}`}
                    className="hover:text-white transition-colors"
                  >
                    {f.contact.email}
                  </a>
                </li>

                <li className="flex items-start gap-4">
                  <Globe className="text-gold-500 w-5 h-5 mt-0.5" />
                  <a
                    href={f.contact.website}
                    className="hover:text-white transition-colors"
                  >
                    {f.contact.websiteLabel}
                  </a>
                </li>

                <li className="flex items-start gap-4">
                  <Phone className="text-gold-500 w-5 h-5 mt-0.5" />
                  <span>{f.contact.phone}</span>
                </li>
              </ul>
            </div>
          )}

          {/* ================= Platform ================= */}
          {f.platform && (
            <div className="animate-fade-in-up delay-200">
              <h4 className="text-white font-bold mb-8 uppercase tracking-widest text-sm">
                {f.platform.title}
              </h4>

              <ul className="space-y-4 text-gray-400 text-sm">
                {f.platform.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="hover:text-gold-400 transition-colors flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-gold-500 rounded-full" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ================= Media License ================= */}
          {f.mediaLicense && (
            <div className="animate-fade-in-up delay-300">
              <p className="text-gray-400 text-sm leading-relaxed">
                {f.mediaLicense}
              </p>
            </div>
          )}
        </div>

        {/* ================= Bottom ================= */}
        <div
          className="
            pt-8 border-t border-navy-800
            flex flex-col md:flex-row
            justify-between items-center gap-4
            text-xs text-gray-500 uppercase tracking-wider
            animate-fade-in-up delay-500
          "
        >
          <p>
            © {new Date().getFullYear()} {f.bottom.rights}
          </p>

          <div className="flex gap-8">
            <Link
              href={`/${lang}/privacy-policy`}
              className="hover:text-white transition-colors"
            >
              {f.bottom.privacy}
            </Link>

            {f.bottom.terms && (
              <span className="hover:text-white cursor-pointer transition-colors">
                {f.bottom.terms}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
