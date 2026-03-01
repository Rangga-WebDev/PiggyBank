/** @format */

import { TxType } from "@prisma/client";

export function signedAmount(type: TxType, amount: number) {
  switch (type) {
    case "INCOME":
    case "TRANSFER":
      return amount;
    case "EXPENSE":
    case "WITHDRAW":
      return -amount;
    default:
      return amount;
  }
}
