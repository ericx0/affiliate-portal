import { useMemo } from "react";
import { useLocale } from "next-intl";

/**
 * Locale-aware formatting helpers.
 *
 * All money in the system is USD (Stripe is the only processor) and stored
 * as integer cents. These helpers take the cents value directly and
 * handle /100 internally so callers can't forget.
 *
 * Date helpers accept string | number | Date — DB columns are ISO strings,
 * but components often pass new Date(x) results; we coerce uniformly.
 */

type DateInput = string | number | Date;

const toDate = (input: DateInput): Date =>
  input instanceof Date ? input : new Date(input);

// Currency hardcoded to USD — single-currency product today. Add a
// second arg if/when non-USD tiers arrive. ponytail: 1 currency = OK.
export function formatCurrency(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(input: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(locale).format(toDate(input));
}

export function formatDateTime(input: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(toDate(input));
}

/**
 * React hook returning the formatters bound to the current next-intl locale.
 * Use inside client components; for server components, pass locale explicitly
 * via getLocale() from next-intl/server.
 */
export function useFormat() {
  const locale = useLocale();
  return useMemo(
    () => ({
      currency: (cents: number) => formatCurrency(cents, locale),
      number: (value: number) => formatNumber(value, locale),
      date: (input: DateInput) => formatDate(input, locale),
      dateTime: (input: DateInput) => formatDateTime(input, locale),
    }),
    [locale],
  );
}