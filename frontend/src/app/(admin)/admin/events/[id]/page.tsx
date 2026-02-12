'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, formatDate, formatCurrency } from '@/lib/utils';

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEvent = () => {
    setLoading(true);
    api.get(`/admin/events/${id}`)
      .then((res) => {
        const data = extractData(res);
        setEvent(data);
        setEditName((data as any).name);
        setEditDescription((data as any).description || '');
        setEditStatus((data as any).status);
      })
      .catch(() => toast('행사를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvent(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/events/${id}`, { name: editName, description: editDescription, status: editStatus });
      toast('행사 정보가 수정되었습니다.', 'success');
      setEditModal(false);
      fetchEvent();
    } catch {
      toast('수정에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/events/${id}`);
      toast('행사가 삭제되었습니다.', 'success');
      router.push('/admin/events');
    } catch {
      toast('삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="행사 상세" backHref="/admin/events" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <PageHeader title="행사 상세" backHref="/admin/events" />
        <Card><p className="text-center text-gray-500 py-8">행사를 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={event.name}
        backHref="/admin/events"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditModal(true)}>수정</Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteModal(true)}>삭제</Button>
          </div>
        }
      />

      {/* Event Info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">행사 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">상태</p>
            <Badge status={event.status} />
          </div>
          <div>
            <p className="text-xs text-gray-400">주관사</p>
            <p className="text-sm font-medium">{event.organizer?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">기간</p>
            <p className="text-sm font-medium">{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">장소</p>
            <p className="text-sm font-medium">{event.venue || '-'}</p>
          </div>
          {event.description && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-400">설명</p>
              <p className="text-sm text-gray-700">{event.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">초대코드</p>
            <p className="text-sm font-mono font-bold">{event.inviteCode}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">수수료율</p>
            <p className="text-sm font-medium">{event.commissionRate}%</p>
          </div>
        </div>
      </Card>

      {/* Partners */}
      {event.partners && event.partners.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">참여 협력업체 ({event.partners.length})</h3>
          <div className="divide-y divide-gray-50">
            {event.partners.map((ep: any) => (
              <div key={ep.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ep.partner?.name || '-'}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(ep.createdAt)}</p>
                </div>
                <Badge status={ep.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contracts */}
      {event.contracts && event.contracts.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 목록 ({event.contracts.length})</h3>
          <div className="divide-y divide-gray-50">
            {event.contracts.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                onClick={() => router.push(`/admin/contracts/${c.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 font-mono">{c.contractNumber}</p>
                  <p className="text-xs text-gray-400">{c.customer?.name || '미지정'} / {c.partner?.name || '-'}</p>
                </div>
                <div className="text-right">
                  <Badge status={c.status} />
                  {c.totalAmount && (
                    <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(c.totalAmount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="행사 수정">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">행사명</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">설명</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">상태</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">초안</option>
              <option value="active">진행중</option>
              <option value="closed">종료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditModal(false)}>취소</Button>
            <Button onClick={handleSave} loading={saving}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="행사 삭제 확인">
        <p className="text-sm text-gray-600 mb-4">
          정말로 <strong>{event.name}</strong> 행사를 삭제하시겠습니까?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteModal(false)}>취소</Button>
          <Button variant="danger" onClick={handleDelete}>삭제</Button>
        </div>
      </Modal>
    </div>
  );
}
