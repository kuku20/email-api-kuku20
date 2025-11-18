import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity()
export class BaseDataHistory {
  @PrimaryColumn()
  symbol: string;

  @Column({ nullable: true })
  source?: string;

  @Column({ nullable: true })
  date?: string;

  @Column({
    type: 'text',
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  data: any;
}

@Entity({ name: 'data_history_5m' })
export class DataHistory5m extends BaseDataHistory {}

// data-history-15m.entity.ts
@Entity({ name: 'data_history_15m' })
export class DataHistory15m extends BaseDataHistory {}

// data-history-30m.entity.ts
@Entity({ name: 'data_history_30m' })
export class DataHistory30m extends BaseDataHistory {}

// data-history-1h.entity.ts
@Entity({ name: 'data_history_1h' })
export class DataHistory1h extends BaseDataHistory {}

// data-history-4h.entity.ts
@Entity({ name: 'data_history_4h' })
export class DataHistory4h extends BaseDataHistory {}

// data-history-1d.entity.ts
@Entity({ name: 'data_history_1d' })
export class DataHistory1d extends BaseDataHistory {}