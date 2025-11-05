import { Metadata } from 'next';

// Admin pages should not be indexed by search engines
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};
