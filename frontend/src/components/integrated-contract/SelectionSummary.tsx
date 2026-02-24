'use client';
import type { IcSelectedItem, PaymentStage } from '@/types/integrated-contract';

interface SelectionSummaryProps {
  items: IcSelectedItem[];
  paymentStages: PaymentStage[];
}

export default function SelectionSummary({
  items,
  paymentStages,
}: SelectionSummaryProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.unitPrice, 0);

  // Calculate payment schedule
  const schedule = paymentStages.length > 0
    ? (() => {
        const sched = paymentStages.map((stage) => ({
          name: stage.name,
          ratio: stage.ratio,
          amount: Math.round((totalAmount * stage.ratio) / 100),
        }));
        const diff = totalAmount - sched.reduce((s, x) => s + x.amount, 0);
        if (diff !== 0 && sched.length > 0) {
          sched[sched.length - 1].amount += diff;
        }
        return sched;
      })()
    : [{ name: '일시불', ratio: 100, amount: totalAmount }];

  // Group by category
  const grouped = items.reduce<Record<string, IcSelectedItem[]>>((acc, item) => {
    const key = `${item.partnerName} - ${item.categoryName}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Selected Items */}
      <div>
        <h4 className="text-sm font-bold text-gray-500 mb-2">선택 내역</h4>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">선택된 품목이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group}>
                <p className="text-xs text-gray-400 mb-1">{group}</p>
                {groupItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{item.optionName}</span>
                    <span className="text-sm font-medium text-gray-800">
                      {item.unitPrice ? `${item.unitPrice.toLocaleString()}원` : '무료'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800">총액</span>
          <span className="text-xl font-bold text-blue-600">
            {totalAmount.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* Payment Schedule */}
      {items.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <h4 className="text-sm font-bold text-gray-500">결제 스케줄</h4>
          {schedule.map((stage, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {stage.name || `${i + 1}차`} ({stage.ratio}%)
              </span>
              <span className="text-sm font-medium text-gray-800">
                {stage.amount.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
