import type { Metadata } from 'next';
import { StudioShell } from './StudioShell';

export const metadata: Metadata = {
  title: 'Studio',
};

export default function StudioPage() {
  return <StudioShell />;
}
