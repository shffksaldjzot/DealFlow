'use client';
import type { IcContract, IcContractFlow } from '@/types/integrated-contract';
import { formatDateTime } from '@/lib/utils';

interface IcContractPrintViewProps {
  contract: IcContract;
  flow?: IcContractFlow | null;
  partnerFilter?: string;
}

export default function IcContractPrintView({ contract, flow, partnerFilter }: IcContractPrintViewProps) {
  const totalAmount = Number(contract.totalAmount) || 0;

  // Build set of selected rowIds for quick lookup
  const selectedRowIds = new Set(contract.selectedItems.map(si => si.rowId));
  const selectedMap = new Map(contract.selectedItems.map(si => [si.rowId, si]));

  const items = partnerFilter
    ? contract.selectedItems.filter((item) => item.partnerName === partnerFilter)
    : contract.selectedItems;

  const filteredTotal = items.reduce((sum, item) => sum + Number(item.unitPrice), 0);

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
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>동호수</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.unitNumber || '-'}</td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>평형</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.apartmentType?.name || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>서명일</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.signedAt ? formatDateTime(contract.signedAt) : '-'}</td>
            <td style={{ padding: '6px 12px', background: '#f5f5f5', border: '1px solid #ddd', fontWeight: 600 }}>행사</td>
            <td style={{ padding: '6px 12px', border: '1px solid #ddd' }}>{contract.config?.event?.name || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* Contract Items */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>
        계약 사항 {partnerFilter && <span style={{ fontSize: '12px', fontWeight: 400, color: '#666' }}>({partnerFilter})</span>}
      </h3>

      {flow && !partnerFilter ? (
        // Full flow: show ALL options with checkmarks for selected ones
        flow.partners.map((partner) =>
          partner.categories.map((cat) => {
            const typeCol = contract.apartmentType?.id
              ? cat.columns.find((c: any) => c.apartmentTypeId === contract.apartmentType?.id)
              : null;

            const parsePrice = (val: any): number => {
              if (val === undefined || val === null || val === '') return 0;
              if (typeof val === 'number') return val;
              return Number(String(val).replace(/,/g, '')) || 0;
            };

            return (
              <div key={cat.sheetId} style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{partner.partnerItems || cat.categoryName}</p>
                <p style={{ fontSize: '10px', color: '#999', marginBottom: '6px' }}>{partner.partnerName}</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    {cat.options.map((opt: any) => {
                      const isSelected = selectedRowIds.has(opt.rowId);
                      const selectedItem = selectedMap.get(opt.rowId);

                      let price = 0;
                      if (isSelected && selectedItem) {
                        price = Number(selectedItem.unitPrice) || 0;
                      } else if (typeCol) {
                        price = parsePrice(opt.cellValues?.[typeCol.id]) || parsePrice(opt.prices?.[typeCol.id]);
                      }
                      if (price === 0) {
                        const amtCols = cat.columns.filter((c: any) => c.columnType === 'amount' || !c.columnType);
                        for (const col of amtCols) {
                          const p = parsePrice(opt.cellValues?.[col.id]) || parsePrice(opt.prices?.[col.id]);
                          if (p > 0) { price = p; break; }
                        }
                      }

                      return (
                        <tr key={opt.rowId} style={{ background: '#fff' }}>
                          <td style={{ padding: '4px 8px', border: '1px solid #ddd', width: '24px', textAlign: 'center' }}>
                            {isSelected ? '✓' : ''}
                          </td>
                          <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#111' : '#999' }}>
                            {opt.optionName}
                          </td>
                          <td style={{ padding: '4px 8px', border: '1px solid #ddd', textAlign: 'right', width: '100px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#111' : '#999' }}>
                            {price > 0 ? `${price.toLocaleString()}원` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )
      ) : (
        // Fallback: show only selected items (or partner-filtered)
        (() => {
          const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
            const key = `${item.partnerName} - ${item.categoryName}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {});

          return (
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
                      <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'right' }}>{Number(item.unitPrice).toLocaleString()}원</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          );
        })()
      )}

      {/* Total */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
        <tfoot>
          <tr style={{ background: '#f9f9f9', fontWeight: 700 }}>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
              {partnerFilter ? '소계' : '총 계약금액'}
            </td>
            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', width: '120px', fontSize: '14px' }}>
              {(partnerFilter ? filteredTotal : totalAmount).toLocaleString()}원
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
                  <td style={{ padding: '5px 8px', border: '1px solid #ddd', textAlign: 'right' }}>{Number(stage.amount).toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Legal Terms (약관) */}
      {contract.config?.legalTerms?.trim() && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>약관</h3>
          <p style={{ fontSize: '11px', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#444' }}>{contract.config.legalTerms}</p>
          {contract.legalAgreed && (
            <p style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px' }}>✓ 약관에 동의함</p>
          )}
        </div>
      )}

      {/* Special Terms from config (특약사항) */}
      {contract.config?.specialNotes?.trim() && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>특약사항</h3>
          <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{contract.config.specialNotes}</p>
        </div>
      )}

      {/* Special Notes from contract (특이사항/비고) */}
      {contract.specialNotes?.trim() && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>특이사항 (비고)</h3>
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
