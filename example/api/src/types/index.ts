export type Event = {
  id: string;
  name: string;
  events?: EventAttribute[];
};

export type EventAttribute = {
  id: string;
  key: string;
  value: string;
  event_id: string;
};
