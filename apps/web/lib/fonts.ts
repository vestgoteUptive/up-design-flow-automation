import { Fraunces } from 'next/font/google'
import { Fragment_Mono } from 'next/font/google'

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
})

export const fragmentMono = Fragment_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fragment-mono',
  weight: ['400'],
})
