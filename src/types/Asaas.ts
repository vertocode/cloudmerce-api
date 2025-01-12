export interface Discount {
  value: number
  dueDateLimitDays: number | null
  type: string
}

export interface Fine {
  value: number
}

export interface Interest {
  value: number
}

export interface CreditCard {
  creditCardNumber: string
  creditCardBrand: string
  creditCardToken: string | null
}

export interface Split {
  id: string
  walletId: string
  fixedValue: number | null
  percentualValue: number | null
  totalValue: number | null
  cancellationReason: string | null
  status: string
  externalReference: string | null
  description: string | null
}

export interface Chargeback {
  id: string
  payment: string
  installment: string | null
  customerAccount: string
  status: string
  reason: string
  disputeStartDate: string
  value: number
  paymentDate: string
  creditCard: {
    number: string
    brand: string
  }
  disputeStatus: string
  deadlineToSendDisputeDocuments: string
}

export interface RefundedSplit {
  id: string
  value: number
  done: boolean
}

export interface Refund {
  dateCreated: string
  status: string
  value: number
  endToEndIdentifier: string | null
  description: string | null
  effectiveDate: string
  transactionReceiptUrl: string | null
  refundedSplits: RefundedSplit[]
}

export interface Billing {
  object: string
  id: string
  dateCreated: string
  customer: string
  subscription: string | null
  installment: string | null
  paymentLink: string | null
  value: number
  netValue: number
  originalValue: number | null
  interestValue: number | null
  description: string
  billingType: string
  creditCard: CreditCard | null
  canBePaidAfterDueDate: boolean
  pixTransaction: string | null
  pixQrCodeId: string | null
  status: string
  dueDate: string
  originalDueDate: string | null
  paymentDate: string | null
  clientPaymentDate: string | null
  installmentNumber: number | null
  invoiceUrl: string | null
  invoiceNumber: string | null
  externalReference: string | null
  deleted: boolean
  anticipated: boolean
  anticipable: boolean
  creditDate: string
  estimatedCreditDate: string | null
  transactionReceiptUrl: string | null
  nossoNumero: string
  bankSlipUrl: string | null
  discount: Discount | null
  fine: Fine | null
  interest: Interest | null
  split: Split[]
  postalService: boolean
  daysAfterDueDateToRegistrationCancellation: number | null
  chargeback: Chargeback | null
  refunds: Refund[]
}

export interface PixQRCode {
  encodedImage: string
  payload: string
  expirationDate: string
}
