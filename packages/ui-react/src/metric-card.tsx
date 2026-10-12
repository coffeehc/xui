import * as React from 'react';
import {Surface} from './feedback.js';
import {cx} from './shared.js';

export type MetricCardProps=Omit<React.ComponentProps<typeof Surface>,'children'> & {
  /** Host-owned metric name. Use inline content with a readable text label. */
  label:React.ReactNode;
  /** Already prepared display content; zero is a value, not an empty state. */
  value:React.ReactNode;
  /** Optional inline end marker. Its meaning, color and accessibility belong to the host. */
  marker?:React.ReactNode;
};

/** One passive metric. Arrangement, formatting, loading and business semantics stay with the host. */
export function MetricCard({label,value,marker,className,...props}:MetricCardProps){
  return <Surface {...props} className={cx('xui-metric-card',className)}>
    <dl className="xui-metric-card-content">
      <dt className="xui-metric-card-header">
        <span className="xui-metric-card-label">{label}</span>
        {marker!==undefined&&marker!==null&&typeof marker!=='boolean'&&marker!==''&&<span className="xui-metric-card-marker">{marker}</span>}
      </dt>
      <dd className="xui-metric-card-value">{value}</dd>
    </dl>
  </Surface>;
}
