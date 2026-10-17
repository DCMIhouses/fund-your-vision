// Fill these in to publish payment details. Anything here is public on the live site.
export const PAY = {
  payee: 'NationwideBusinessFunding.com',
  purpose: '',
  receiptEmail: '',
  zelle: { name: '', contact: '' },
  wire: { bankName: '', accountName: '', routing: '', account: '', bankAddress: '', swift: '' },
}

export const SOON = 'Details coming soon'
export const ready = (obj) => Object.entries(obj).filter(([k]) => k !== 'swift').every(([, v]) => !!String(v).trim())
