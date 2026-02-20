'use client';
import type { IcContract } from '@/types/integrated-contract';
import { formatDateTime } from '@/lib/utils';

interface IcContractPrintViewProps {
  contract: IcContract;
  partnerFilter?: string;
}

export default function IcContractPrintView({ contract, partnerFilter }: IcContractPrintViewProps) {
  const items = partnerFilter
    ? contract.selectedItems.filter((item) => item.partnerName === partnerFilter)
    : contract.selectedItems;

  // Group by partner > category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = `${item.partnerName} - ${item.categoryName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const filteredTotal = items.reduce((sum, item) => sum + item.unitPrice, 0);

  return (
    <div className="ic-print-container">
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>통합 계약서</h1>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
          계약번호: {contract.shortCode}
        </p>
      </div>

      {/* Customer Info */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600, width: '20%' }}>고객명</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd', width: '30%' }}>{contract.customerName || '-'}</td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600, width: '20%' }}>연락처</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd', width: '30%' }}>{contract.customerPhone || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>평형</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.apartmentType?.name || '-'}</td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>서명일</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.signedAt ? formatDateTime(contract.signedAt) : '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>행사</td>
            <td colSpan={3} style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.config?.event?.name || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Selected Items */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
        선택 내역 {partnerFilter && <span style={{ fontSize: '12px', fontWeight: 400, color: '#666' }}>({partnerFilter})</span>}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>파트너</th>
            <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>카테고리</th>
            <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>옵션</th>
            <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600 }}>금액</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([group, groupItems]) =>
            groupItems.map((item, idx) => (
              <tr key={`${group}-${idx}`}>
                {idx === 0 ? (
                  <>
                    <td rowSpan={groupItems.length} style={{ padding: '5px 8px', border: '1px solid #ddd', verticalAlign: 'top' }}>{item.partnerName}</td>
                    <td rowSpan={groupItems.length} style={{ padding: '5px 8px', border: '1px solid #ddd', verticalAlign: 'top' }}>{item.categoryName}</td>
                  </>
                ) : null}
                <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{item.optionName}</td>
                <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'right' }}>{item.unitPrice.toLocaleString()}원</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f9f9f9', fontWeight: 700 }}>
            <td colSpan={3} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
              {partnerFilter ? '소계' : '총 계약금액'}
            </td>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontSize: '14px' }}>
              {(partnerFilter ? filteredTotal : contract.totalAmount).toLocaleString()}원
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Payment Schedule */}
      {!partnerFilter && contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
        <>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>납부 일정</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 600 }}>구분</th>
                <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600 }}>비율</th>
                <th style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 600 }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {contract.paymentSchedule.map((stage, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd' }}>{stage.name}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'right' }}>{stage.ratio}%</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'right' }}>{stage.amount.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Special Notes */}
      {contract.specialNotes && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>특이사항</h3>
          <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{contract.specialNotes}</p>
        </div>
      )}

      {/* Signature */}
      {contract.signatureData && (
        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>서명</p>
          <img
            src={contract.signatureData}
            alt="고객 서명"
            style={{ height: '60px', border: '1px solid #ddd', borderRadius: '4px', display: 'inline-block' }}
          />
          <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {contract.customerName || '고객'} (서명)
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '10px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
        본 계약서는 전자서명을 통해 체결되었습니다. · 계약번호: {contract.shortCode}
      </div>
    </div>
  );
}
