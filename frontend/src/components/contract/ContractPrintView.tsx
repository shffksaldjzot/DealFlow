'use client';
import type { Contract } from '@/types/contract';
import { formatDateTime, formatCurrency } from '@/lib/utils';

interface ContractPrintViewProps {
  contract: Contract;
}

export default function ContractPrintView({ contract }: ContractPrintViewProps) {
  const signatureData = contract.signatures?.[0]?.signatureData;

  // Build field value map with labels
  const fieldEntries = (contract.fieldValues || []).map((fv) => {
    const fieldDef = contract.template?.fields?.find((f) => f.id === (fv.fieldId || fv.field?.id));
    const label = fieldDef?.label || fv.field?.label || '항목';
    const fieldType = fieldDef?.fieldType || fv.field?.fieldType;
    let displayValue = fv.value;

    if (fieldType === 'checkbox') {
      displayValue = fv.value === 'true' ? '✓' : '';
    } else if ((fieldType === 'number' || fieldType === 'amount') && !isNaN(Number(fv.value))) {
      displayValue = Number(fv.value).toLocaleString('ko-KR');
      if (fieldType === 'amount') displayValue += '원';
    }

    return { label, value: displayValue, fieldType };
  });

  return (
    <div className="contract-print-container">
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>계약서</h1>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
          계약번호: {contract.contractNumber}
        </p>
      </div>

      {/* Contract Info Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600, width: '20%' }}>행사명</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd', width: '30%' }}>{contract.event?.name || '-'}</td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600, width: '20%' }}>협력업체</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd', width: '30%' }}>{contract.partner?.name || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>고객명</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>
              {contract.customer ? `${contract.customer.name}` : contract.customerName || '-'}
            </td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>계약금액</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd', fontWeight: 700 }}>
              {contract.totalAmount ? formatCurrency(contract.totalAmount) : '-'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>생성일</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{formatDateTime(contract.createdAt)}</td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>서명일</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.signedAt ? formatDateTime(contract.signedAt) : '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Field Values */}
      {fieldEntries.length > 0 && (
        <>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
            입력 내용
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
            <tbody>
              {fieldEntries.map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '5px 10px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600, width: '30%' }}>
                    {entry.label}
                  </td>
                  <td style={{ padding: '5px 10px', border: '1px solid #ddd' }}>
                    {entry.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Signature */}
      {signatureData && (
        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>서명</p>
          <img
            src={signatureData}
            alt="고객 서명"
            style={{ height: '60px', border: '1px solid #ddd', borderRadius: '4px', display: 'inline-block' }}
          />
          <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {contract.customer?.name || contract.customerName || '고객'} (서명)
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '10px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
        본 계약서는 전자서명을 통해 체결되었습니다. · 계약번호: {contract.contractNumber}
      </div>
    </div>
  );
}
