import React, { ChangeEvent, useEffect, useState } from 'react';
import { makeId } from 'vivalaakam_seattle_utils';
import { LogEvent, StreamEvent } from '../../types';
import { api } from '../../api';
import { EventLog } from '../event-log';
import { EventTag } from './event-tag';
import styles from './event-logs.module.scss';

export function EventLogs() {
  const [events, setEvents] = useState<string[]>([]);
  const [activeEvents, setActiveEvents] = useState<string[]>([]);

  const [log, setLog] = useState<LogEvent[]>([]);

  const onToggleActiveItem = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setActiveEvents(elements => elements.concat(e.target.id));
    } else {
      setActiveEvents(elements => elements.filter(el => el !== e.target.id));
    }
  };

  useEffect(() => {
    api.getRegisteredEvents().then(resp => {
      setEvents(resp.events);
      setActiveEvents(resp.events);
    });
  }, []);

  useEffect(() => {
    if (activeEvents.length) {
      api.getStoredLogs({ limit: 100, filter: { event: { $in: activeEvents } } }).then(logs => {
        setLog(logs);
      });
    }
  }, [activeEvents.length]);

  useEffect(() => {
    const evtSource = new EventSource(`${api.handlers}/streamEvents`);
    evtSource.onmessage = function (event) {
      const data = JSON.parse(event.data) as StreamEvent;
      if (data.type === 'log') {
        setLog(current => current.concat({ _id: makeId(10), ...data.event }));
      }
    };
    return () => evtSource.close();
  }, []);
  return (
    <div className={styles.eventLogs}>
      <div className={styles.eventsList}>
        {events.map(evt => (
          <EventTag evt={evt} key={evt} onClick={onToggleActiveItem} active={activeEvents.includes(evt)}>
            {evt}
          </EventTag>
        ))}
      </div>

      <table className={styles.events}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Request ID</th>
            <th>Type</th>
            <th>Event</th>
            <th>Message</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {log.reverse().map(evt => (
            <EventLog key={evt._id} event={evt} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
