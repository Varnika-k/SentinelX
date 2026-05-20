import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('simulation_sessions')
export class SimulationSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  @Index()
  scenarioName: string;

  @Column({ type: 'varchar', default: 'paused' }) // 'running' | 'paused' | 'stopped'
  status: string;

  @Column({ type: 'integer', default: 0 })
  tickCount: number;

  @Column({ type: 'integer', default: 0 })
  activeThreatLevel: number; // 0 to 100

  @Column('simple-json', { nullable: true })
  stateCheckpoint: any; // Complete topology state snapshot

  @Column('simple-json', { nullable: true })
  branches: any; // Branch timelines representation for what-if scenarios

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
