import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('unified_operational_events')
export class UnifiedOperationalEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('datetime')
  @Index()
  timestamp: Date;

  @Column('varchar')
  @Index()
  eventType: string;

  @Column('varchar')
  source: string;

  @Column('varchar')
  severity: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  nodeId: string;

  @Column({ type: 'varchar', nullable: true })
  infrastructureZone: string;

  @Column({ type: 'varchar', nullable: true })
  attackStage: string;

  @Column('float', { nullable: true })
  propagationRisk: number;

  @Column('integer', { nullable: true })
  trustImpact: number;

  @Column('simple-json', { nullable: true })
  graphMutation: any;

  @Column('simple-json', { nullable: true })
  telemetry: any;

  @Column('integer')
  @Index()
  replaySequence: number;

  @Column({ type: 'varchar', nullable: true })
  mitigationState: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  correlationId: string;
}
