import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity()
export class DataHistory {
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
