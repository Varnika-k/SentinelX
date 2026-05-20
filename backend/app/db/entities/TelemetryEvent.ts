import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('telemetry_events')
export class TelemetryEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  @Index()
  type: string;

  @Column('varchar')
  severity: string;

  @Column('varchar')
  source: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  nodeId: string;

  @Column({ type: 'varchar', nullable: true })
  attackerId: string;

  @Column('simple-json', { nullable: true })
  payload: any;
}
