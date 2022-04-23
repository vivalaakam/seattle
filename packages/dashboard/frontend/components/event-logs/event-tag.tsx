import React from 'react';
import styles from './event-tag.module.scss';
import { EventTagProps } from './types';

export const EventTag = ({ evt, onClick, active }: EventTagProps) => {
  return (
    <label className={styles.eventTag} key={evt}>
      <input type="checkbox" id={evt} onChange={onClick} checked={active} className={styles.input} />
      <div className={styles.title}>{evt}</div>
    </label>
  );
};
