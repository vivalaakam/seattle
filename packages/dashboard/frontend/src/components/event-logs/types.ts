import { ChangeEvent } from 'react';

export type EventTagProps = {
  evt: string;
  onClick: (e: ChangeEvent<HTMLInputElement>) => void;
  active: boolean;
};
