import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('graph_snapshots')
export class GraphSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamp')
  @Index()
  timestamp: Date;

  @Column('integer')
  @Index()
  replaySequence: number;

  @Column('simple-json')
  nodes: any;

  @Column('simple-json')
  edges: any;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  sessionId: string;
}
