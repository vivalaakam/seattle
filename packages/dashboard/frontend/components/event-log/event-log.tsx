import React from 'react';
import styles from './event-log.module.scss';
import { LogProps } from './types';

export const EventLog = ({ event }: LogProps) => {
  return (
    <tr className={styles.log}>
      <td>{new Date(event.date).toLocaleString('ru-Ru', { timeZone: 'UTC' })}</td>
      <td>{event.requestId}</td>
      <td>{event.type}</td>
      <td>{event.event}</td>
      <td>{event.message}</td>
      <td>
        <pre>{JSON.stringify(event.data)}</pre>
      </td>
    </tr>
  );
};
