import React from 'react';
import { type RiskLevel } from '../data/mockScans';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const config = {
    LOW: {
      label: 'Rủi ro thấp',
      stroke: 'stroke-[#16A34A] dark:stroke-[#4ADE80]',
      text: 'text-[#16A34A] dark:text-[#4ADE80]',
    },
    MEDIUM: {
      label: 'Cần thận trọng',
      stroke: 'stroke-amber-500',
      text: 'text-amber-500',
    },
    HIGH: {
      label: 'Nguy cơ lừa đảo cao',
      stroke: 'stroke-[#DC2626] dark:stroke-red-400',
      text: 'text-[#DC2626] dark:text-red-400',
    },
  }[level];

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            fill="transparent"
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className={`${config.stroke} transition-all duration-700`}
          />
        </svg>
        <span className={`absolute text-3xl font-bold ${config.text}`}>
          {score}/100
        </span>
      </div>

      <p className={`mt-3 font-semibold text-base ${config.text}`}>{config.label}</p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
        Điểm rủi ro ước tính
      </p>
      <p className="text-[11px] text-slate-400 mt-2">
        0–29 Thấp · 30–69 Vừa · 70–100 Cao
      </p>
      <p className="text-[11px] text-center text-slate-400 mt-2 max-w-[240px]">
        Ước tính mô hình, không phải xác suất được hiệu chuẩn hoặc kết luận kiểm chứng.
      </p>
    </div>
  );
};