import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ai_reports')
export class AIReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  type: string;

  @Column('text')
  content: string;

  @Column('float')
  confidence: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column('simple-json', { nullable: true })
  context: any;
}
