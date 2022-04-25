import React, { useState } from 'react';
import styles from './event-log.module.scss';
import { LogProps } from './types';

export function EventLog({ event }: LogProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(data => !data);

  return (
    <>
      <tr className={styles.log} onClick={toggleExpanded}>
        <td className={styles.date}>{new Date(event.date).toLocaleString('ru-Ru', { timeZone: 'UTC' })}</td>
        <td className={styles.requestId}>{event.requestId}</td>
        <td className={styles.type}>{event.type}</td>
        <td>{event.event}</td>
        <td>{event.message}</td>
      </tr>
      {expanded && (
        <tr className={styles.extended}>
          <td colSpan={5}>
            {event.data && <pre>{JSON.stringify(event.data)}</pre>}
            {!event.data && 'no data'}
          </td>
        </tr>
      )}
    </>
  );
}
