'use client';
import { useParams } from 'next/navigation';
import IcConfigManager from '@/components/integrated-contract/IcConfigManager';

export default function AdminIcConfigPage() {
  const { id: eventId } = useParams<{ id: string }>();

  return (
    <IcConfigManager
      eventId={eventId}
      backHref={`/admin/events/${eventId}`}
    />
  );
}
