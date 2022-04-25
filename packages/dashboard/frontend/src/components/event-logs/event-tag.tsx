import React from 'react';
import styles from './event-tag.module.scss';
import { EventTagProps } from './types';
import { PropsWithChildren } from '../../types';

export function EventTag({ evt, onClick, active }: PropsWithChildren<EventTagProps>) {
  return (
    <label className={styles.eventTag} key={evt}>
      <input type="checkbox" id={evt} onChange={onClick} checked={active} className={styles.input} />
      <div className={styles.title}>{evt}</div>
    </label>
  );
}
