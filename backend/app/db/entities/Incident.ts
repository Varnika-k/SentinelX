import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('incidents')
export class IncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('varchar')
  type: string;

  @Column('varchar')
  severity: string;

  @Column({ type: 'varchar', default: 'open' })
  status: string;

  @CreateDateColumn()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  resolution: string;

  @Column('simple-json', { nullable: true })
  timeline: any[];

  @UpdateDateColumn()
  updatedAt: Date;
}
