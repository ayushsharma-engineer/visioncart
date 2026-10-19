import { config } from "./config";
import { formatMoney } from "./core/money";

/** Money formatted with the configured currency/locale. */
export const money = (amount: number) =>
  formatMoney(amount, { currency: config.currency, locale: config.locale });
