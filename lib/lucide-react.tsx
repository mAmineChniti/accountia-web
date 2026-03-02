import * as React from 'react';

export type LucideProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

function createIcon(name: string) {
  return React.forwardRef<SVGSVGElement, LucideProps>(function Icon(
    { size = 24, className, ...props },
    ref
  ) {
    return (
      <svg
        ref={ref}
        aria-hidden="true"
        className={className}
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <title>{name}</title>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  });
}

export const AlertCircle = createIcon('AlertCircle');
export const ArrowRight = createIcon('ArrowRight');
export const BarChart3 = createIcon('BarChart3');
export const Bot = createIcon('Bot');
export const Calculator = createIcon('Calculator');
export const CalendarIcon = createIcon('CalendarIcon');
export const CheckCircle = createIcon('CheckCircle');
export const CheckIcon = createIcon('CheckIcon');
export const ChevronDownIcon = createIcon('ChevronDownIcon');
export const ChevronRightIcon = createIcon('ChevronRightIcon');
export const CircleIcon = createIcon('CircleIcon');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const FileText = createIcon('FileText');
export const Ghost = createIcon('Ghost');
export const Globe = createIcon('Globe');
export const HelpCircle = createIcon('HelpCircle');
export const Info = createIcon('Info');
export const MinusIcon = createIcon('MinusIcon');
export const Moon = createIcon('Moon');
export const PanelLeftIcon = createIcon('PanelLeftIcon');
export const Pencil = createIcon('Pencil');
export const PieChart = createIcon('PieChart');
export const Save = createIcon('Save');
export const Shield = createIcon('Shield');
export const Sun = createIcon('Sun');
export const Trash2 = createIcon('Trash2');
export const X = createIcon('X');
export const XIcon = createIcon('XIcon');
export const Zap = createIcon('Zap');
export const ChevronLeftIcon = createIcon('ChevronLeftIcon');
export const CircleCheckIcon = createIcon('CircleCheckIcon');
export const InfoIcon = createIcon('InfoIcon');
export const Loader2Icon = createIcon('Loader2Icon');
export const OctagonXIcon = createIcon('OctagonXIcon');
export const TriangleAlertIcon = createIcon('TriangleAlertIcon');
