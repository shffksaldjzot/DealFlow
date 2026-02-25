'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizerDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/organizer/events');
  }, [router]);

  return null;
}
